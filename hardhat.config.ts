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
	// Fallback to local hardhat network if env vars are not present to allow local testing
	const alchemyApiKey = process.env.ALCHEMEY_KEY
	const mnemonic = process.env.MNEMONIC
	if (!alchemyApiKey || !mnemonic) {
		return {
			hardhat: {},
		}
	}

	const shouldFork = process.env.FORK === '1'

	const networks: NetworksUserConfig = {
		hardhat: shouldFork
			? {
				forking: {
					url: `https://eth-sepolia.g.alchemy.com/v2/${alchemyApiKey}`,
					enabled: true,
				},
				accounts: { mnemonic },
			}
			: {
				accounts: { mnemonic },
			},
	}

	// Add optional networks only if corresponding private keys are provided
	if (process.env.PROJECT_PK) {
		networks.polygon = {
			url: `https://polygon-mainnet.g.alchemy.com/v2/${alchemyApiKey}`,
			chainId: 137,
			accounts: [`0x${process.env.PROJECT_PK}`],
		}
	}
	if (process.env.PROJECT_PK_TEST) {
		networks.polygonAmoy = {
			url: `https://polygon-amoy.g.alchemy.com/v2/${alchemyApiKey}`,
			chainId: 80002,
			accounts: [`0x${process.env.PROJECT_PK_TEST}`],
		}
		networks.sepolia = {
			url: `https://eth-sepolia.g.alchemy.com/v2/${alchemyApiKey}`,
			chainId: 11155111,
			accounts: [`0x${process.env.PROJECT_PK_TEST}`],
		}
		networks.arbSepolia = {
			url: `https://arb-sepolia.g.alchemy.com/v2/${alchemyApiKey}`,
			chainId: 421614,
			accounts: [`0x${process.env.PROJECT_PK_TEST}`],
		}
	}

	return networks
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
