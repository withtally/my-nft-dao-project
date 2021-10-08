import hre from "hardhat";
import { Artifact } from "hardhat/types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import { MyNftToken } from "../../typechain/MyNftToken";
import { Signers } from "../types";
import { expect } from "chai";

const { deployContract } = hre.waffle;

describe("Unit tests", function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers: SignerWithAddress[] = await hre.ethers.getSigners();
    this.signers.admin = signers[0];
    this.signers.tokenReceiver = signers[1];
    this.signers.delegatee = signers[2];
  });

  describe("Token", function () {
    beforeEach(async function () {
      const tokenArtifact: Artifact = await hre.artifacts.readArtifact("MyNftToken");
      this.token = <MyNftToken>await deployContract(this.signers.admin, tokenArtifact, []);
    });

    it("owner should be able to mint new tokens", async function () {
      await this.token.connect(this.signers.admin).safeMint(this.signers.tokenReceiver.address);
      expect(await this.token.connect(this.signers.admin).ownerOf(0)).to.equal(this.signers.tokenReceiver.address);
    });

    it("token holder can check vote to delegate balance", async function () {
      await this.token.connect(this.signers.admin).safeMint(this.signers.tokenReceiver.address);
      expect(
        await this.token.connect(this.signers.tokenReceiver).votesToDelegate(this.signers.tokenReceiver.address),
      ).to.equal(1);
    });

    it("token holder can delegate votes", async function () {
      await this.token.connect(this.signers.admin).safeMint(this.signers.tokenReceiver.address);
      await this.token.connect(this.signers.tokenReceiver).delegate(this.signers.delegatee.address);
      expect(
        await this.token.connect(this.signers.tokenReceiver).getCurrentVotes(this.signers.delegatee.address),
      ).to.equal(1);
    });
  });
});
