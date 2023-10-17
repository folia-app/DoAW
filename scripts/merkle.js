const { initContracts, merkleAddresses } = require("./utils");
const { ethers } = require('ethers')
const { MerkleTree } = require('merkletreejs')

async function main() {
  const [owner, addr1] = await hre.ethers.getSigners();
  const billy = '0xFa398d672936Dcf428116F687244034961545D91'
  const { doaw } = await initContracts();

  // const realTree = new MerkleTree(
  //   merkleAddresses.map(ethers.utils.keccak256),
  //   ethers.utils.keccak256,
  //   { sortPairs: true },
  // );
  // const realTreeRoot = "0x" + realTree.getRoot().toString('hex')

  const addresses = [owner.address, addr1.address, billy]
  console.log({ addresses })
  return
  const fakeTree = new MerkleTree(
    addresses.map(ethers.utils.keccak256),
    ethers.utils.keccak256,
    { sortPairs: true },
  );
  const fakeTreeRoot = "0x" + fakeTree.getRoot().toString('hex')


  await doaw.setMerkleRoot(fakeTreeRoot)

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
