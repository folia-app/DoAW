
// TODO: change all of this before mainnet

const DoAWABI = require("./contractMetadata/ABI-sepolia-DoAW.json"); // TODO: change before mainnet
// const DoAW = require("./contractMetadata/homestead-DoAW.json");
const DoAWSepolia = require("./contractMetadata/sepolia-DoAW.json");

const MetadataABI = require("./contractMetadata/ABI-sepolia-Metadata.json"); // TODO: change before mainnet
// const Metadata = require("./contractMetadata/homestead-Metadata.json");
const MetadataSepolia = require("./contractMetadata/sepolia-Metadata.json");

const { merkleAddresses } = require("./merkleAddresses.js");

module.exports = {
  merkleAddresses,
  DoAW: {
    abi: DoAWABI.abi,
    networks: {
      // '1': DoAW,
      // 'homestead': DoAW,
      // 'mainnet': DoAW,
      '11155111': DoAWSepolia,
      'sepolia': DoAWSepolia,
    },
  },
  Metadata: {
    abi: MetadataABI.abi,
    networks: {
      // '1': Metadata,
      // 'homestead': Metadata,
      // 'mainnet': Metadata,
      '11155111': MetadataSepolia,
      'sepolia': MetadataSepolia,
    },
  }
}