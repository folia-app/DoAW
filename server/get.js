// var express = require('express');
// // const { ethers, utils } = require("ethers");
// const fs = require('fs');
// const path = require('path')
// var router = express.Router();
// const { parseTokenId } = require('../listen/utils.js')

// router.get('/img/*', async function (req, res, next) {
//   let tokenId, entropyHex
//   try {
//     ({ tokenId, entropyHex } = parseTokenId(req.params[0]));
//   } catch (e) {
//     return boo(res, `Invalid Token\n${e}`);
//   }
//   try {
//     // check whether image exists, if so add ?c=datetime to the end of the filename
//     let filename = entropyHex + ".gif"
//     let imagePath = path.join(__dirname, '../gifs/', filename)

//     const fileExists = fs.existsSync(imagePath)
//     if (!fileExists) {
//       console.log(`File ${imagePath} does not exist, serving loading gif`)
//       imagePath = path.join(__dirname, '../public/', "loading.gif")
//     }
//     return returnFile(filename, req, res, next)
//   } catch (err) {
//     console.log({ err })
//     return res.status(400).send(err)
//   }
// })

// function returnFile(filename, req, res, next) {
//   const cache = (filename.indexOf("loading.gif") > -1 ? (1 / 60) : 15) * 60 // 1 sec or 15 minutes
//   res.set('Cache-control', `public, max-age=${cache}`)

//   var options = {
//     // root: path.join(__dirname, 'public'),
//     dotfiles: 'deny',
//     headers: {
//       'x-timestamp': Date.now(),
//       'x-sent': true
//     }
//   }
//   res.sendFile(filename, options, function (err) {
//     if (err) {
//       next(err)
//     } else {
//       console.log('Sent:', filename)
//     }
//   })
// }

// module.exports = router;
