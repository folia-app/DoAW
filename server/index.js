var express = require('express');
var router = express.Router();
const fs = require('fs');
const { ethers } = require("ethers");
const path = require('path')
const { parseTokenId } = require('../listen/utils.js')

function boo(res, int) {
  return res.status(404).send(int.toString() || '404')
}

/* GET home page. */
router.get('/', function (req, res, next) {
  return boo()
});


router.get('/v1/metadata/*', async function (req, res, next) {
  let entropyHex, words, pk, address
  try {
    ({ entropyHex, words, pk, address } = parseTokenId(req.params[0]));
  } catch (e) {
    return boo(res, `Invalid Token\n${e}`);
  }
  let baseURL = process.env.baseURL

  var image = `${baseURL}/${entropyHex}.gif`
  const name = words
  const description = `${words}\n${pk}\n${address}`
  const external_url = 'https://doaw.folia.app' + `/tokens/${entropyHex}`
  const animation_url = `${baseURL}/nft.html#${entropyHex}`

  // the sauce
  const metadata = {
    name,
    description,
    // opensea
    external_url,
    image,
    // rarebits
    home_url: external_url,
    image_url: image,

    animation_url,
  }
  res.json(metadata);
})

module.exports = router;
