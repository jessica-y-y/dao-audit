import { expect } from "chai";
import { network } from "hardhat";

const env = await network.getOrCreate();
const ethers = env.ethers;

describe("Auditoria de Segurança", function () {

  describe("GovernanceToken", function () {

    it("Deve ter nome e simbolo definidos", async function () {
      const token = await ethers.deployContract("GovernanceToken");
      await token.waitForDeployment();
      expect(await token.name()).to.be.a("string").and.not.empty;
    });

    it("Somente dono pode mintar", async function () {
      const [, atacante] = await ethers.getSigners();
      const token = await ethers.deployContract("GovernanceToken");
      await token.waitForDeployment();
      await expect(
        token.connect(atacante).mint(atacante.address, 1000)
      ).to.revert(ethers);
    });

  });

  describe("MembershipNFT", function () {

    it("Deve fazer deploy sem erros", async function () {
      const nft = await ethers.deployContract("MembershipNFT");
      await nft.waitForDeployment();
      expect(await nft.getAddress()).to.be.a("string");
    });

  });

  describe("Staking", function () {

    it("Nao aceita stake de valor zero", async function () {
      const token = await ethers.deployContract("GovernanceToken");
      await token.waitForDeployment();
      const nft = await ethers.deployContract("MembershipNFT");
      await nft.waitForDeployment();
      const tokenAddress = await token.getAddress();
      const nftAddress = await nft.getAddress();
      const staking = await ethers.deployContract("Staking", [tokenAddress, nftAddress]);
      await staking.waitForDeployment();
      await expect(staking.stake(0)).to.revert(ethers);
    });

    it("Nao permite sacar mais do que depositou", async function () {
      const token = await ethers.deployContract("GovernanceToken");
      await token.waitForDeployment();
      const nft = await ethers.deployContract("MembershipNFT");
      await nft.waitForDeployment();
      const tokenAddress = await token.getAddress();
      const nftAddress = await nft.getAddress();
      const staking = await ethers.deployContract("Staking", [tokenAddress, nftAddress]);
      await staking.waitForDeployment();
      await expect(
        staking.unstake(ethers.parseEther("999999"))
      ).to.revert(ethers);
    });

  });

  describe("DAO", function () {

    it("Deve fazer deploy sem erros", async function () {
      const token = await ethers.deployContract("GovernanceToken");
      await token.waitForDeployment();
      const nft = await ethers.deployContract("MembershipNFT");
      await nft.waitForDeployment();
      const tokenAddress = await token.getAddress();
      const nftAddress = await nft.getAddress();
      const dao = await ethers.deployContract("DAO", [nftAddress, tokenAddress]);
      await dao.waitForDeployment();
      expect(await dao.getAddress()).to.be.a("string");
    });

  });

});