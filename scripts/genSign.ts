import 'dotenv/config';
import * as fs from "fs";
import * as path from "path";
import { ethers } from "hardhat";
import progress from 'cli-progress';
import csvParser from 'csv-parser'

async function genSign(signer: any, address: string, tokenId: number) {
  const messageHash = ethers.solidityPackedKeccak256([ "address", "uint256" ], [ address, tokenId ]);
  const signature = await signer.signMessage(ethers.toBeArray(messageHash));
  return signature
}

// Interface to define the structure of each row in the CSV file
interface CSVRow {
  address: string
}

// Function to read a CSV file and convert it into a list (array of objects)
async function readCSVFileToList(filePath: string): Promise<CSVRow[]> {
  return new Promise((resolve, reject) => {
    const results: CSVRow[] = []

    // Read the CSV file and parse its data
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (data) => results.push(data as CSVRow))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error))
  })
}


async function main() {
  let addrs = await ethers.getSigners();
  console.log("Owner account:", addrs[0].address);
  console.log(
    'Account balance:',
    (await ethers.provider.getBalance(addrs[0].address)).toString()
  )

  const fileName = 'export/airdrop.csv'
  const result = await readCSVFileToList(fileName)

  for (let row in result) {
    //console.log(addrs[0].address, row, result[row].address, )
    console.log(await genSign(addrs[0], result[row].address, parseInt(row)))
  }

  /*

  const bar1 = new progress.SingleBar({}, progress.Presets.shades_classic);
  bar1.start(allWhitelist,0);
  for(let i=0; i<allWhitelist; i++) {
    bar1.increment();
    const user = snapshot["WL"][i];
    let signature: string = await genSign(addrs[0], user, 2);
    let amount: number = 2;
    
    result.push({
      address: user,
      amount: amount,
      signature: signature
    })
  }
  bar1.stop();
  fs.writeFileSync(outPath, JSON.stringify({whitelist: result}));
  */
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
});