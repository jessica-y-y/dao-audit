import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.7.1/dist/ethers.min.js";

const TOKEN_ADDRESS   = "0xSEU_TOKEN_ADDRESS";
const STAKING_ADDRESS = "0xSEU_STAKING_ADDRESS";
const NFT_ADDRESS     = "0xSEU_NFT_ADDRESS";
const DAO_ADDRESS     = "0xSEU_DAO_ADDRESS";

const TOKEN_ABI = [
  "function approve(address spender, uint256 value) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

const NFT_ABI = [
  "function mint(address to) external",
  "function hasNFT(address user) view returns (bool)",
  "function totalMembers() view returns (uint256)"
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

const DAO_ABI = [
  "function createProposal(string desc) external",
  "function vote(uint256 proposalId) external",
  "function getProposal(uint256 id) view returns (tuple(string description, uint256 votesFor, uint256 deadline, bool executed, bool approvedByOwner, address proposer))"
];

let provider, signer, userAddress;
let tokenContract, stakingContract, nftContract, daoContract;

const status = document.getElementById("status");
const log = (msg) => { status.innerText = msg; console.log(msg); };
const toAddr = (addr) => ethers.getAddress(addr);

window.connectWallet = async function() {
  if (!window.ethereum) { log("MetaMask nao encontrada."); return; }
  try {
    log("Passo 1: conectando...");
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    userAddress = toAddr(await signer.getAddress());
    document.getElementById("wallet-info").innerText = "Carteira: " + userAddress;
    log("Passo 2: criando contratos...");
    tokenContract   = new ethers.Contract(TOKEN_ADDRESS,   TOKEN_ABI,   signer);
    stakingContract = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, signer);
    nftContract     = new ethers.Contract(NFT_ADDRESS,     NFT_ABI,     signer);
    daoContract     = new ethers.Contract(DAO_ADDRESS,     DAO_ABI,     signer);
    log("Passo 3: verificando NFT...");
    const temNFT = await nftContract.hasNFT(userAddress);
    const total  = await nftContract.totalMembers();
    document.getElementById("nft-status").innerText =
      "Sua carteira " + (temNFT ? "TEM NFT" : "NAO tem NFT") + " | Membros: " + total;
    log("Carteira conectada: " + userAddress);
  } catch(e) { log("ERRO connectWallet: " + e.message); }
};

window.mintNFT = async function() {
  try {
    var raw = document.getElementById("mintAddress").value.trim();
    if (!ethers.isAddress(raw)) { log("Endereco invalido."); return; }
    var recipient = toAddr(raw);
    log("Mintando para " + recipient + "...");
    var tx = await nftContract.mint(recipient);
    await tx.wait();
    var total = await nftContract.totalMembers();
    document.getElementById("nft-status").innerText = "Total de membros: " + total;
    log("NFT mintado! Tx: " + tx.hash);
  } catch(e) {
    if (e.message.includes("OwnableUnauthorizedAccount")) {
      log("Apenas o owner pode mintar NFTs.");
    } else {
      log("Erro no mint: " + e.message);
    }
  }
};

window.checkNFT = async function() {
  try {
    var raw = document.getElementById("mintAddress").value.trim() || userAddress;
    if (!ethers.isAddress(raw)) { log("Endereco invalido."); return; }
    var addr = toAddr(raw);
    var temNFT = await nftContract.hasNFT(addr);
    log("Endereco: " + addr + "\n" + (temNFT ? "TEM NFT" : "NAO tem NFT"));
  } catch(e) { log("Erro checkNFT: " + e.message); }
};

window.approveAndStake = async function() {
  try {
    var raw = document.getElementById("stakeAmount").value;
    if (!raw || Number(raw) <= 0) { log("Informe uma quantidade valida."); return; }
    var decimals = await tokenContract.decimals();
    var amount = ethers.parseUnits(raw, decimals);
    log("1/2 Aprovando tokens...");
    var approveTx = await tokenContract.approve(STAKING_ADDRESS, amount);
    await approveTx.wait();
    log("2/2 Fazendo stake...");
    var stakeTx = await stakingContract.stake(amount);
    await stakeTx.wait();
    log("Stake realizado! Tx: " + stakeTx.hash);
  } catch(e) { log("Erro no stake: " + e.message); }
};

window.unstake = async function() {
  try {
    var raw = document.getElementById("stakeAmount").value;
    if (!raw || Number(raw) <= 0) { log("Informe uma quantidade valida."); return; }
    var decimals = await tokenContract.decimals();
    var amount = ethers.parseUnits(raw, decimals);
    log("Fazendo unstake...");
    var tx = await stakingContract.unstake(amount);
    await tx.wait();
    log("Unstake realizado! Tx: " + tx.hash);
  } catch(e) { log("Erro no unstake: " + e.message); }
};

window.claimReward = async function() {
  try {
    log("Resgatando recompensa...");
    var tx = await stakingContract.claimReward();
    await tx.wait();
    log("Recompensa resgatada! Tx: " + tx.hash);
  } catch(e) { log("Erro no claim: " + e.message); }
};

window.getStaked = async function() {
  try {
    var stakedAmt = await stakingContract.staked(userAddress);
    var rewardAmt = await stakingContract.rewards(userAddress);
    var price = await stakingContract.getEthUsdPrice();
    var multiplier = await stakingContract.getRewardMultiplier();
    var decimals = await tokenContract.decimals();
    var ethPrice = (Number(price) / 1e8).toFixed(2);
    var mult = (Number(multiplier) / 1e18).toFixed(2);
    log(
      "Stake atual: " + ethers.formatUnits(stakedAmt, decimals) + " DSP\n" +
      "Recompensa: " + ethers.formatUnits(rewardAmt, decimals) + " DSP\n" +
      "ETH/USD: $" + ethPrice + "\n" +
      "Multiplicador: " + mult + "x"
    );
  } catch(e) { log("Erro getStaked: " + e.message); }
};

window.createProposal = async function() {
  try {
    var desc = document.getElementById("proposalDesc").value;
    if (!desc || desc.length <= 5) { log("Descricao deve ter mais de 5 caracteres."); return; }
    log("Criando proposta...");
    var tx = await daoContract.createProposal(desc);
    await tx.wait();
    log("Proposta criada! Tx: " + tx.hash);
  } catch(e) { log("Erro ao criar proposta: " + e.message); }
};

window.voteProposal = async function() {
  try {
    var id = document.getElementById("proposalId").value;
    if (id === "") { log("Informe o ID da proposta."); return; }
    log("Votando na proposta #" + id + "...");
    var tx = await daoContract.vote(Number(id));
    await tx.wait();
    log("Voto registrado! Tx: " + tx.hash);
  } catch(e) { log("Erro ao votar: " + e.message); }
};

window.getProposal = async function() {
  try {
    var id = document.getElementById("proposalId").value;
    if (id === "") { log("Informe o ID da proposta."); return; }
    var p = await daoContract.getProposal(Number(id));
    var deadline = new Date(Number(p.deadline) * 1000).toLocaleString("pt-BR");
    var agora = Math.floor(Date.now() / 1000);
    var aberta = Number(p.deadline) > agora && p.approvedByOwner && !p.executed;
    log(
      "Proposta #" + id + "\n" +
      "Descricao: " + p.description + "\n" +
      "Votos: " + p.votesFor + "\n" +
      "Prazo: " + deadline + "\n" +
      "Aprovada owner: " + (p.approvedByOwner ? "Sim" : "Nao") + "\n" +
      "Executada: " + (p.executed ? "Sim" : "Nao") + "\n" +
      "Status: " + (aberta ? "Votacao aberta" : "Encerrada/pendente")
    );
  } catch(e) { log("Erro ao consultar proposta: " + e.message); }
};
