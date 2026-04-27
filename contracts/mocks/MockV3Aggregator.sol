// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

// Simula o oráculo Chainlink para testes locais
// Permite definir qualquer preço sem precisar de rede real
contract MockV3Aggregator {
    uint8 public decimals;
    int256 public latestAnswer;
    uint256 public latestTimestamp;
    uint80 public latestRound;

    constructor(uint8 _decimals, int256 _initialAnswer) {
        decimals = _decimals;
        latestAnswer = _initialAnswer;
        latestTimestamp = block.timestamp;
        latestRound = 1;
    }

    // Permite atualizar o preço nos testes
    function updateAnswer(int256 _answer) external {
        latestAnswer = _answer;
        latestTimestamp = block.timestamp;
        latestRound++;
    }

    // Replica exatamente a interface do Chainlink real
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return (
            latestRound,
            latestAnswer,
            latestTimestamp,
            latestTimestamp,
            latestRound
        );
    }
}