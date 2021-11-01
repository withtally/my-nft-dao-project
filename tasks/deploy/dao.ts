import { task } from "hardhat/config";
import { getExpectedContractAddress } from "../utils";

import { MyNftToken, MyNftToken__factory } from "../../typechain";

task("deploy:Dao").setAction(async function (_, { ethers, run }) {
  const timelockDelay = 2;

  const tokenFactory: MyNftToken__factory = await ethers.getContractFactory("MyNftToken");

  const signerAddress = await tokenFactory.signer.getAddress();
  const signer = await ethers.getSigner(signerAddress);

  const governorExpectedAddress = await getExpectedContractAddress(signer);

  const token: MyNftToken = <MyNftToken>await tokenFactory.deploy();
  await token.deployed();

  console.log("Dao deployed to: ", {
    governorExpectedAddress,
    token: token.address,
  });

  // We'll mint enough NFTs to be able to pass a proposal!
  await token.safeMint(signerAddress);
  await token.safeMint(signerAddress);
  await token.safeMint(signerAddress);
  await token.safeMint(signerAddress);

  console.log("Minted 4 NFTs to get us started");

  console.log("Granted the timelock permissions to run safeMint()");

  await run("verify:verify", {
    address: token.address,
  });
});
