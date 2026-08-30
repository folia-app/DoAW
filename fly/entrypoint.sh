#!/bin/bash
# Runs the two DoAW processes the droplet runs, and dies if either dies so that
# Fly restarts the machine rather than leaving a half-working one up. A plain
# `server & exec listener` would leave the listener running blind after a server
# crash — it renders by driving a browser at gif.html, which the server serves.
set -euo pipefail

mkdir -p /data/gifs
chown -R node:node /data/gifs

# The GIFs are the artwork. They live on the volume, migrated from the droplet
# rather than regenerated: webgif screenshots an animating page once a second,
# so a re-render is never byte-identical to the original.
rm -rf /app/gifs
ln -sfn /data/gifs /app/gifs

echo "[entrypoint] $(ls /data/gifs 2>/dev/null | wc -l) gifs on the volume"

gosu node node /app/server/app.js &
SERVER=$!

# The renderer talks to the server over localhost, so it must not start until
# the server answers; otherwise the first mint after a boot renders a blank page.
for i in $(seq 1 60); do
  if curl -sf -o /dev/null "http://localhost:${PORT:-3003}/gif.html"; then
    echo "[entrypoint] server is up"
    break
  fi
  if ! kill -0 "$SERVER" 2>/dev/null; then
    echo "[entrypoint] server exited before becoming ready"
    exit 1
  fi
  sleep 1
done

if [ "${LISTEN:-true}" = "true" ]; then
  gosu node node /app/listen/listen.js &
  LISTENER=$!
  echo "[entrypoint] server=$SERVER listener=$LISTENER"
else
  echo "[entrypoint] LISTEN=false, running server only"
fi

wait -n
echo "[entrypoint] a child exited; shutting down so the machine restarts"
exit 1
