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

      // Chamada feita pelo atacante deve reverter (onlyOwner)
      await expect(
      token.connect(atacante).mint(await atacante.getAddress(), 1000n)
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

    // Função auxiliar para deployar token, nft, mock e staking corretamente
    async function deployStakingComMock(precoInicial: bigint = 2000n * 10n ** 8n) {
      const token = await ethers.deployContract("GovernanceToken");
      await token.waitForDeployment();

      const nft = await ethers.deployContract("MembershipNFT");
      await nft.waitForDeployment();

      // Deploy do mock do Chainlink (decimals, initialAnswer)
      const mock = await ethers.deployContract("MockV3Aggregator", [8, precoInicial]);
      await mock.waitForDeployment();

      // Agora passamos os 3 argumentos exigidos pelo construtor do Staking
      const staking = await ethers.deployContract("Staking", [
        await token.getAddress(),
        await nft.getAddress(),
        await mock.getAddress()
      ]);
      await staking.waitForDeployment();

      return { token, nft, mock, staking };
    }

    it("Nao aceita stake de valor zero", async function () {
      const { token, staking } = await deployStakingComMock();

      const signers = await ethers.getSigners();
      const user = signers[1];

      // Mint e approve para o usuário (deployer é owner do token e pode mintar)
      await token.mint(await user.getAddress(), ethers.parseUnits("10", 18));
      await token.connect(user).approve(await staking.getAddress(), ethers.parseUnits("10", 18));

      // Teste: stake zero deve reverter com a mensagem do require
      await expect(staking.connect(user).stake(0n)).to.be.revertedWith("Amount must be > 0");
    });

    it("Nao permite sacar mais do que depositou", async function () {
      const { token, staking } = await deployStakingComMock();

      const signers = await ethers.getSigners();
      const user = signers[1];

      // Mint e approve
      await token.mint(await user.getAddress(), ethers.parseUnits("10", 18));
      await token.connect(user).approve(await staking.getAddress(), ethers.parseUnits("10", 18));

      // Stake 1 token
      await staking.connect(user).stake(ethers.parseUnits("1", 18));

      // Tentar sacar 2 tokens -> deve reverter com "Not enough staked"
      await expect(staking.connect(user).unstake(ethers.parseUnits("2", 18))).to.be.revertedWith("Not enough staked");
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
