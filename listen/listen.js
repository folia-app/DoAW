require('dotenv').config(); // Load environment variables from .env file

const { ethers, utils } = require("ethers");
const contracts = require('doaw-contracts')
const { getNetwork, getProvider, scanLogs } = require('./utils.js')
const { addToQueue } = require('./render.js');

console.log(`listening on ${getNetwork()}`)

if (process.env.LISTEN == "false") return
if (contracts.DoAW.networks[getNetwork()] == undefined) {
  console.error(`no DoAW contract on network ${getNetwork()}`)
  return
}
const doawContract = new ethers.Contract(
  contracts.DoAW.networks[getNetwork()].address,
  contracts.DoAW.abi, getProvider()
)



// Catch up on anything minted while this was not running, so a restart closes
// gaps rather than ignoring them. Every token whose GIF is already on disk
// short-circuits in generateGif, so this costs a directory check per token and
// only renders what is genuinely missing — it never redraws the backlog.
//
// START_BLOCK exists because scanning from 0 is ~26M blocks of empty range; the
// contract was deployed in late 2023. It is only an optimisation, and setting it
// too low costs time rather than correctness.
const START_BLOCK = Number(process.env.START_BLOCK || 18000000)

async function catchUp() {
  const latest = await doawContract.provider.getBlockNumber()
  const mints = await scanLogs(
    doawContract,
    doawContract.filters.Transfer(ethers.constants.AddressZero),
    START_BLOCK,
    latest,
  )
  console.log(`found ${mints.length} mints between ${START_BLOCK} and ${latest}`)
  if (process.env.GENERATE_GIFS != "true") return
  for (const event of mints) {
    const tokenId = ethers.BigNumber.from(event.args[2])
    addToQueue(tokenId.toString(), 1)
  }
}

catchUp().catch((e) => {
  // Loud, and non-fatal: the live subscription below still handles new mints
  // even if the historical scan fails, and the next restart tries again.
  console.error(`startup catch-up failed: ${e.message}`)
})

doawContract.on('Transfer', async (...args) => {
  var from = args[0]
  var to = args[1].toString()
  var tokenId = ethers.BigNumber.from(args[2])
  if (from.toLowerCase() == ethers.constants.AddressZero.toLowerCase()) {
    console.log(`DoAW Mint:`,
      { from, to, tokenId: tokenId.toString() },
    )
    addToQueue(tokenId.toString(), 1)
  }
})
