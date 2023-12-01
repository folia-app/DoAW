require('dotenv').config(); // Load environment variables from .env file

const { ethers, utils } = require("ethers");
const contracts = require('doaw-contracts')
const { getNetwork, getProvider } = require('./utils.js')
const { addToQueue } = require('./render.js');

if (process.env.LISTEN == "false") return
if (contracts.DoAW.networks[getNetwork()] == undefined) {
  console.error(`no DoAW contract on network ${getNetwork()}`)
  return
}
const doawContract = new ethers.Contract(
  contracts.DoAW.networks[getNetwork()].address,
  contracts.DoAW.abi, getProvider()
)



// get all previous Transfer events from doawContract
doawContract.queryFilter(doawContract.filters.Transfer(), 0)
  .then((events) => {
    events.forEach(async (event) => {
      var from = event.args[0]
      var to = event.args[1].toString()
      var tokenId = ethers.BigNumber.from(event.args[2])
      if (process.env.GENERATE_GIFS == "true" && from.toLowerCase() == ethers.constants.AddressZero.toLowerCase()) {
        console.log(`DoAW Mint:`,
          { from, to, tokenId: tokenId.toString() },
        )
        addToQueue(tokenId.toString(), 1)
      }
    })
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
