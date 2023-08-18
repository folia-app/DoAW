(function () {
  // mnemonics is populated as required by getLanguage
  
  var mnemonics = { english: new Mnemonic("english") };
  var mnemonic = mnemonics["english"];
  var seed = null;
  var bip32RootKey = null;
  var bip32ExtendedKey = null;
  var network = libs.bitcoin.networks.bitcoin;

  var generationProcesses = [];

  let mnemonicF = document.getElementById("mnemonicF");
  let tokenID = document.getElementById("tokenID");
  let code = document.getElementById("code");

  let snds = new Audio("bithex/0.mp3");

  function init() {
    generateClicked();
  }

  function run() {
    code.innerHTML = "";
    wdiv.innerHTML = "";
    generateClicked();
  }

  // Event handlers

  function phraseChanged(phrase) {
    setMnemonicLanguage();
    // Get the mnemonic phrase

    var errorText = findPhraseErrors(phrase);
    if (errorText) {
      showValidationError(errorText);
      return;
    }
    // Calculate and display
    calcBip32RootKeyFromSeed(phrase);
    calcForDerivationPath();
    // Show the word indexes
    showWordIndexes();
    writeSplitPhrase(phrase);
  }

  function calcForDerivationPath() {
    stopGenerating();
    // Get the derivation path
    var derivationPath = "m/44'/60'/0'/0";
    var errorText = findDerivationPathErrors(derivationPath);
    if (errorText) {
      showValidationError(errorText);
      return;
    }
    bip32ExtendedKey = calcBip32ExtendedKey(derivationPath);
    displayBip32Info();
  }

  function generateClicked() {
    stopGenerating();

    setTimeout(function () {
      setMnemonicLanguage();
      var phrase = generateRandomPhrase();
      if (!phrase) {
        return;
      }

      phraseChanged(phrase);
    }, 50); //50
  }

  // Private methods

  function generateRandomPhrase() {
    if (!hasStrongRandom()) {
      var errorText = "This browser does not support strong randomness";
      showValidationError(errorText);
      return;
    }
    // get the amount of entropy to use
    var numWords = 12;
    var strength = (numWords / 3) * 32;
    var buffer = new Uint8Array(strength / 8);
    // create secure entropy
    var data = crypto.getRandomValues(buffer);
    // show the words
    var words = mnemonic.toMnemonic(data);
    // code.innerHTML += "<span class='phrase' > " + words + " </span>";
    mnemonicF.innerHTML = words;

    // show the entropy
    var entropyHex = uint8ArrayToHex(data);
    code.innerHTML +=
      "<span id='entropy' class='entropy'> " + entropyHex + " </span>";

    //return ;
    return words;
  }

  function calcBip32RootKeyFromSeed(phrase, passphrase) {
    seed = mnemonic.toSeed(phrase, passphrase);
    bip32RootKey = libs.bitcoin.HDNode.fromSeedHex(seed, network);
  }

  function calcBip32ExtendedKey(path) {
    // Check there's a root key to derive from
    if (!bip32RootKey) {
      return bip32RootKey;
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

  function findPhraseErrors(phrase) {
    // Preprocess the words
    phrase = mnemonic.normalizeString(phrase);
    var words = phraseToWordArray(phrase);
    // Detect blank phrase
    if (words.length == 0) {
      return "Blank mnemonic";
    }
    // Check each word
    for (var i = 0; i < words.length; i++) {
      var word = words[i];
      var language = getLanguage();
      if (WORDLISTS[language].indexOf(word) == -1) {
        console.log("Finding closest match to " + word);
        var nearestWord = findNearestWord(word);
        return word + " not in wordlist, did you mean " + nearestWord + "?";
      }
    }
    // Check the words are valid
    var properPhrase = wordArrayToPhrase(words);
    var isValid = mnemonic.check(properPhrase);
    if (!isValid) {
      return "Invalid mnemonic";
    }
    return false;
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

  function displayBip32Info() {
    // Display the key
    // code.innerHTML += "<span class='seed'> " + seed + " </span>";

    var rootKey = bip32RootKey.toBase58();
    // code.innerHTML += "<span class='root-key'> " + rootKey + " </span>";

    var xprvkeyB58 = "NA";
    if (!bip32ExtendedKey.isNeutered()) {
      xprvkeyB58 = bip32ExtendedKey.toBase58();
    }
    var extendedPrivKey = xprvkeyB58;
    // code.innerHTML +=
    //   "<span class='extended-priv-key'> " + extendedPrivKey + " </span>";

    var extendedPubKey = bip32ExtendedKey.neutered().toBase58();
    // code.innerHTML +=
    //   "<span class='extended-pub-key'> " + extendedPubKey + " </span>";

    // Display the addresses and privkeys

    stopGenerating();
    //amount of adresses
    var initialAddressCount = 1;
    displayAddresses(initialAddressCount);
  }

  function displayAddresses(total) {
    generationProcesses.push(
      new (function () {
        var rows = [];

        this.stop = function () {
          for (var i = 0; i < rows.length; i++) {
            rows[i].shouldGenerate = false;
          }
        };

        for (var i = 0; i < total; i++) {
          var index = i;
          rows.push(new PathRow(index));
        }
      })()
    );
  }

  function PathRow(index) {
    var self = this;
    this.shouldGenerate = true;

    function initval() {
      calculateValues();
    }

    function calculateValues() {
      setTimeout(function () {
        if (!self.shouldGenerate) {
          return;
        }
        var key = "NA";

        key = bip32ExtendedKey.derive(index);
        var keyPair = key.keyPair;

        var hasPrivkey = !key.isNeutered();
        var privkey = "NA";
        if (hasPrivkey) {
          privkey = keyPair.toWIF();
        }
        // get pubkey

        code.innerHTML +=
          "<span class='index'> " + "m/44'/60'/0'/0" + "/" + index + " </span>"; // index rotation endless index++

        var pubkeyBuffer = keyPair.getPublicKeyBuffer();
        var ethPubkey = libs.ethUtil.importPublic(pubkeyBuffer);
        var addressBuffer = libs.ethUtil.publicToAddress(ethPubkey);
        var hexAddress = addressBuffer.toString("hex");
        var checksumAddress = libs.ethUtil.toChecksumAddress(hexAddress);
        var address = libs.ethUtil.addHexPrefix(checksumAddress);
        code.innerHTML += "<span class='address'> " + address + " </span>";
        var pubkey = libs.ethUtil.addHexPrefix(ethPubkey.toString("hex"));
        // code.innerHTML += "<span class='pubkey'> " + pubkey + " </span>";
        if (hasPrivkey) {
          privkey = libs.ethUtil.bufferToHex(keyPair.d.toBuffer(32));
          code.innerHTML += "<span class='privkey'> <br>" + privkey + " <br></span>";
        }

        if (index == 0) {
          addprivkeyTokenID(privkey);
        }
      }, 50);
    }

    initval();
  }

  function stopGenerating() {
    while (generationProcesses.length > 0) {
      var generation = generationProcesses.shift();
      generation.stop();
    }
  }

  function addprivkeyTokenID(privkey) {
    tokenID.innerHTML = privkey;
    score();
  }

  function hasStrongRandom() {
    return "crypto" in window && window["crypto"] !== null;
  }

  function findNearestWord(word) {
    var language = getLanguage();
    var words = WORDLISTS[language];
    var minDistance = 99;
    var closestWord = words[0];
    for (var i = 0; i < words.length; i++) {
      var comparedTo = words[i];
      if (comparedTo.indexOf(word) == 0) {
        return comparedTo;
      }
      var distance = libs.levenshtein.get(word, comparedTo);
      if (distance < minDistance) {
        closestWord = comparedTo;
        minDistance = distance;
      }
    }
    return closestWord;
  }

  function getLanguage() {
    var defaultLanguage = "english";
    // Try to get from existing phrase
    var language = getLanguageFromPhrase();
    // Try to get from url if not from phrase
    if (language.length == 0) {
      language = getLanguageFromUrl();
    }
    // Default to English if no other option
    if (language.length == 0) {
      language = defaultLanguage;
    }
    return language;
  }

  function getLanguageFromPhrase(phrase) {
    // Check if how many words from existing phrase match a language.
    var language = "";
    if (!phrase) {
      phrase = "";
    }
    if (phrase.length > 0) {
      var words = phraseToWordArray(phrase);
      var languageMatches = {};
      for (l in WORDLISTS) {
        // Track how many words match in this language
        languageMatches[l] = 0;
        for (var i = 0; i < words.length; i++) {
          var wordInLanguage = WORDLISTS[l].indexOf(words[i]) > -1;
          if (wordInLanguage) {
            languageMatches[l]++;
          }
        }
        // Find languages with most word matches.
        // This is made difficult due to commonalities between Chinese
        // simplified vs traditional.
        var mostMatches = 0;
        var mostMatchedLanguages = [];
        for (var l in languageMatches) {
          var numMatches = languageMatches[l];
          if (numMatches > mostMatches) {
            mostMatches = numMatches;
            mostMatchedLanguages = [l];
          } else if (numMatches == mostMatches) {
            mostMatchedLanguages.push(l);
          }
        }
      }
      if (mostMatchedLanguages.length > 0) {
        // Use first language and warn if multiple detected
        language = mostMatchedLanguages[0];
        if (mostMatchedLanguages.length > 1) {
          console.warn("Multiple possible languages");
          console.warn(mostMatchedLanguages);
        }
      }
    }
    return language;
  }

  function getLanguageFromUrl() {
    for (var language in WORDLISTS) {
      if (window.location.hash.indexOf(language) > -1) {
        return language;
      }
    }
    return "";
  }

  function setMnemonicLanguage() {
    var language = getLanguage();
    // Load the bip39 mnemonic generator for this language if required
    if (!(language in mnemonics)) {
      mnemonics[language] = new Mnemonic(language);
    }
    mnemonic = mnemonics[language];
  }

  function phraseToWordArray(phrase) {
    var words = phrase.split(/\s/g);
    var noBlanks = [];
    for (var i = 0; i < words.length; i++) {
      var word = words[i];
      if (word.length > 0) {
        noBlanks.push(word);
      }
    }
    return noBlanks;
  }

  function wordArrayToPhrase(words) {
    var phrase = words.join(" ");
    return phrase;
  }

  function writeSplitPhrase(phrase) {
    var wordCount = phrase.split(/\s/g).length;
    var left = [];
    for (var i = 0; i < wordCount; i++) left.push(i);
    var group = [[], [], []],
      groupI = -1;
    var seed = Math.abs(sjcl.hash.sha256.hash(phrase)[0]) % 2147483647;
    while (left.length > 0) {
      groupI = (groupI + 1) % 3;
      seed = (seed * 16807) % 2147483647;
      var selected = Math.floor((left.length * (seed - 1)) / 2147483646);
      group[groupI].push(left[selected]);
      left.splice(selected, 1);
    }
    var cards = [phrase.split(/\s/g), phrase.split(/\s/g), phrase.split(/\s/g)];
    for (var i = 0; i < 3; i++) {
      for (var ii = 0; ii < wordCount / 3; ii++)
        cards[i][group[i][ii]] = "XXXX";
      cards[i] = "Card " + (i + 1) + ": " + wordArrayToPhrase(cards[i]);
    }
    // code.innerHTML +=
    //   "<span class='phraseSplit'> " + cards.join("\r\n") + " </span>";
    var phraseSplit = cards.join("\r\n");
    return phraseSplit;
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

  function showWordIndexes() {
    var phrase = mnemonicF.innerHTML;
    var words = phraseToWordArray(phrase);
    var wordIndexes = [];
    var language = getLanguage();
    for (var i = 0; i < words.length; i++) {
      var word = words[i];
      var wordIndex = WORDLISTS[language].indexOf(word);
      wordIndexes.push(wordIndex);
    }
  }

  ///////////////////////////////////////

  function score() {
    var mnemonicF = document.getElementById("mnemonicF").innerHTML;
    var tokenID = document.getElementById("tokenID").innerHTML;
    tokenID = tokenID.replace(" ", "");
    var hexxx = document.getElementById("entropy").innerHTML;
    hexxx = hexxx.replace(" ", "");

    let img = new Image();
    img.src = "bitimg/00.png";

    img.onload = function () {
      // Draw();
      Mnemon();
      setTimeout(Snds, 2000);
    };

    var str1 = tokenID.replace("0x", "ox").toLowerCase();
    
    var str2 = "yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy"; //hack 36 y before to make scrore come from right
    var str3 = "yyyy";//hack 4 y after to make scrore disapear left
    var tokenID2 = str2.concat(str1).concat(str3);

    function Snds() {
      var sounds = [...tokenID2];
      sounds = sounds.map((i) => i);


      snds.src = "bithex/" + sounds[0] + ".mp3";
      snds.play();

      index = 0;

      snds.onended = function () {
        if (index < sounds.length) {
          snds.src = "bithex/" + sounds[index] + ".mp3";
          snds.play();
          hexc = sounds[index];
          Draw2(index, hexc);

          index++;
        } else {
          snds.pause();
          index = 0;
          // setTimeout(run, 2000);
          run();
        }
      };
      window.addEventListener("click", musicPlay);
      document.addEventListener("click", musicPlay);
      function musicPlay() {
        snds.play();
        window.removeEventListener("click", musicPlay);
        document.removeEventListener("click", musicPlay);
      }
    }

   

    function Draw2(index, hexc) {

//

      var Nextstr = tokenID2.slice(0, -2).concat(hexxx);

      var Wstr = tokenID2;
      

      if (hexc == "o" || hexc == "x") {
      } else {
        document.body.style.backgroundColor = "#" + Nextstr.substr(index, 3);
      }

      let d = document.getElementById("d");
      let dtx = d.getContext("2d");
       dpi = window.devicePixelRatio;
      function fix_dpi2() {
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
      }
      dtx.mozImageSmoothingEnabled = false;
      dtx.webkitImageSmoothingEnabled = false;
      dtx.msImageSmoothingEnabled = false;
      dtx.imageSmoothingEnabled = false;
      fix_dpi2();

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
      dtx.drawImage(img, 0, 0, width, height, 2 * sW, 0, sW, sH);
     
      dtx.lineWidth = 2;
      i = index - 2;

      for (let k = 0; k < Wstr.length; k++) {
        var fontSize = sW+"px";
        var fontFamily = "zx-spectrum";
        dtx.font = fontSize + " " + fontFamily;
       
        // dtx.fillText("Hello world", 50, 100);
        if (Wstr[k] == "y") {
          // k = Wstr.length;
          // setTimeout(cler, 400);
        } else {
        
          if (Wstr[k] == "o") {
            // dtx.fillStyle = "#000";
            // dtx.fillText("0",  2 * sW,dy - dy / 10);
            dtx.drawImage(
              img,
              0,
              height - width,
              width,
              width,
              note.x + note.width * k - 2 * note.width- (note.width * i),
              dy - dy / 10,
              sW,
              sW
            );
          }
          if (Wstr[k] == "x") {
            // dtx.fillStyle = "#000";
            // dtx.fillText("X",  3 * sW,dy - dy / 10);
            dtx.drawImage(
              img,
              width,
              0,
              width,
              width,
              note.x + note.width * k - 2 * note.width- (note.width * i),
              dy - dy / 10,
              sW,
              sW
            );
          }
          if (Wstr[k] == "f") {
            dtx.drawImage(
              img,
              width * 3,
              0,
              width,
              width,
              note.x + note.width * k - 2 * note.width- (note.width * i),
              dy - dy / 10,
              sW,
              sW
            );
            dtx.fillStyle = "#000";
            dtx.fillRect(
              note.x + note.width * k - 2 * note.width- (note.width * i),
              note.y,
              note.width,
              note.height
            );
          }
          if (Wstr[k] == "e") {
            dtx.drawImage(
              img,
              width * 3,
              width,
              width,
              width,
              note.x + note.width * k - 2 * note.width- (note.width * i),
              dy - dy / 10,
              sW,
              sW
            );
            dtx.fillStyle = "#000";
            dtx.fillRect(
              note.x + note.width * k - 2 * note.width- (note.width * i),
              note.y + note.height * 1,
              note.width,
              note.height
            );
          }
          if (Wstr[k] == "d") {
            dtx.drawImage(
              img,
              width * 3,
              width * 2,
              width,
              width,
              note.x + note.width * k - 2 * note.width- (note.width * i),
              dy - dy / 10,
              sW,
              sW
            );
            dtx.fillStyle = "#000";
            dtx.fillRect(
              note.x + note.width * k - 2 * note.width- (note.width * i),
              note.y + note.height * 2,
              note.width,
              note.height
            );
          }
          if (Wstr[k] == "c") {
            dtx.drawImage(
              img,
              width * 3,
              width * 3,
              width,
              width,
              note.x + note.width * k - 2 * note.width- (note.width * i),
              dy - dy / 10,
              sW,
              sW
            );
            dtx.fillStyle = "#000";
            dtx.fillRect(
              note.x + note.width * k - 2 * note.width- (note.width * i),
              note.y + note.height * 3,
              note.width,
              note.height
            );
          }
          if (Wstr[k] == "b") {
            dtx.drawImage(
              img,
              width * 3,
              width * 4,
              width,
              width,
              note.x + note.width * k - 2 * note.width- (note.width * i),
              dy - dy / 10,
              sW,
              sW
            );
            dtx.fillStyle = "#000";
            dtx.fillRect(
              note.x + note.width * k - 2 * note.width- (note.width * i),
              note.y + note.height * 4,
              note.width,
              note.height
            );
          }
          if (Wstr[k] == "a") {
            dtx.drawImage(
              img,
              width * 3,
              width * 5,
              width,
              width,
              note.x + note.width * k - 2 * note.width- (note.width * i),
              dy - dy / 10,
              sW,
              sW
            );
            dtx.fillStyle = "#000";
            dtx.fillRect(
              note.x + note.width * k - 2 * note.width- (note.width * i),
              note.y + note.height * 5,
              note.width,
              note.height
            );
          }
          if (Wstr[k] == "9") {
            dtx.drawImage(
              img,
              width * 3,
              width * 6,
              width,
              width,
              note.x + note.width * k - 2 * note.width- (note.width * i),
              dy - dy / 10,
              sW,
              sW
            );
            dtx.fillStyle = "#000";
            dtx.fillRect(
              note.x + note.width * k - 2 * note.width- (note.width * i),
              note.y + note.height * 6,
              note.width,
              note.height
            );
          }
          if (Wstr[k] == "8") {
            dtx.drawImage(
              img,
              width * 3,
              width * 7,
              width,
              width,
              note.x + note.width * k - 2 * note.width- (note.width * i),
              dy - dy / 10,
              sW,
              sW
            );
            dtx.fillStyle = "#000";
            dtx.fillRect(
              note.x + note.width * k - 2 * note.width- (note.width * i),
              note.y + note.height * 7,
              note.width,
              note.height
            );
          }
          if (Wstr[k] == "7") {
            dtx.drawImage(
              img,
              width * 3,
              width * 8,
              width,
              width,
              note.x + note.width * k - 2 * note.width- (note.width * i),
              dy - dy / 10,
              sW,
              sW
            );
            dtx.fillStyle = "#000";
            dtx.fillRect(
              note.x + note.width * k - 2 * note.width- (note.width * i),
              note.y + note.height * 8,
              note.width,
              note.height
            );
          }
          if (Wstr[k] == "6") {
            dtx.drawImage(
              img,
              width * 3,
              width * 9,
              width,
              width,
              note.x + note.width * k - 2 * note.width- (note.width * i),
              dy - dy / 10,
              sW,
              sW
            );
            dtx.fillStyle = "#000";
            dtx.fillRect(
              note.x + note.width * k - 2 * note.width- (note.width * i),
              note.y + note.height * 9,
              note.width,
              note.height
            );
          }
          if (Wstr[k] == "5") {
            dtx.drawImage(
              img,
              width * 3,
              width * 10,
              width,
              width,
              note.x + note.width * k - 2 * note.width- (note.width * i),
              dy - dy / 10,
              sW,
              sW
            );
            dtx.fillStyle = "#000";
            dtx.fillRect(
              note.x + note.width * k - 2 * note.width- (note.width * i),
              note.y + note.height * 10,
              note.width,
              note.height
            );
          }
          if (Wstr[k] == "4") {
            dtx.drawImage(
              img,
              width * 3,
              width * 11,
              width,
              width,
              note.x + note.width * k - 2 * note.width- (note.width * i),
              dy - dy / 10,
              sW,
              sW
            );
            dtx.fillStyle = "#000";
            dtx.fillRect(
              note.x + note.width * k - 2 * note.width- (note.width * i),
              note.y + note.height * 11,
              note.width,
              note.height
            );
          }
          if (Wstr[k] == "3") {
            dtx.drawImage(
              img,
              width * 3,
              width * 12,
              width,
              width,
              note.x + note.width * k - 2 * note.width- (note.width * i),
              dy - dy / 10,
              sW,
              sW
            );
            dtx.fillStyle = "#000";
            dtx.fillRect(
              note.x + note.width * k - 2 * note.width- (note.width * i),
              note.y + note.height * 12,
              note.width,
              note.height
            );
          }
          if (Wstr[k] == "2") {
            dtx.drawImage(
              img,
              width * 3,
              width * 13,
              width,
              width,
              note.x + note.width * k - 2 * note.width- (note.width * i),
              dy - dy / 10,
              sW,
              sW
            );
            dtx.fillStyle = "#000";
            dtx.fillRect(
              note.x + note.width * k - 2 * note.width- (note.width * i),
              note.y + note.height * 13,
              note.width,
              note.height
            );
          }
          if (Wstr[k] == "1") {
            dtx.drawImage(
              img,
              width * 3,
              width * 14,
              width,
              width,
              note.x + note.width * k - 2 * note.width- (note.width * i),
              dy - dy / 10,
              sW,
              sW
            );
            dtx.fillStyle = "#000";
            dtx.fillRect(
              note.x + note.width * k - 2 * note.width- (note.width * i),
              note.y + note.height * 14,
              note.width,
              note.height
            );
          }
          if (Wstr[k] == "0") {
            dtx.drawImage(
              img,
              width * 3,
              width * 15,
              width,
              width,
              note.x + note.width * k - 2 * note.width- (note.width * i),
              dy - dy / 10,
              sW,
              sW
            );
            dtx.fillStyle = "#000";
            dtx.fillRect(
              note.x + note.width * k - 2 * note.width- (note.width * i),
              note.y + note.height * 15,
              note.width,
              note.height
            );
          }
        }
      }


      if (hexc == "f") {
        dtx.strokeStyle = "#333";
        dtx.fillStyle = "#333";
        dtx.fillRect(
          note.x,
          note.y,
          note.width,
          note.height
        );
        dtx.strokeRect(
          note.x,
          note.y,
          note.width,
          note.height
        );
      } else if (hexc == "e") {
        dtx.strokeStyle = "#00d";
        dtx.fillStyle = "#00d";
        dtx.fillRect(
          note.x,
          note.y + note.height * 1,
          note.width,
          note.height
        );
        dtx.strokeRect(
          note.x,
          note.y + note.height * 1,
          note.width,
          note.height
        );
      } else if (hexc == "d") {
        dtx.strokeStyle = "#d00";
        dtx.fillStyle = "#d00";
        dtx.fillRect(
          note.x,
          note.y + note.height * 2,
          note.width,
          note.height
        );
        dtx.strokeRect(
          note.x,
          note.y + note.height * 2,
          note.width,
          note.height
        );
      } else if (hexc == "c") {
        dtx.strokeStyle = "#d0d";
        dtx.fillStyle = "#d0d";
        dtx.fillRect(
          note.x,
          note.y + note.height * 3,
          note.width,
          note.height
        );
        dtx.strokeRect(
          note.x,
          note.y + note.height * 3,
          note.width,
          note.height
        );
      } else if (hexc == "b") {
        dtx.strokeStyle = "#0d0";
        dtx.fillStyle = "#0d0";
        dtx.fillRect(
          note.x,
          note.y + note.height * 4,
          note.width,
          note.height
        );
        dtx.strokeRect(
          note.x,
          note.y + note.height * 4,
          note.width,
          note.height
        );
      } else if (hexc == "a") {
        dtx.strokeStyle = "#0dd";
        dtx.fillStyle = "#0dd";
        dtx.fillRect(
          note.x,
          note.y + note.height * 5,
          note.width,
          note.height
        );
        dtx.strokeRect(
          note.x,
          note.y + note.height * 5,
          note.width,
          note.height
        );
      } else if (hexc == "9") {
        dtx.strokeStyle = "#dd0";
        dtx.fillStyle = "#dd0";
        dtx.fillRect(
          note.x,
          note.y + note.height * 6,
          note.width,
          note.height
        );
        dtx.strokeRect(
          note.x,
          note.y + note.height * 6,
          note.width,
          note.height
        );
      } else if (hexc == "8") {
        dtx.strokeStyle = "#ddd";
        dtx.fillStyle = "#ddd";
        dtx.fillRect(
          note.x,
          note.y + note.height * 7,
          note.width,
          note.height
        );
        dtx.strokeRect(
          note.x,
          note.y + note.height * 7,
          note.width,
          note.height
        );
      } else if (hexc == "7") {
        dtx.strokeStyle = "#000";
        dtx.fillStyle = "#000";
        dtx.fillRect(
          note.x,
          note.y + note.height * 8,
          note.width,
          note.height
        );
        dtx.strokeRect(
          note.x,
          note.y + note.height * 8,
          note.width,
          note.height
        );
      } else if (hexc == "6") {
        dtx.strokeStyle = "#00f";
        dtx.fillStyle = "#00f";
        dtx.fillRect(
          note.x,
          note.y + note.height * 9,
          note.width,
          note.height
        );
        dtx.strokeRect(
          note.x,
          note.y + note.height * 9,
          note.width,
          note.height
        );
      } else if (hexc == "5") {
        dtx.strokeStyle = "#f00";
        dtx.fillStyle = "#f00";
        dtx.fillRect(
          note.x,
          note.y + note.height * 10,
          note.width,
          note.height
        );
        dtx.strokeRect(
          note.x,
          note.y + note.height * 10,
          note.width,
          note.height
        );
      } else if (hexc == "4") {
        dtx.strokeStyle = "#f0f";
        dtx.fillStyle = "#f0f";
        dtx.fillRect(
          note.x,
          note.y + note.height * 11,
          note.width,
          note.height
        );
        dtx.strokeRect(
          note.x,
          note.y + note.height * 11,
          note.width,
          note.height
        );
      } else if (hexc == "3") {
        dtx.strokeStyle = "#0f0";
        dtx.fillStyle = "#0f0";
        dtx.fillRect(
          note.x,
          note.y + note.height * 12,
          note.width,
          note.height
        );
        dtx.strokeRect(
          note.x,
          note.y + note.height * 12,
          note.width,
          note.height
        );
      } else if (hexc == "2") {
        dtx.strokeStyle = "#0ff";
        dtx.fillStyle = "#0ff";
        dtx.fillRect(
          note.x,
          note.y + note.height * 13,
          note.width,
          note.height
        );
        dtx.strokeRect(
          note.x,
          note.y + note.height * 13,
          note.width,
          note.height
        );
      } else if (hexc == "1") {
        dtx.strokeStyle = "#ff0";
        dtx.fillStyle = "#ff0";
        dtx.fillRect(
          note.x,
          note.y + note.height * 14,
          note.width,
          note.height
        );
        dtx.strokeRect(
          note.x,
          note.y + note.height * 14,
          note.width,
          note.height
        );
      } else if (hexc == "0") {
        dtx.strokeStyle = "#fff";
        dtx.fillStyle = "#fff";
        dtx.fillRect(
          note.x,
          note.y + note.height * 15,
          note.width,
          note.height
        );
        dtx.lineWidth = 1;
        dtx.strokeRect(
          note.x,
          note.y + note.height * 15,
          note.width,
          note.height
        );
      } else {
      }

      function cler() {
        dtx.fillStyle = "#fff";
        dtx.clearRect(1 * sW, dy - dy / 8, 68 * sW, sH);
      }

      
    }

    function Mnemon() {
      let mFA = mnemonicF.split(" ");
      let wdiv = document.getElementById("wdiv");

      for (let i = 0; i < mFA.length; i++) {
        let cell = document.createElement("div");
        cell.innerHTML = mFA[i];
        cell.className = "cell";
        wdiv.appendChild(cell);
      }
    }

    const onResize = () => {
      Draw();
      Draw2();
    };

    window.addEventListener("resize", onResize);
  }
  init();
})();
