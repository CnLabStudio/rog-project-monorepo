import 'hardhat-gas-reporter'
import 'solidity-coverage'
import '@nomicfoundation/hardhat-toolbox'
import { config as dotenvConfig } from 'dotenv'
import { HardhatUserConfig } from 'hardhat/config'
import { NetworksUserConfig } from 'hardhat/types'
import { resolve } from 'path'
import { config } from './package.json'

dotenvConfig({ path: resolve(__dirname, './.env') })

function getNetworks(): NetworksUserConfig {
  if (!process.env.ALCHEMEY_KEY)
    throw new Error(
      `ALCHEMEY_KEY env var not set. Copy .env.template to .env and set the env var`
    )
  if (!process.env.MNEMONIC)
    throw new Error(
      `MNEMONIC env var not set. Copy .env.template to .env and set the env var`
    )

  const alchemyApiKey = process.env.ALCHEMEY_KEY
  const accounts = { mnemonic: process.env.MNEMONIC }

  return {
    hardhat: {
      forking: {
        url: `https://polygon-mumbai.g.alchemy.com/v2/${alchemyApiKey}`,
        //blockNumber: 15966650,
        enabled: true,
      },
      accounts,
    },
    polygon: {
      url: `https://polygon-mainnet.g.alchemy.com/v2/${alchemyApiKey}`,
      chainId: 137,
      accounts: [`0x${process.env.PROJECT_PK}`],
    },
    polygonAmoy: {
      url: `https://polygon-amoy.g.alchemy.com/v2/${alchemyApiKey}`,
      chainId: 80002,
      accounts: [`0x${process.env.PROJECT_PK_TEST}`],
    },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${alchemyApiKey}`,
      chainId: 11155111,
      accounts: [`0x${process.env.PROJECT_PK_TEST}`],
    }
  }
}

const hardhatConfig: HardhatUserConfig = {
  solidity: config.solidity,
  paths: {
    sources: config.paths.contracts,
    tests: config.paths.tests,
    cache: config.paths.cache,
    artifacts: config.paths.build.contracts,
  },
  networks: {
    ...getNetworks(),
  },
  typechain: {
    outDir: config.paths.build.typechain,
    target: 'ethers-v6',
  },
  etherscan: {
    apiKey: {
      sepolia: `${process.env.ETHERSCAN_API_KEY}`,
      polygon: `${process.env.POLYGONSCAN_API_KEY}`,
      polygonMumbai: `${process.env.POLYGONSCAN_API_KEY}`,
      polygonAmoy: `${process.env.POLYGONSCAN_API_KEY}`,
    },
    customChains: [
      {
        network: "polygonAmoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com/"
        }
      }
    ]
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
  },
  mocha: {
    timeout: 1200 * 1e3,
  },
}

export default hardhatConfig
