import hre, { ethers } from "hardhat";
import { Artifact } from "hardhat/types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import { Governor } from "../../typechain/Governor";
import { MyNftToken } from "../../typechain/MyNftToken";
import { Timelock } from "../../typechain/Timelock";
import { Signers } from "../types";
import { expect } from "chai";
import { getExpectedContractAddress } from "../../tasks/utils";

const { deployContract } = hre.waffle;

const timelockDelay = 2;

describe("Unit tests", function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers: SignerWithAddress[] = await hre.ethers.getSigners();
    this.signers.admin = signers[0];
    this.signers.tokenReceiver = signers[1];
    this.signers.delegatee = signers[2];

    const governorAddress = await getExpectedContractAddress(this.signers.admin);

    // deploy timelock
    const timelockArtifact: Artifact = await hre.artifacts.readArtifact("Timelock");
    this.timelock = <Timelock>(
      await deployContract(this.signers.admin, timelockArtifact, [governorAddress, timelockDelay])
    );

    // deploy token
    const tokenArtifact: Artifact = await hre.artifacts.readArtifact("MyNftToken");
    this.token = <MyNftToken>await deployContract(this.signers.admin, tokenArtifact, []);

    // deploy governor
    const governorArtifact: Artifact = await hre.artifacts.readArtifact("MyGovernor");
    this.governor = <Governor>(
      await deployContract(this.signers.admin, governorArtifact, [this.token.address, this.timelock.address])
    );

    await this.token.connect(this.signers.admin).safeMint(this.signers.admin.address);
    await this.token.connect(this.signers.admin).safeMint(this.signers.admin.address);
    await this.token.connect(this.signers.admin).safeMint(this.signers.admin.address);
    await this.token.connect(this.signers.admin).safeMint(this.signers.admin.address);
    await this.token.connect(this.signers.admin).delegate(this.signers.admin.address);

    await this.token.connect(this.signers.admin).safeMint(this.signers.tokenReceiver.address);
    await this.token.connect(this.signers.tokenReceiver).delegate(this.signers.tokenReceiver.address);
  });

  describe("Governor", function () {
    it("propose and vote on a proposal", async function () {
      const calldata = new ethers.utils.AbiCoder().encode([], []);

      const txn = await this.governor
        .connect(this.signers.admin)
        .propose([this.token.address], [0], [calldata], "Send no ETH");

      const receipt = await txn.wait();
      const proposalId = receipt.events![0].args!.proposalId;

      // check proposal id exists
      expect(await this.governor.state(proposalId)).equal(0);

      await hre.network.provider.send("evm_mine");

      await this.governor.connect(this.signers.admin).castVote(proposalId, 1);
      await this.governor.connect(this.signers.tokenReceiver).castVote(proposalId, 1);

      // check we have voted
      expect(await this.governor.state(proposalId)).to.eql(1);
    });
  });
});
