// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IMembership {
        function hasNFT(address user) external view returns (bool);
}

contract Staking is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

        IERC20 public token;
    IMembership public membership;

    mapping(address => uint256) public staked;
    mapping(address => uint256) public lastUpdate;
    mapping(address => uint256) public rewards;

    uint256 public rewardRate = 1e16;
    
    constructor(address _token, address _membership) Ownable(msg.sender) {
        require(_token != address(0), "Token address cannot be zero");
        require(_membership != address(0), "Membership address cannot be zero");

        token = IERC20(_token);
        membership = IMembership(_membership);
    }
    
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(token.balanceOf(msg.sender) >= amount, "Insufficient balance");

        _updateReward(msg.sender);

        token.safeTransferFrom(msg.sender, address(this), amount);
        staked[msg.sender] += amount;
        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) external nonReentrant {
        require(staked[msg.sender] >= amount, "Not enough staked");

        _updateReward(msg.sender);

        staked[msg.sender] -= amount;
        token.safeTransfer(msg.sender, amount);
        emit Unstaked(msg.sender, amount);
    }

    function claimReward() external nonReentrant {
        _updateReward(msg.sender);

        uint256 reward = rewards[msg.sender];
        require(reward > 0, "No reward");

        rewards[msg.sender] = 0;
        token.safeTransfer(msg.sender, reward);
        emit RewardClaimed(msg.sender, reward);
    }

    function _updateReward(address user) internal {
        uint256 timeDiff = block.timestamp - lastUpdate[user];

        if (staked[user] > 0) {
            uint256 baseReward = (staked[user] * timeDiff * rewardRate) / 1e18;

            if (membership.hasNFT(user)) {
                baseReward *= 2;
            }

            rewards[user] += baseReward;
        }

        lastUpdate[user] = block.timestamp;
    }

    function setRewardRate(uint256 _rewardRate) external onlyOwner {
        rewardRate = _rewardRate;
    }

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 reward);
}
