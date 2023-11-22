const { initContracts, decodeUri } = require("./utils");

async function main() {
  const { doaw } = await initContracts();

  const tokenID = 1;

  const metadata = await doaw.tokenURI(tokenID);
  const metaWithoutDataURL = decodeUri(metadata);
  const obj1 = JSON.parse(metaWithoutDataURL);
  console.log(obj1);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
