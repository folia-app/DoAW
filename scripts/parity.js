#!/usr/bin/env node
/**
 * Old-versus-new parity for DoAW.
 *
 *   node scripts/parity.js                     droplet vs Fly, default sample
 *   node scripts/parity.js --tokens 40
 *   node scripts/parity.js --old URL --new URL
 *
 * The tokens are taken from the GIF filenames themselves rather than from the
 * chain: every file on the volume is `<entropyHex>.gif`, and the token id is
 * that hex as a decimal, so the sample is exactly the set that is actually
 * published. Compares metadata bodies, GIF bytes, the static bundle, and the
 * error cases.
 *
 * Exits non-zero on any regression, so it can gate a cutover.
 */

const fs = require('fs');
const crypto = require('crypto');

const arg = (n, d) => {
  const i = process.argv.indexOf(n);
  return i > -1 ? process.argv[i + 1] : d;
};

const OLD = arg('--old', 'http://188.166.103.115:3001');
const NEW = arg('--new', 'https://folia-doaw.fly.dev');
const SAMPLE = Number(arg('--tokens', 12));
const LIST = arg('--gifs', null);

const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

let pass = 0, fail = 0, drift = 0;
const failures = [], drifts = [];
const ok = (n) => { pass++; console.log(`  PASS  ${n}`); };
const bad = (n, d) => { fail++; failures.push(`${n}: ${d}`); console.log(`  FAIL  ${n} — ${d}`); };
const note = (n, d) => { drift++; drifts.push(`${n}: ${d}`); console.log(`  DRIFT ${n} — ${d}`); };

async function get(url, binary = false) {
  const res = await fetch(url, { redirect: 'follow' });
  const buf = Buffer.from(await res.arrayBuffer());
  return { status: res.status, headers: res.headers, body: binary ? buf : buf.toString('utf8'), bytes: buf.length, buf };
}

/**
 * The published metadata embeds an absolute baseURL. The droplet's copy is
 * reached on a bare ip and the Fly copy on fly.dev, but both must claim the
 * same public origin — that origin is what OpenSea stored. Comparing the raw
 * bodies is therefore the right test, not a normalised one.
 */
(async () => {
  console.log(`old: ${OLD}\nnew: ${NEW}\n`);

  const hexes = (LIST
    ? fs.readFileSync(LIST, 'utf8').trim().split('\n').map((l) => l.split(' ').pop())
    : []
  ).filter((f) => f.endsWith('.gif')).map((f) => f.replace('.gif', ''));

  if (!hexes.length) { console.error('need --gifs <mtimes-or-listing file>'); process.exit(1); }

  const step = Math.max(1, Math.floor(hexes.length / SAMPLE));
  const sample = hexes.filter((_, i) => i % step === 0).slice(0, SAMPLE);

  console.log(`[metadata] ${sample.length} of ${hexes.length} tokens`);
  for (const hex of sample) {
    const tokenId = BigInt('0x' + hex).toString(10);
    const label = `token …${hex.slice(-8)}`;
    const [a, b] = await Promise.all([
      get(`${OLD}/v1/metadata/${tokenId}`),
      get(`${NEW}/v1/metadata/${tokenId}`),
    ]);
    if (a.status !== b.status) { bad(`${label} metadata`, `status ${a.status} vs ${b.status}`); continue; }
    if (a.status !== 200) { ok(`${label} metadata (both ${a.status})`); continue; }
    if (a.body === b.body) { ok(`${label} metadata byte-identical`); continue; }
    let ja, jb;
    try { ja = JSON.parse(a.body); jb = JSON.parse(b.body); }
    catch { bad(`${label} metadata`, 'unparseable'); continue; }
    const keys = [...new Set([...Object.keys(ja), ...Object.keys(jb)])]
      .filter((k) => JSON.stringify(ja[k]) !== JSON.stringify(jb[k]));
    bad(`${label} metadata`, keys.map((k) => `${k}: ${ja[k]} vs ${jb[k]}`).join('; ').slice(0, 200));
  }

  console.log(`\n[gifs] ${sample.length} files`);
  for (const hex of sample) {
    const label = `…${hex.slice(-8)}.gif`;
    const [a, b] = await Promise.all([
      get(`${OLD}/${hex}.gif`, true),
      get(`${NEW}/${hex}.gif`, true),
    ]);
    if (a.status !== b.status) { bad(label, `status ${a.status} vs ${b.status}`); continue; }
    if (a.status !== 200) { note(label, `both ${a.status}`); continue; }
    if (sha(a.buf) === sha(b.buf)) {
      const ct = [a, b].map((r) => r.headers.get('content-type'));
      ct[0] === ct[1] ? ok(`${label} byte-identical (${a.bytes} bytes)`)
                      : bad(label, `content-type ${ct[0]} vs ${ct[1]}`);
    } else {
      bad(label, `${a.bytes} vs ${b.bytes} bytes`);
    }
  }

  console.log('\n[static bundle]');
  for (const p of ['/', '/nft.html', '/gif.html']) {
    const [a, b] = await Promise.all([get(`${OLD}${p}`), get(`${NEW}${p}`)]);
    if (a.status !== b.status) bad(p, `status ${a.status} vs ${b.status}`);
    else if (a.body === b.body) ok(`${p} identical (${a.status}, ${a.bytes} bytes)`);
    else note(p, `same status ${a.status}, differs by ${Math.abs(a.bytes - b.bytes)} bytes`);
  }

  console.log('\n[errors]');
  for (const t of ['0', 'zzz', '-1', '99999999999999999999999999999999999999999']) {
    const [a, b] = await Promise.all([
      get(`${OLD}/v1/metadata/${t}`),
      get(`${NEW}/v1/metadata/${t}`),
    ]);
    if (a.status !== b.status) bad(`"${t}"`, `status ${a.status} vs ${b.status}`);
    else if (a.body !== b.body) bad(`"${t}"`, `same status ${a.status}, body differs`);
    else ok(`"${t}" → both ${a.status}, identical body`);
  }

  console.log(`\n  ${pass} pass · ${fail} fail · ${drift} drift`);
  if (drift) { console.log('\n  drift:'); drifts.forEach((d) => console.log(`    ${d}`)); }
  if (fail) { console.log('\n  regressions:'); failures.forEach((f) => console.log(`    ${f}`)); }
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
