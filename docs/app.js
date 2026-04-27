import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.7.1/dist/ethers.min.js";

// ── PREENCHA AQUI após o deploy na Sepolia ──────────────────────
const TOKEN_ADDRESS   = "0xSEU_TOKEN_ADDRESS";
const STAKING_ADDRESS = "0xSEU_STAKING_ADDRESS";
const NFT_ADDRESS     = "0xSEU_NFT_ADDRESS";
const DAO_ADDRESS     = "0xSEU_DAO_ADDRESS";

// ── ABIs inline (apenas as funções usadas no frontend) ──────────
const TOKEN_ABI = [
  "function approve(address spender, uint256 value) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

// mint(address to) — onlyOwner: só a carteira que fez deploy pode chamar
const NFT_ABI = [
  "function mint(address to) external",
  "function hasNFT(address user) view returns (bool)",
  "function totalMembers() view returns (uint256)",
  "function tokenIdCounter() view returns (uint256)"
];

const STAKING_ABI = [
  "function stake(uint256 amount) external",
  "function unstake(uint256 amount) external",
  "function claimReward() external",
  "function staked(address user) view returns (uint256)",
  "function rewards(address user) view returns (uint256)",
  "function getEthUsdPrice() view returns (uint256)",
  "function getRewardMultiplier() view returns (uint256)"
];

// createProposal(string desc) — quem tem tokens DSP
// vote(uint256 proposalId)    — quem tem NFT, não pode ser o proposer
const DAO_ABI = [
  "function createProposal(string desc) external",
  "function vote(uint256 proposalId) external",
  "function getProposal(uint256 id) view returns (tuple(string description, uint256 votesFor, uint256 deadline, bool executed, bool approvedByOwner, address proposer))"
];

// ── Estado global ───────────────────────────────────────────────
let provider, signer, userAddress;
let tokenContract, stakingContract, nftContract, daoContract;

const status = document.getElementById("status");
const log = (msg) => { status.innerText = msg; console.log(msg); };

// ── Helper: garante checksum em qualquer endereço ───────────────
// Impede ENS lookup na Sepolia (não suportado no ethers v6.7.1)
const toChecksumAddress = (addr) => ethers.getAddress(addr);

// ── Conectar carteira ───────────────────────────────────────────
window.connectWallet = async () => {
  if (!window.ethereum) return log("❌ MetaMask não encontrada. Instale a extensão.");
  try {
    provider = new ethers.BrowserProvider(window.ethereum);
    signer   = await provider.getSigner();

    // getAddress() retorna em checksum — força explicitamente para garantir
    const rawAddress = await signer.getAddress();
    userAddress = toChecksumAddress(rawAddress);

    document.getElementById("wallet-info").innerText = `Carteira: ${userAddress}`;

    tokenContract   = new ethers.Contract(TOKEN_ADDRESS,   TOKEN_ABI,   signer);
    stakingContract = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, signer);
    nftContract     = new ethers.Contract(NFT_ADDRESS,     NFT_ABI,     signer);
    daoContract     = new ethers.Contract(DAO_ADDRESS,     DAO_ABI,     signer);

    // Consulta status do NFT da carteira conectada
    const temNFT = await nftContract.hasNFT(userAddress);
    const total  = await nftContract.totalMembers();
    document.getElementById("nft-status").innerText =
      `Sua carteira ${temNFT ? "✅ tem NFT de membro" : "❌ não tem NFT"} | Total de membros: ${total}`;

    log("✅ Carteira conectada: " + userAddress);
  } catch (e) { log("Erro ao conectar: " + e.message); }
};

// ── NFT — mint(address to) — onlyOwner ──────────────────────────
window.mintNFT = async () => {
  try {
    const raw = document.getElementById("mintAddress").value.trim();
    if (!ethers.isAddress(raw)) return log("❌ Endereço inválido. Use um endereço Ethereum válido (0x...).");
    const recipient = toChecksumAddress(raw); // evita ENS lookup
    log(`Mintando NFT para ${recipient}...`);
    const tx = await nftContract.mint(recipient);
    await tx.wait();

    const total = await nftContract.totalMembers();
    document.getElementById("nft-status").innerText = `Total de membros atualizado: ${total}`;
    log("✅ NFT mintado! Tx: " + tx.hash);
  } catch (e) {
    if (e.message.includes("OwnableUnauthorizedAccount")) {
      log("❌ Apenas o owner do contrato pode mintar NFTs.");
    } else {
      log("Erro no mint: " + e.message);
    }
  }
};

// ── Verificar se endereço tem NFT ───────────────────────────────
window.checkNFT = async () => {
  try {
    const raw = document.getElementById("mintAddress").value.trim() || userAddress;
    if (!ethers.isAddress(raw)) return log("❌ Endereço inválido.");
    const addr   = toChecksumAddress(raw); // evita ENS lookup
    const temNFT = await nftContract.hasNFT(addr);
    log(`Endereço: ${addr}\n${temNFT ? "✅ Tem NFT de membro" : "❌ Não tem NFT de membro"}`);
  } catch (e) { log("Erro: " + e.message); }
};

// ── Staking ──────────────────────────────────────────────────────
window.approveAndStake = async () => {
  try {
    const raw = document.getElementById("stakeAmount").value;
    if (!raw || Number(raw) <= 0) return log("Informe uma quantidade válida.");
    const decimals = await tokenContract.decimals();
    const amount   = ethers.parseUnits(raw, decimals);

    log("1/2 Aprovando tokens para o contrato de staking...");
    const approveTx = await tokenContract.approve(STAKING_ADDRESS, amount);
    await approveTx.wait();

    log("2/2 Fazendo stake...");
    const stakeTx = await stakingContract.stake(amount);
    await stakeTx.wait();
    log("✅ Stake realizado! Tx: " + stakeTx.hash);
  } catch (e) { log("Erro no stake: " + e.message); }
};

window.unstake = async () => {
  try {
    const raw = document.getElementById("stakeAmount").value;
    if (!raw || Number(raw) <= 0) return log("Informe uma quantidade válida.");
    const decimals = await tokenContract.decimals();
    const amount   = ethers.parseUnits(raw, decimals);
    log("Fazendo unstake...");
    const tx = await stakingContract.unstake(amount);
    await tx.wait();
    log("✅ Unstake realizado! Tx: " + tx.hash);
  } catch (e) { log("Erro no unstake: " + e.message); }
};

window.claimReward = async () => {
  try {
    log("Resgatando recompensa...");
    const tx = await stakingContract.claimReward();
    await tx.wait();
    log("✅ Recompensa resgatada! Tx: " + tx.hash);
  } catch (e) { log("Erro no claim: " + e.message); }
};

window.getStaked = async () => {
  try {
    const [stakedAmt, rewardAmt, price, multiplier] = await Promise.all([
      stakingContract.staked(userAddress),
      stakingContract.rewards(userAddress),
      stakingContract.getEthUsdPrice(),
      stakingContract.getRewardMultiplier()
    ]);
    const decimals = await tokenContract.decimals();
    const ethPrice = (Number(price) / 1e8).toFixed(2);
    const mult     = (Number(multiplier) / 1e18).toFixed(2);
    log(
      `💎 Stake atual: ${ethers.formatUnits(stakedAmt, decimals)} DSP\n` +
      `🎁 Recompensa acumulada: ${ethers.formatUnits(rewardAmt, decimals)} DSP\n` +
      `💵 ETH/USD (Chainlink): $${ethPrice}\n` +
      `✖️  Multiplicador ativo: ${mult}x`
    );
  } catch (e) { log("Erro ao consultar stake: " + e.message); }
};

// ── Governança ───────────────────────────────────────────────────
window.createProposal = async () => {
  try {
    const desc = document.getElementById("proposalDesc").value;
    if (!desc || desc.length <= 5) return log("❌ Descrição deve ter mais de 5 caracteres.");
    log("Criando proposta na DAO...");
    const tx = await daoContract.createProposal(desc);
    await tx.wait();
    log("✅ Proposta criada! Tx: " + tx.hash);
  } catch (e) {
    if (e.message.includes("Need tokens")) {
      log("❌ Você precisa ter tokens DSP para criar propostas.");
    } else {
      log("Erro ao criar proposta: " + e.message);
    }
  }
};

// vote(uint256 proposalId) — precisa ter NFT, proposta aprovada pelo owner, dentro do prazo
window.voteProposal = async () => {
  try {
    const id = document.getElementById("proposalId").value;
    if (id === "") return log("Informe o ID da proposta.");
    log("Votando na proposta #" + id + "...");
    const tx = await daoContract.vote(Number(id));
    await tx.wait();
    log("✅ Voto registrado! Tx: " + tx.hash);
  } catch (e) {
    if (e.message.includes("Not member"))            log("❌ Você precisa ter o NFT de membro para votar.");
    else if (e.message.includes("Already voted"))    log("❌ Você já votou nesta proposta.");
    else if (e.message.includes("Ended"))            log("❌ O prazo de votação desta proposta encerrou.");
    else if (e.message.includes("Not approved"))     log("❌ Esta proposta ainda não foi aprovada pelo owner.");
    else if (e.message.includes("Proposer cannot vote")) log("❌ Quem criou a proposta não pode votar nela.");
    else log("Erro ao votar: " + e.message);
  }
};

window.getProposal = async () => {
  try {
    const id = document.getElementById("proposalId").value;
    if (id === "") return log("Informe o ID da proposta.");
    const p = await daoContract.getProposal(Number(id));
    const deadline = new Date(Number(p.deadline) * 1000).toLocaleString("pt-BR");
    const agora    = Math.floor(Date.now() / 1000);
    const aberta   = Number(p.deadline) > agora && p.approvedByOwner && !p.executed;
    log(
      `📋 Proposta #${id}\n` +
      `Descrição: ${p.description}\n` +
      `Votos a favor: ${p.votesFor}\n` +
      `Prazo: ${deadline}\n` +
      `Aprovada pelo owner: ${p.approvedByOwner ? "✅ Sim" : "❌ Não"}\n` +
      `Executada: ${p.executed ? "✅ Sim" : "❌ Não"}\n` +
      `Status: ${aberta ? "🟢 Votação aberta" : "🔴 Votação encerrada/pendente"}`
    );
  } catch (e) { log("Erro ao consultar proposta: " + e.message); }
};