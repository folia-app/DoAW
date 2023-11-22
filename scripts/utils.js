// import { builtinModules } from "node:module";

const hre = require("hardhat");
const path = require("node:path");
const fs = require("fs").promises;

const correctPrice = ethers.utils.parseEther("0.001"); // TODO: change before mainnet 
const splitterAddress = '0x69Bff8f9292e3D2b436A66D9F2226986aB16ABCF' // TODO: change before mainnet
const maxSupply = 99; // TODO: change before mainnet

const testJson = (tJson) => {
  try {
    JSON.parse(tJson);
  } catch (e) {
    return false;
  }
  return true;
};

const getPathABI = async (name) => {
  var networkinfo = await hre.ethers.provider.getNetwork();
  var savePath = path.join(
    __dirname,
    "..",
    "contractMetadata",
    "ABI-" + String(networkinfo["name"]) + "-" + String(name) + ".json"
  );
  return savePath;
};

async function readData(path) {
  try {
    const Newdata = await fs.readFile(path, "utf8");
    return Newdata;
  } catch (e) {
    console.log("e", e);
  }
}

const getPathAddress = async (name) => {
  var networkinfo = await hre.ethers.provider.getNetwork();
  var savePath = path.join(
    __dirname,
    "..",
    "contractMetadata",
    String(networkinfo["name"]) + "-" + String(name) + ".json"
  );
  return savePath;
};

const initContracts = async () => {
  const [owner] = await hre.ethers.getSigners();

  const addressDoAW = JSON.parse(await readData(await getPathAddress("DoAW")))["address"];
  const ABIDoAW = JSON.parse(await readData(await getPathABI("DoAW")))["abi"];
  let doaw = new ethers.Contract(addressDoAW, ABIDoAW, owner);

  const addressMetadata = JSON.parse(await readData(await getPathAddress("Metadata")))["address"];
  const ABIMetadata = JSON.parse(await readData(await getPathABI("Metadata")))["abi"];
  let metadata = new ethers.Contract(addressMetadata, ABIMetadata, owner);

  return { doaw, metadata };
};


const decodeUri = (decodedJson) => {
  const metaWithoutDataURL = decodedJson.substring(decodedJson.indexOf(",") + 1);
  let buff = Buffer.from(metaWithoutDataURL, "base64");
  let text = buff.toString("ascii");
  return text;
};




const deployContracts = async () => {
  var networkinfo = await hre.ethers.provider.getNetwork();
  const blocksToWaitBeforeVerify = 0;

  const [owner] = await hre.ethers.getSigners();

  // deploy Metadata
  const Metadata = await hre.ethers.getContractFactory("Metadata");
  const metadata = await Metadata.deploy();
  await metadata.deployed();
  var metadataAddress = metadata.address;
  log("Metadata Deployed at " + String(metadataAddress));

  // deploy DoAW
  const DoAW = await ethers.getContractFactory("DoAW");
  const doaw = await DoAW.deploy(metadataAddress, splitterAddress);
  await doaw.deployed();
  var doawAddress = doaw.address;
  log("DoAW Deployed at " + String(doawAddress) + ` with metadata ${metadataAddress} and splitter ${splitterAddress}`);

  let reEntry
  // deploy reEntry contract for testing
  if (networkinfo["chainId"] == 12345) {
    const ReEntry = await ethers.getContractFactory("ReEntry");
    reEntry = await ReEntry.deploy(doawAddress);
    await reEntry.deployed();
    // var reEntryAddress = reEntry.address;
  }


  // verify contract if network ID is goerli or sepolia
  if (networkinfo["chainId"] == 5 || networkinfo["chainId"] == 1 || networkinfo["chainId"] == 11155111) {
    if (blocksToWaitBeforeVerify > 0) {
      log(`Waiting for ${blocksToWaitBeforeVerify} blocks before verifying`)
      await doaw.deployTransaction.wait(blocksToWaitBeforeVerify);
    }

    log("Verifying Metadata Contract");
    try {
      await hre.run("verify:verify", {
        address: metadataAddress,
        constructorArguments: [],
      });
    } catch (e) {
      log({ e })
    }

    // log(`Waiting for ${blocksToWaitBeforeVerify} blocks before verifying`)
    await doaw.deployTransaction.wait(blocksToWaitBeforeVerify);
    log("Verifying DoAW Contract");
    try {
      await hre.run("verify:verify", {
        address: doawAddress,
        constructorArguments: [metadataAddress, splitterAddress],
      });
    } catch (e) {
      log({ e })
    }

  }

  return { doaw, metadata, reEntry };
};

const log = (message) => {
  const printLogs = process.env.npm_lifecycle_event !== "test"
  printLogs && console.log(message)
}

module.exports = {
  decodeUri,
  initContracts,
  deployContracts,
  getPathABI,
  getPathAddress,
  readData,
  testJson,
  correctPrice,
  maxSupply,
  splitterAddress
};
