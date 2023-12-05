import { utils } from 'ethers';

const snds = new Audio("bithex/0.mp3");
let wdivnft = document.getElementById("wdivnft");

let addressIndex = 0, currentMnemonic, runMnemonic, entropyHex, paused, pause, run, addMnemonicToScreen, getMnemonicPhrase
try {
  let privkey, address, dpi

  let code_el = document.getElementById("code");

  let Draw
  const onResize = () => Draw && Draw()
  window.addEventListener("resize", onResize);

  paused = false
  pause = () => {
    paused = !paused
    window.parent.postMessage(entropyHex, '*');
  }

  runMnemonic = () => {
    currentMnemonic = getMnemonicPhrase(window.location.hash);
  }

  let img = new Image(), imgLoaded = false
  img.src = "bitimg/00.png";
  img.onload = () => imgLoaded = true
  var _isMuted = false
  setTimeout(() => {
    if (window.isGif) {
      currentMnemonic = getMnemonicPhrase(window.location.hash);
      addMnemonicToScreen()
      run(true)
    }
  }, 100)
  run = function (isMuted = false) {
    _isMuted = isMuted
    console.log("run")
    code.innerHTML = "";
    wdiv.innerHTML = "";
    wdivnft.innerHTML = "";
    console.log('currentMnemonic', currentMnemonic)
    addMnemonicToScreen()
    const hdNode = utils.HDNode.fromMnemonic(currentMnemonic);
    const derivationPath = `m/44'/60'/0'/0/0/${addressIndex}`;
    const account = hdNode.derivePath(derivationPath);
    privkey = account.privateKey
    // const ethPubKey = account.publicKey
    address = account.address

    code_el.innerHTML +=
      "<span class='index'> " + derivationPath + " </span>"; // addressIndex rotation endless addressIndex++
    code_el.innerHTML +=
      "<span class='address'> " + address + " </span>";
    code_el.innerHTML +=
      "<span class='privkey'> <br>" + privkey + " <br></span>";

    playScore()
  }

  getMnemonicPhrase = (entropy) => {
    console.log('entropy', entropy)
    let data
    if (entropy) {
      entropy = entropy.replaceAll("-", "")
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
      data = utils.randomBytes(16);
    }
    // show the words
    let words
    try {
      words = utils.entropyToMnemonic(data)
    } catch (e) {
      console.log({ e })
      window.location.hash = ""
      return getMnemonicPhrase()
    }
    entropyHex = uint8ArrayToHex(data);
    return words;
  }


  addMnemonicToScreen = function () {
    if (!currentMnemonic) return
    let mFA = currentMnemonic.split(" ");
    let wdiv = document.getElementById("wdiv");

    ////mnemonic phrase splash nft should be generated before run in background !!!


    for (let i = 0; i < mFA.length; i++) {
      let cell = document.createElement("div");
      cell.innerHTML = mFA[i] + " "
      cell.className = "cell";
      wdiv.appendChild(cell);

      ////mnemonic phrase splash nft should be generated before run in background !!!

      let cell1 = document.createElement("div");
      cell1.innerHTML = mFA[i] + " "
      cell1.className = "cell1";
      wdivnft.appendChild(cell1);
    }

  }

  window.addEventListener('message', msgListener)
  function msgListener(e) {
    if (e.data === 'skip') {
      skip()
    } else if (e.data === 'pause') {
      pause()
    } else {
      console.log(`Unknown message: ${e.data}`)
    }
  }
  ///////////////////////////////////////
  let index
  function skip() {
    index = 0
    addressIndex = 0
    currentMnemonic = getMnemonicPhrase();
  }

  function playScore() {

    var sounds = [...paddedPrivKey()];
    if (!_isMuted) {
      snds.src = "bithex/" + sounds[0] + ".mp3"; // TODO: preload these if there's delay on low speed network
      snds.play();
    }

    index = window.isGif ? 1 : 0;
    const noSoundTimeoutLength = window.isGif ? 1000 : 200

    const progress = function () {
      if (paused) {
        setTimeout(progress, noSoundTimeoutLength)
        return
      }
      index++;
      if (index < sounds.length) {
        if (!_isMuted) {
          snds.src = "bithex/" + sounds[index] + ".mp3";
          snds.play();
        } else {
          setTimeout(progress, noSoundTimeoutLength)
        }
        Draw(index, sounds[index]);
      } else {
        if (!_isMuted) {
          snds.pause();
        }
        index = 0;
        if (window.location.hash.indexOf(entropyHex) > -1) {
          addressIndex++;
        } else {
          skip()
        }
        run(_isMuted);
      }
    }

    Draw = async function (index, hexc) {
      var Wstr = paddedPrivKey()
      var Nextstr = Wstr.slice(0, -2)
      if (hexc !== "o" && hexc !== "x") {
        let color = "#" + Nextstr.substring(index, index + 3);
        // don't let y be part of a color code
        if (color.indexOf("y") > -1) {
          color = color.replace(/y/g, "").replace(/x/g, "").replace(/o/g, "")
          color = color + entropyHex.substring(0, 0 + 4 - color.length)
        }
        if (hexc == "y") {
          color = null
        }
        document.body.style.backgroundColor = color
      }

      let d = document.getElementById("d");
      let dtx = d.getContext("2d");
      dtx.mozImageSmoothingEnabled = false;
      dtx.webkitImageSmoothingEnabled = false;
      dtx.msImageSmoothingEnabled = false;
      dtx.imageSmoothingEnabled = false;

      const dpi = window.devicePixelRatio;

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

      // let nW = dx - 22 * sW;
      // let nH = dy - dy / 10 - sH;

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
      let i = index - 2;

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

      dtx.fillStyle = dtx_color;
      dtx.fillRect(
        note.x,
        dtx_note_y,
        note.width,
        note.height
      );
    }


    if (!_isMuted) {
      snds.onended = progress
    } else {
      progress()
    }

  }


  // helpers
  var yRepeat

  function paddedPrivKey() {
    if (!yRepeat) {
      var width = +getComputedStyle(d).getPropertyValue("width").slice(0, -2) * window.devicePixelRatio
      var widthPerY = window.isGif ? 35 : 60
      yRepeat = window.isGif ? 0 : Math.ceil(width / widthPerY)
      // document.getElementById("debug").innerHTML = `width is ${width}<br>window.devicePixelRatio is ${window.devicePixelRatio}<br> isGif = ${window.isGif}`
      // console.log({ yRepeat })
    }
    var str1 = privkey.replace("0x", "ox").toLowerCase();
    // str1 += entropyHex.substr(0, 3)
    str1 = window.isGif ? str1 + str1 : str1
    var str2 = "y".repeat(yRepeat); //hack 37 y before to make scrore come from right
    var str3 = window.isGif ? "" : "yyy"; //hack 3 y after to make scrore disapear left
    return str2.concat(str1).concat(str3);
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

} catch (e) {
  console.log(e)
}
export {
  pause,
  run,
  addressIndex,
  entropyHex,
  snds,
  addMnemonicToScreen,
  runMnemonic
};
