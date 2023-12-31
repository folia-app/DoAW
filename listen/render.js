const { ethers, utils } = require("ethers");
var fetch = require("node-fetch")
const fs = require('fs');
const client = require('https');
const { spawn } = require('child_process');
const { wait, refreshOpensea, getNetwork, parseTokenId } = require('./utils.js')
const path = require('path')
const preloads = {}
let lastCheckedQueueLength = 0
const queue = []
const currentSpawns = []
var os = require('os');
var cores = os.cpus().length
const servers = process.env.SERVERS ? parseInt(process.env.SERVERS) : 1
const maxSpawns = Math.ceil((cores > 4 ? cores - 4 : 1) / servers)
console.log(`max spawns: ${maxSpawns}`)

const contracts = require('doaw-contracts')
const contractAddress = contracts['DoAW']['networks'][getNetwork()].address;

let totalTime = 0
let numberOfGifs = 0

const queueChecker = setInterval(() => {
  if (lastCheckedQueueLength !== queue.length) {
    lastCheckedQueueLength = queue.length
    console.log(`queue length: ${queue.length}`)
  }
  while (queue.length > 0 && currentSpawns.length < maxSpawns) {
    console.log('spawning')
    const next = queue.shift()
    console.log(`next: ${next}`, `There are ${currentSpawns.length} current spawns, and ${queue.length} in the queue. The max spawn is ${maxSpawns}`)
    generateGif(next)
  }
}, 5000)


var addToQueue = async function (tokenId) {

  let entropyHex, words, pk, address
  ({ entropyHex } = parseTokenId(tokenId));

  const queueIndex = queue.indexOf(entropyHex)
  const currentSpawnsIndex = currentSpawns.indexOf(entropyHex)

  // make sure that gif is in queue
  if (queueIndex < 0 && currentSpawnsIndex < 0) {
    console.log(`adding ${entropyHex} to queue`)
    queue.unshift(entropyHex)
  } else if (queueIndex > -1) {
    console.log(`${entropyHex} already in queue at position ${queueIndex}`)
    if (queueIndex != 0) {
      console.log(`moving ${entropyHex} to front of queue`)
      // move to front of queue
      queue.splice(queueIndex, 1)
      queue.unshift(entropyHex)
    }
  } else {
    console.log(`${entropyHex} already in currentSpawns at position ${currentSpawnsIndex}`)
  }
}

// var generatePlaceholderAndGif = async function (tokenId) {
//   const dirPrefix = "public/" + (process.env.network == "homestead" ? "" : process.env.network + "-") + "gifs/"
//   // check if gif is already generated
//   // if so, return gif
//   const filename = path.join(__dirname, dirPrefix + `${tokenId}/complete.gif`)
//   try {
//     fs.accessSync(filename)
//     return filename
//   } catch (_) {
//     console.log(`no gif found at ${filename}`)
//   }

//   addToQueue(tokenId, viperLength)

//   // check if placeholder img is already generated
//   // if so, return placeholder img
//   // const placeHolderFilename = path.join(__dirname, `output/placeholder/${tokenId}.png`)
//   const placeHolderFilename = path.join(__dirname, `public/viper-loading-loop.gif`)
//   try {
//     fs.accessSync(placeHolderFilename)
//     return placeHolderFilename
//   } catch (_) {
//     console.log(`no placeholder found at ${placeHolderFilename}, begin generation`)
//   }

//   // create placeholder img
//   // return placeholder img filename
//   return await generatePlaceholder(tokenId, viperLength)
// }

const pokeOS = async (tokenId) => {
  // if token exists on chain, refresh it on opensea
  const address = contractAddress
  refreshOpensea(getNetwork(), address, tokenId.toString()).then((response) => {
    console.log(`refresh metadata for ${tokenId} on opensea resulted in ${response.status}`, { response })
  }).catch(e => {
    console.log(`ERROR: refresh metadata error from opensea api call`, { e })
  })

}

const generateGif = async function (tokenId) {

  const tokenInfo = parseTokenId(tokenId)
  // generate gif
  console.log(`generateGif ${tokenId}`)
  if (currentSpawns.length >= maxSpawns) {
    console.log('max spawns reached, returning without running')
    return
  }

  currentSpawns.push(tokenId)
  const dirPrefix = "../gifs/"

  // check if gif is already generated
  // if so, return gif
  const filename = path.join(__dirname, dirPrefix + `${tokenId}.gif`)
  try {
    fs.accessSync(filename)
    console.log(`gif already exists at ${filename}, removing from currentSpans queue`)
    currentSpawns.splice(currentSpawns.indexOf(tokenId), 1)
    console.log('wait 500')
    await wait(500)
    pokeOS(tokenInfo.tokenId)
    return
  } catch (_) { }


  const start = new Date().getTime();
  const child = spawn(`yarn`, ['webgif', '-u', `${process.env.GIF_URL}#${tokenId}`, '-o', filename])

  child.stdout.on('data', data => {
    if (data != '.') {
      console.log(`stdout-${tokenId}:\n${data}`);
    }
  });

  child.stderr.on('data', data => {
    console.error(`stderr-${tokenId}: ${data}`);
  });

  child.on('error', (error) => {
    console.error(`error-${tokenId}: ${error.message}`);
  });
  child.on('close', async (code) => {
    const end = new Date().getTime();


    console.log(`child process exited with code ${code} while running on ${tokenId}`);
    console.log(`checking if ${filename} exists`)
    try {
      fs.accessSync(filename)
      const duration = end - start
      totalTime += duration
      numberOfGifs++
      console.log(`gif completed at : ${filename} in a time of ${duration / 1000} s, average time: ${(totalTime / numberOfGifs) / 1000} s`)


    } catch (e) {
      console.log({ e })
      console.log(`exited without completing the gif, adding back to queue: ${tokenId}`)
      currentSpawns.splice(currentSpawns.indexOf(tokenId), 1)
      queue.unshift(tokenId)
      return
    }

    try {
      console.log('now that gif is complete, try optimizing it')
      await optimizeGif(filename)
    } catch (e) {
      console.log(`failed to optimize gif, exited with error:`, { e })
    }
    const tokenInfo = parseTokenId(tokenId)
    await wait(500)
    console.log('wait 500')
    pokeOS(tokenInfo.tokenId)

    console.log('done trying to optimize gif, OK to remove from queue whether optimization worked or not')
    currentSpawns.splice(currentSpawns.indexOf(tokenId), 1)

  });
}

var optimizeGif = async function (filename) {
  return new Promise((resolve, reject) => {
    // npx gifsicle -O2 -b --colors 256 -o foo.gif --resize-width 512
    const child = spawn(`gifsicle`, ['-b', '-O2', '--colors', '256', '--resize-width', '512', filename])

    child.stdout.on('data', data => {
      console.log(`stdout-gifsicle:\n${data}`);
    });
    child.stderr.on('data', data => {
      console.error(`stderr-gifsicle: ${data}`);
    });
    child.on('error', (error) => {
      console.error(`error-gifsicle: ${error.message}`);
    });
    child.on('close', async (code) => {
      console.log(`child process exited with code ${code} while running gifsicle`);
      if (code == 0) {
        resolve()
      } else {
        reject(code)
      }
    })
  })
}

// var generatePlaceholder = async function (tokenId, viperLength) {
//   // generate placeholder img
//   console.log('generate placeholder')
//   const canvas = createCanvas(686, 686)
//   const ctx = canvas.getContext('2d')
//   ctx.font = "bold 32px serif";
//   ctx.fillText(`please wait while viper #${tokenId}`, 100, 243)
//   ctx.fillText(` is being generated`, 100, 343)
//   // save placeholder img
//   const filename = `${__dirname}/output/placeholder/${tokenId}.png`
//   const out = fs.createWriteStream(filename)
//   const stream = canvas.createPNGStream()
//   stream.pipe(out)
//   return new Promise((resolve, reject) => {
//     out.on('finish', () => resolve(filename))
//     out.on('error', reject)
//   })
// }

module.exports = { generateGif, addToQueue }

