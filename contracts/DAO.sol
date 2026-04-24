// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IMembership {
    function hasNFT(address user) external view returns (bool);
    function totalMembers() external view returns (uint256);
}

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
}

contract DAO is ReentrancyGuard {

    IMembership public membership;
    IERC20 public token;
    address public owner;

    uint256 public quorumPercent = 75;

    struct Proposal {
        string description;
        uint256 votesFor;
        uint256 deadline;
        bool executed;
        bool approvedByOwner;
        address proposer;
    }

    Proposal[] public proposals;

    mapping(uint256 => mapping(address => bool)) public voted;

    // Eventos
    event ProposalCreated(uint256 indexed id, string description, address proposer);
    event ProposalApproved(uint256 indexed id);
    event Voted(uint256 indexed id, address voter);
    event ProposalExecuted(uint256 indexed id);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _membership, address _token) {
        require(_membership != address(0), "Invalid membership");
        require(_token != address(0), "Invalid token");

        membership = IMembership(_membership);
        token = IERC20(_token);
        owner = msg.sender;
    }

    /// Criação de proposta (apenas quem tem token)
    function createProposal(string memory desc) external {
        require(token.balanceOf(msg.sender) > 0, "Need tokens");
        require(bytes(desc).length > 5, "Invalid description");

        proposals.push(Proposal({
            description: desc,
            votesFor: 0,
            deadline: block.timestamp + 3 days,
            executed: false,
            approvedByOwner: false,
            proposer: msg.sender
        }));

        emit ProposalCreated(proposals.length - 1, desc, msg.sender);
    }

    /// Validação da proposta (subprefeitura, nesse momento, owner) >> futuro com participação de comitê da comunidade
    function approveProposal(uint256 proposalId) external onlyOwner {
        require(proposalId < proposals.length, "Invalid ID");

        proposals[proposalId].approvedByOwner = true;

        emit ProposalApproved(proposalId);
    }

    /// Votação (1 voto por NFT / quem propôs não vota)
    function vote(uint256 proposalId) external nonReentrant {
        require(proposalId < proposals.length, "Invalid ID");

        Proposal storage proposal = proposals[proposalId];

        require(membership.hasNFT(msg.sender), "Not member");
        require(block.timestamp < proposal.deadline, "Ended");
        require(!voted[proposalId][msg.sender], "Already voted");
        require(msg.sender != proposal.proposer, "Proposer cannot vote");
        require(proposal.approvedByOwner, "Not approved");

        proposal.votesFor += 1;
        voted[proposalId][msg.sender] = true;

        emit Voted(proposalId, msg.sender);
    }

    /// Executa proposta com quorum real
    function execute(uint256 proposalId) external onlyOwner nonReentrant {
        require(proposalId < proposals.length, "Invalid ID");

        Proposal storage proposal = proposals[proposalId];

        require(block.timestamp >= proposal.deadline, "Not ended");
        require(!proposal.executed, "Already executed");
        require(proposal.approvedByOwner, "Not approved");

        uint256 totalMembers = membership.totalMembers();
        require(totalMembers > 0, "No members");

        /// Arredondamento para cima (evita fraude com números pequenos)
        uint256 requiredVotes = (totalMembers * quorumPercent + 99) / 100;

        require(proposal.votesFor >= requiredVotes, "Quorum not reached");

        proposal.executed = true;

        emit ProposalExecuted(proposalId);
    }

    /// Alteração de quorum
    function setQuorumPercent(uint256 _q) external onlyOwner {
        require(_q > 0 && _q <= 100, "Invalid quorum");
        quorumPercent = _q;
    }

    /// Consulta de proposta
    function getProposal(uint256 id) external view returns (Proposal memory) {
        require(id < proposals.length, "Invalid ID");
        return proposals[id];
    }
}
