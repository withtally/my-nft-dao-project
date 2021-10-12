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
    await this.token.connect(this.signers.admin).safeMint(this.signers.tokenReceiver.address);
  });

  describe("Governor", function () {
    it("propose and execute a proposal", async function () {
      let now = await hre.waffle.provider.getBlock("latest").then(block => block.timestamp);

      const calldata = new ethers.utils.AbiCoder().encode([], []);

      const txn = await this.governor["propose(address[],uint256[],string[],bytes[],string)"](
        [this.token.address],
        [0],
        ["totalSupply()"],
        [calldata],
        "Send no ETH",
      );

      const receipt = await txn.wait();
      const proposalId = receipt.events![0].args!.proposalId;

      // check proposal id exists
      expect((await this.governor.proposals(proposalId)).forVotes.toString()).to.eql("0");

      await hre.network.provider.send("evm_mine");

      await this.governor.castVote(proposalId, 1);

      // check we have voted
      expect((await this.governor.proposals(proposalId)).forVotes.toString()).to.eql("4");

      await this.governor["queue(uint256)"](proposalId);

      now = await hre.waffle.provider.getBlock("latest").then(block => block.timestamp);
      await hre.network.provider.request({
        method: "evm_setNextBlockTimestamp",
        params: [now + 11],
      });

      await this.governor["execute(uint256)"](proposalId);

      // check it executed
      expect((await this.governor.proposals(proposalId)).executed).to.eql(true);
    });
  });
});
