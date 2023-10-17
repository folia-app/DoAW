const { initContracts, correctPrice } = require("./utils");


async function main() {
  // const networkId = await hre.ethers.provider.getNetwork();
  // console.log({ networkId })
  const [owner] = await hre.ethers.getSigners();
  const { doaw } = await initContracts();
  const targets = [
    '0xA9Ed4c12679f28918cF7F008aD80246E46BF7e52',
    '0xFa398d672936Dcf428116F687244034961545D91',
  ]
  // console.log({ doaw })
  // const totalSupply = await doaw.totalSupply()
  // for (let i = 0; i < totalSupply; i++) {
  //   const tx = await doaw.connect(owner)['safeTransferFrom(address,address,uint256)'](owner.address, targets[i % targets.length], i, { gasLimit: 1_500_000 })
  //   console.log({ tx })
  // }
  // const tx = await owner.sendTransaction({
  //   to: "0xFa398d672936Dcf428116F687244034961545D91",
  //   value: ethers.utils.parseEther("1.0"), // Sends exactly 1.0 ether
  // });
  // console.log("Transaction:", tx);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
