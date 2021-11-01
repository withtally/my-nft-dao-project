import { task } from "hardhat/config";
import { getExpectedContractAddress } from "../utils";

import {
  MyNftToken,
  MyNftToken__factory,
  MyGovernor,
  MyGovernor__factory,
  Timelock,
  Timelock__factory,
} from "../../typechain";

task("deploy:Dao").setAction(async function (_, { ethers, run }) {
  const timelockDelay = 2;

  const tokenFactory: MyNftToken__factory = await ethers.getContractFactory("MyNftToken");

  const signerAddress = await tokenFactory.signer.getAddress();
  const signer = await ethers.getSigner(signerAddress);

  const governorExpectedAddress = await getExpectedContractAddress(signer);

  const token: MyNftToken = <MyNftToken>await tokenFactory.deploy();
  await token.deployed();

  const timelockFactory: Timelock__factory = await ethers.getContractFactory("Timelock");
  const timelock: Timelock = <Timelock>await timelockFactory.deploy(governorExpectedAddress, timelockDelay);
  await timelock.deployed();

  const governorFactory: MyGovernor__factory = await ethers.getContractFactory("MyGovernor");
  const governor: MyGovernor = <MyGovernor>await governorFactory.deploy(token.address, timelock.address);
  await governor.deployed();

  console.log("Dao deployed to: ", {
    governorExpectedAddress,
    governor: governor.address,
    timelock: timelock.address,
    token: token.address,
  });

  // We'll mint enough NFTs to be able to pass a proposal!
  await token.safeMint(signerAddress);
  await token.safeMint(signerAddress);
  await token.safeMint(signerAddress);
  await token.safeMint(signerAddress);

  console.log("Minted 4 NFTs to get us started");

  // Transfer ownership to the timelock to allow it to perform actions on the NFT contract as part of proposal execution
  await token.transferOwnership(timelock.address);

  console.log("Granted the timelock ownership of the NFT Token");

  await run("verify:verify", {
    address: token.address,
  });

  await run("verify:verify", {
    address: timelock.address,
    constructorArguments: [governor.address, timelockDelay],
  });

  await run("verify:verify", {
    address: governor.address,
    constructorArguments: [token.address, timelock.address],
  });
});
