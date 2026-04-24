import { defineConfig } from "hardhat/config";

export default defineConfig({
  solidity: {
    compilers: [
      { version: "0.8.20" },
      { version: "0.8.28" }
    ]
  }
});