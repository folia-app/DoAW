const libs = require('./bip39-libs.js');
const { Mnemonic } = require('./jsbip39.js');

let snds = new Audio("bithex/0.mp3");

if (window.location.hash !== "" && window.location.hash !== "#") {
  document.getElementsByTagName("body")[0].classList.add("has-entropy");
  // get body
}
let privkey, entropyHex, address, currentMnemonic, addressIndex = 0

let seed, bip32RootKey, bip32ExtendedKey
const network = libs.bitcoin.networks.bitcoin, mnemonicUtil = new Mnemonic("english")
console.log({ network })
let code_el = document.getElementById("code");
let splash = document.getElementById('parent')
console.log("splash", splash)

function custom(event) {
  var el = document.getElementById("hov");
  el.style.top = event.clientY + "px";
  el.style.left = event.clientX + "px";
}

document.addEventListener('mousemove', custom);

// setTimeout(run, 2000) // TODO: use something like this for server

document.addEventListener('click', clickFunction)
let clicked = false
function clickFunction() {
  if (!clicked) {
    splash.style.display = "none";
    snds.play();
    run();
    clicked = true
  } else {
    if (window.location.hash !== "" && window.location.hash !== "#") {
      window.location.hash = ""
      popdown()
    } else {
      window.location.hash = entropyHex
      popup()
    }
  }
}

// populateIndex()

let Draw
const onResize = () => Draw && Draw()
window.addEventListener("resize", onResize);

let img = new Image(), imgLoaded = false
img.src = "bitimg/00.png";
img.onload = () => imgLoaded = true

function popup() {
  let popup = document.getElementById("popup");
  popup.style.display = "block";
  let popupText = document.getElementById("popupText");
  popupText.innerHTML = "Connect Wallet to mint " + entropyHex;
}
function popdown() {
  let popup = document.getElementById("popup");
  popup.style.display = "none";
}

function populateIndex() {
  let index = document.getElementById("index");
  for (let i = 0; i < 10; i++) {
    // append iframe to index
    // let iframe = document.createElement("iframe");
    // iframe.src = "/img/" + (Math.floor(Math.random() * 3) + 1) + ".png";
    // iframe.className = "iframe";

    let iframe = document.createElement("img");
    iframe.src = "/img/" + (Math.floor(Math.random() * 3) + 1) + ".png";
    index.appendChild(iframe);
  }

}

function run() {
  code.innerHTML = "";
  wdiv.innerHTML = "";
  currentMnemonic = getMnemonicPhrase(window.location.hash);
  console.log(currentMnemonic)
  calcBip32RootKeyFromSeed(currentMnemonic)
  const derivationPath = "m/44'/60'/0'/0";
  var errorText = findDerivationPathErrors(derivationPath);
  if (errorText) {
    throw new Error(errorText); // TODO: catch error
  }
  bip32ExtendedKey = calcBip32ExtendedKey(derivationPath);

  let key = bip32ExtendedKey.derive(addressIndex);

  code_el.innerHTML +=
    "<span class='index'> " + derivationPath + "/" + addressIndex + " </span>"; // addressIndex rotation endless addressIndex++

  var ethPubkey = libs.ethUtil.importPublic(key.keyPair.getPublicKeyBuffer());
  var hexAddress = libs.ethUtil.publicToAddress(ethPubkey).toString("hex")
  var checksumAddress = libs.ethUtil.toChecksumAddress(hexAddress);
  address = libs.ethUtil.addHexPrefix(checksumAddress);
  code_el.innerHTML +=
    "<span class='address'> " + address + " </span>";

  var hasPrivkey = !key.isNeutered();
  privkey = "NA";
  if (hasPrivkey) {
    privkey = key.keyPair.toWIF()
    privkey = libs.ethUtil.bufferToHex(key.keyPair.d.toBuffer(32))
    privkey = privkey.replace(" ", "")
    code_el.innerHTML +=
      "<span class='privkey'> <br>" + privkey + " <br></span>";
  }

  playScore()
}

function getMnemonicPhrase(entropy) {
  let data
  if (entropy) {
    entropy = entropy.replace("#", "")
    try {
      data = hexToBytes(entropy);
    } catch (e) {
      console.log(e)
      window.location.hash = ""
    }
  }
  if (!data) {
    if (!hasStrongRandom()) {
      throw new Error("This browser does not support strong randomness");// TODO: catch error
    }
    // get the amount of entropy to use
    var numWords = 12;
    var strength = (numWords / 3) * 32;
    var buffer = new Uint8Array(strength / 8);
    // create secure entropy
    data = crypto.getRandomValues(buffer);
  }
  // show the words
  let words
  try {
    words = mnemonicUtil.toMnemonic(data);
  } catch (e) {
    console.log({ e })
    window.location.hash = ""
    return getMnemonicPhrase()
  }
  entropyHex = uint8ArrayToHex(data);
  return words;
}

///////////////////////////////////////

function playScore() {

  let mFA = currentMnemonic.split(" ");
  let wdiv = document.getElementById("wdiv");

  for (let i = 0; i < mFA.length; i++) {
    let cell = document.createElement("div");
    cell.innerHTML = mFA[i];
    cell.className = "cell";
    wdiv.appendChild(cell);
  }

  var sounds = [...paddedPrivKey()];
  snds.src = "bithex/" + sounds[0] + ".mp3"; // TODO: preload these if there's delay on low speed network
  snds.play();
  let index = 0;

  snds.onended = function () {
    index++;
    if (index < sounds.length) {
      snds.src = "bithex/" + sounds[index] + ".mp3";
      snds.play();
      Draw(index, sounds[index]);
    } else {
      snds.pause();
      index = 0;
      if (window.location.hash.indexOf(entropyHex) > -1) {
        addressIndex++;
      }
      run();
    }
  }

  Draw = async function (index, hexc) {
    var Wstr = paddedPrivKey()
    var Nextstr = Wstr.slice(0, -2).concat(entropyHex);

    if (hexc !== "o" && hexc !== "x") {
      document.body.style.backgroundColor = "#" + Nextstr.substring(index, index + 3);
    }

    let d = document.getElementById("d");
    let dtx = d.getContext("2d");
    dtx.mozImageSmoothingEnabled = false;
    dtx.webkitImageSmoothingEnabled = false;
    dtx.msImageSmoothingEnabled = false;
    dtx.imageSmoothingEnabled = false;

    dpi = window.devicePixelRatio;

    //create a style object that returns width and height
    let style = {
      height() {
        return +getComputedStyle(d).getPropertyValue("height").slice(0, -2);
      },
      width() {
        return +getComputedStyle(d).getPropertyValue("width").slice(0, -2);
      },
    };
    //set the correct attributes for a crystal clear image!
    d.setAttribute("width", style.width() * dpi);
    d.setAttribute("height", style.height() * dpi);

    const dx = d.width / 2;
    const dy = d.height;

    const scale = dy / 2600;
    const width = 128;
    const height = 2048;

    const sW = scale * width;
    const sH = scale * height;

    var note = {
      x: 2 * sW,
      y: 0,
      width: sW,
      height: sW,
    };

    nW = dx - 22 * sW;
    nH = dy - dy / 10 - sH;

    dtx.fillStyle = "#000";

    // can't imagine anyone clicks the loader before img is loaded, but if they do, this will wait for it
    if (!imgLoaded) {
      await new Promise((resolve) => {
        let checkLoaded = setInterval(() => {
          if (imgLoaded) {
            clearInterval(checkLoaded);
            resolve();
          }
        }, 100);
      })
    }

    dtx.drawImage(img, 0, 0, width, height, 2 * sW, 0, sW, sH);

    dtx.lineWidth = 2;
    i = index - 2;

    const hex_to_color_and_multiplier_key = {
      "f": { color: "#333", multiplier: 0 },
      "e": { color: "#00d", multiplier: 1 },
      "d": { color: "#d00", multiplier: 2 },
      "c": { color: "#d0d", multiplier: 3 },
      "b": { color: "#0d0", multiplier: 4 },
      "a": { color: "#0dd", multiplier: 5 },
      "9": { color: "#dd0", multiplier: 6 },
      "8": { color: "#ddd", multiplier: 7 },
      "7": { color: "#000", multiplier: 8 },
      "6": { color: "#00f", multiplier: 9 },
      "5": { color: "#f00", multiplier: 10 },
      "4": { color: "#f0f", multiplier: 11 },
      "3": { color: "#0f0", multiplier: 12 },
      "2": { color: "#0ff", multiplier: 13 },
      "1": { color: "#ff0", multiplier: 14 },
      "0": { color: "#fff", multiplier: 15 },
    }

    var fontSize = sW + "px";
    var fontFamily = "zx-spectrum";
    dtx.font = fontSize + " " + fontFamily;

    for (let k = 0; k < Wstr.length; k++) {
      if (Wstr[k] == "y") continue

      let sy, sx
      switch (Wstr[k]) {
        case "o":
          sy = height - width;
          sx = 0;
          break;
        case "x":
          sx = width
          sy = 0
          break;
        default:
          sx = width * 3
          sy = width * hex_to_color_and_multiplier_key[Wstr[k]].multiplier
          break;
      }

      dtx.drawImage(
        img,
        sx,
        sy,
        width,
        width,
        note.x + note.width * k - 2 * note.width - (note.width * i),
        dy - dy / 10,
        sW,
        sW
      );

      if (Wstr[k] !== "o" && Wstr[k] !== "x") {
        dtx.fillStyle = "#000";
        dtx.fillRect(
          note.x + note.width * k - 2 * note.width - (note.width * i),
          note.y + note.height * hex_to_color_and_multiplier_key[Wstr[k]].multiplier,
          note.width,
          note.height
        );
      }
    }

    // check if hexc is in hex_to_color_and_multiplier_key
    if (!(hexc in hex_to_color_and_multiplier_key)) {
      return;
    }
    const dtx_color = hex_to_color_and_multiplier_key[hexc].color
    const dtx_note_y = note.y + note.height * hex_to_color_and_multiplier_key[hexc].multiplier;

    dtx.strokeStyle = dtx_color
    dtx.fillStyle = dtx_color;
    dtx.fillRect(
      note.x,
      dtx_note_y,
      note.width,
      note.height
    );
    if (hexc == "0") {
      dtx.lineWidth = 1; // TODO: confirm the lineWidth doesn't change anywhere else? Does it need to be reset for others?
    }
    dtx.strokeRect(
      note.x,
      dtx_note_y,
      note.width,
      note.height
    );
  }
}


// helpers

function paddedPrivKey() {
  // TODO: Can be calculated to be the width of the screen so it's not empty on narrow screens
  var str1 = privkey.replace("0x", "ox").toLowerCase();
  var str2 = "yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy"; //hack 37 y before to make scrore come from right
  var str3 = "yyy";//hack 3 y after to make scrore disapear left
  return str2.concat(str1).concat(str3);
}
function calcBip32ExtendedKey(path) {
  // Check there's a root key to derive from
  if (!bip32RootKey) {
    throw new Error("No root key"); // TODO: catch error
  }
  var extendedKey = bip32RootKey;
  // Derive the key from the path
  var pathBits = path.split("/");
  for (var i = 0; i < pathBits.length; i++) {
    var bit = pathBits[i];
    var index = parseInt(bit);
    if (isNaN(index)) {
      continue;
    }
    var hardened = bit[bit.length - 1] == "'";
    var isPriv = !extendedKey.isNeutered();
    var invalidDerivationPath = hardened && !isPriv;
    if (invalidDerivationPath) {
      extendedKey = null;
    } else if (hardened) {
      extendedKey = extendedKey.deriveHardened(index);
    } else {
      extendedKey = extendedKey.derive(index);
    }
  }
  return extendedKey;
}
const hexToBytes = (hextropy) => {
  var bytes = [];
  for (var c = 0; c < hextropy.length; c += 2) {
    const int = parseInt(hextropy.substr(c, 2), 16)
    if (isNaN(int)) throw new Error("Entropy is not valid hex")
    bytes.push(int);
  }
  return bytes;
}
function hasStrongRandom() {
  return "crypto" in window && window["crypto"] !== null;
}
function uint8ArrayToHex(a) {
  var s = "";
  for (var i = 0; i < a.length; i++) {
    var h = a[i].toString(16);
    while (h.length < 2) {
      h = "0" + h;
    }
    s = s + h;
  }
  return s;
}
function findDerivationPathErrors(path) {
  var maxDepth = 255;
  var maxIndexValue = Math.pow(2, 31);
  if (path[0] != "m") {
    return "First character must be 'm'";
  }
  if (path.length > 1) {
    if (path[1] != "/") {
      return "Separator must be '/'";
    }
    var indexes = path.split("/");
    if (indexes.length > maxDepth) {
      return (
        "Derivation depth is " +
        indexes.length +
        ", must be less than " +
        maxDepth
      );
    }
    for (var depth = 1; depth < indexes.length; depth++) {
      var index = indexes[depth];
      var invalidChars = index.replace(/^[0-9]+'?$/g, "");
      if (invalidChars.length > 0) {
        return (
          "Invalid characters " + invalidChars + " found at depth " + depth
        );
      }
      var indexValue = parseInt(index.replace("'", ""));
      if (isNaN(depth)) {
        return "Invalid number at depth " + depth;
      }
      if (indexValue > maxIndexValue) {
        return (
          "Value of " +
          indexValue +
          " at depth " +
          depth +
          " must be less than " +
          maxIndexValue
        );
      }
    }
  }
  // Check root key exists or else derivation path is useless!
  if (!bip32RootKey) {
    return "No root key";
  }
  return false;
}
function calcBip32RootKeyFromSeed(phrase, passphrase) {
  seed = mnemonicUtil.toSeed(phrase, passphrase);
  bip32RootKey = libs.bitcoin.HDNode.fromSeedHex(seed, network);
}
