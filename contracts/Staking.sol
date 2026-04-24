// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IMembership {
    function hasNFT(address user) external view returns (bool);
}

contract Staking is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    //immutable (gas + segurança)
    IERC20 public immutable token;
    IMembership public immutable membership;

    mapping(address => uint256) public staked;
    mapping(address => uint256) public lastUpdate;
    mapping(address => uint256) public rewards;

    uint256 public rewardRate = 1e16; // taxa base

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 reward);
    event RewardRateUpdated(uint256 newRewardRate);

    constructor(address token_, address membership_) Ownable(msg.sender) {
        require(token_ != address(0), "Invalid token");
        require(membership_ != address(0), "Invalid membership");

        token = IERC20(token_);
        membership = IMembership(membership_);
    }

    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");

        _updateReward(msg.sender);

        token.safeTransferFrom(msg.sender, address(this), amount);
        staked[msg.sender] += amount;

        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
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
        uint256 last = lastUpdate[user];

        if (last == 0) {
            lastUpdate[user] = block.timestamp;
            return;
        }

        uint256 timeDiff = block.timestamp - last;

        if (staked[user] > 0) {            
            uint256 baseReward = (staked[user] * timeDiff * rewardRate);

            //Bônus por NFT
            if (membership.hasNFT(user)) {
                baseReward *= 2;
            }

            baseReward = baseReward / 1e18;

            rewards[user] += baseReward;
        }

        lastUpdate[user] = block.timestamp;
    }

    function setRewardRate(uint256 newRewardRate) external onlyOwner {
        require(newRewardRate > 0, "Invalid rate");

        rewardRate = newRewardRate;

        emit RewardRateUpdated(newRewardRate);
    }
}
