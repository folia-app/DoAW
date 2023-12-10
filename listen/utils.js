const { ethers } = require("ethers");
// const contracts = require('doaw-contracts')

function parseTokenId(tokenId) {
  const isNumber = /^\d+$/.test(tokenId);
  const isHex = /^0x[0-9A-Fa-f]+$/.test(tokenId);
  if (!isNumber && !isHex) tokenId = "0x" + tokenId
  // check if tokenId would be accepted by BigNumber as a number
  tokenId = ethers.BigNumber.from(tokenId)
  const entropyHex = tokenId.toHexString(16).replace('0x', '').padStart(32, '0')
  console.log({ entropyHex })
  let data = hexToBytes(entropyHex)
  const words = ethers.utils.entropyToMnemonic(data)
  const path = ethers.utils.defaultPath
  const hdNode = ethers.utils.HDNode.fromMnemonic(words)
  const pk = hdNode.derivePath(path).privateKey
  const wallet = new ethers.Wallet(pk)
  const address = wallet.address
  return {
    tokenId,
    entropyHex,
    data,
    words,
    hdNode,
    pk,
    wallet,
    address
  }
}

const hexToBytes = (hextropy) => {
  var bytes = []
  for (var c = 0; c < hextropy.length; c += 2) {
    const int = parseInt(hextropy.substr(c, 2), 16)
    if (isNaN(int)) throw new Error('Entropy is not valid hex')
    bytes.push(int)
  }
  return bytes
}


function getNetwork() {
  return process.env.network
}

function getNetworkId() {
  const networks = {
    'homestead': '1',
    'sepolia': '11155111',
    'rinkeby': '4'
  }
  const networkID = networks[getNetwork()]
  return networkID
}

var refreshOpensea = function (network, address, tokenID) {
  if (network !== 'homestead') return new Promise((resolve, reject) => reject('opensea doesn\'t support metadata refresh on testnet'))
  return new Promise((resolve, reject) => {
    // https://testnets-api.opensea.io/api/v1/asset/<your_contract_address>/<token_id>/?force_update=true
    // https://testnets-api.opensea.io/v2/chain/sepolia/contract/0xc8a395e3b82e515f88e0ef548124c114f16ce9e3/nfts/1?limit=50
    // const subdomain = network == 'homestead' ? 'api' : 'testnets-api'
    // var url = `https://${subdomain}.opensea.io/api/v1/asset/${address}/${tokenID}/?force_update=true`

    const options = {
      method: 'POST',
      headers: { accept: 'application/json', 'X-API-KEY': process.env.opensea_api }
    };
    const url = `https://api.opensea.io/v2/chain/ethereum/contract/${address}/nfts/${tokenID}/refresh`
    fetch(url, options)
      // .then(response => response.json())
      // .then(response => console.log(response))
      // .catch(err => console.error(err));
      // fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error('OS Network response was not ok, it was ' + response.status + ' with url ' + url)
        }
        const contentType = response.headers.get('Content-Type')
        if (!contentType || !contentType.includes('application/json')) {
          throw new TypeError('OS Response was not JSON')
        }
        return response.json()
      })
      .then(data => {
        resolve({ status: 'success', data, url })
      })
      .catch(error => {
        resolve({ status: 'error', data: error, url })
      })
  })
}

function getProvider() {
  const provider = new ethers.providers.InfuraProvider(
    getNetwork(),
    process.env.INFURA_API_KEY,
  );
  return provider
}

function boo(res, int) {
  return res.status(404).send(int.toString() || '404')
}

module.exports = { refreshOpensea, boo, getNetwork, getNetworkId, getProvider, parseTokenId, hexToBytes }