# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a script that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.ts
```

```shell
yarn hardhat run scripts/deploy.ts --network polygonMumbai

yarn hardhat verify --constructor-args config/deploy-params.ts --network polygonMumbai <CONTRACT_ADDRESS>
```
