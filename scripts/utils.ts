import axios from 'axios'
import { ethers } from 'hardhat'

export async function getGasPrice() {
  // get max fees from gas station
  let maxFeePerGas = BigInt(120000000000) // fallback to 120 gwei
  let maxPriorityFeePerGas = BigInt(40000000000) // fallback to 70 gwei
  try {
    const { data } = await axios({
      method: 'get',
      url: 'https://gasstation.polygon.technology/v2',
    })
    maxFeePerGas = ethers.parseUnits(Math.ceil(data.fast.maxFee) + '', 'gwei')
    maxPriorityFeePerGas = ethers.parseUnits(
      Math.ceil(data.fast.maxPriorityFee) + '',
      'gwei'
    )
  } catch {
    // ignore
  }
  console.log(
    'send tx with maxFeePerGas:',
    maxFeePerGas,
    'maxPriorityFeePerGas:',
    maxPriorityFeePerGas
  )

  return { maxFeePerGas, maxPriorityFeePerGas }
}
