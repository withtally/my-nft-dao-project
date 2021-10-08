import { task } from "hardhat/config";
import { getExpectedContractAddress } from "../../test/utils";

import {
  MyNftToken,
  MyNftToken__factory,
  MyGovernor,
  MyGovernor__factory,
  Timelock,
  Timelock__factory,
} from "../../typechain";

task("deploy:Dao").setAction(async function (_, { ethers }) {
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
});
