import { expect } from "chai";
import { network } from "hardhat";

const env = await network.getOrCreate();
const ethers = env.ethers;

describe("Auditoria de Segurança - Staking (corrigido)", function () {

  // Reutiliza sua função deployTudo do arquivo oracle.test.ts
  async function deployTudo(precoInicial: bigint) {
    const token = await ethers.deployContract("GovernanceToken");
    await token.waitForDeployment();

    const nft = await ethers.deployContract("MembershipNFT");
    await nft.waitForDeployment();

    const mock = await ethers.deployContract("MockV3Aggregator", [8, precoInicial]);
    await mock.waitForDeployment();

    const staking = await ethers.deployContract("Staking", [
      await token.getAddress(),
      await nft.getAddress(),
      await mock.getAddress(),
    ]);
    await staking.waitForDeployment();

    return { token, nft, mock, staking };
  }

  it("Nao aceita stake de valor zero", async function () {
    const PRECO_ETH_2000 = 2000n * 10n ** 8n;
    const { token, staking } = await deployTudo(PRECO_ETH_2000);

    const signers = await ethers.getSigners();
    const user = signers[1];

    // Mint e approve para o usuário
    await token.mint(await user.getAddress(), ethers.parseUnits("10", 18));
    await token.connect(user).approve(await staking.getAddress(), ethers.parseUnits("10", 18));

    // Teste: stake zero deve reverter com a mensagem do require
    await expect(staking.connect(user).stake(0n)).to.be.revertedWith("Amount must be > 0");
  });

  it("Nao permite sacar mais do que depositou", async function () {
    const PRECO_ETH_2000 = 2000n * 10n ** 8n;
    const { token, staking } = await deployTudo(PRECO_ETH_2000);

    const signers = await ethers.getSigners();
    const user = signers[1];

    // Mint e approve
    await token.mint(await user.getAddress(), ethers.parseUnits("10", 18));
    await token.connect(user).approve(await staking.getAddress(), ethers.parseUnits("10", 18));

    // Stake 1 token (usar parseUnits para precisão)
    await staking.connect(user).stake(ethers.parseUnits("1", 18));

    // Tentar sacar 2 tokens -> deve reverter com "Not enough staked"
    await expect(staking.connect(user).unstake(ethers.parseUnits("2", 18))).to.be.revertedWith("Not enough staked");
  });

});
