import fs from 'fs'

const rawDesc = `Introducing the ROG Slash206 NFT; \n
Phase One: ROG's inaugural journey into the Metaverse. \n\n
In the intricate realm of Cybergank, every entity treads with caution. Meet ZEI-6, a formerly operational M.O.U.S.E. (Multiple Operational Utilities Strategic Enforcer) housed within the Relic room, now compromised by significant rAM degradation.\n\n
Seamlessly Mint, Collect, and Burn the pertinent Relic artifacts to assist ZEI-6 in its quest to re-emerge and integrate into the expansive ROG Metaverse.`

const mergeDesc = ['Reality', 'Entertainment', 'Knowledge', 'Social', 'Soul']

const nameList = [
  'Relic Camera',
  'Relic Handheld',
  'Relic PC',
  'Relic Lantern',
  'Relic Player',
  'Relic Film',
  'Relic ROM',
  'Relic Disk',
  'Relic Slide',
  'Relic Cassette',
  '/Film Camera',
  '/Handheld Game',
  '/PC',
  '/Slideshow',
  'Relic Player',
]

// Function to export JSON data to a file
function exportJSONToFile(filePath: string, jsonData: object): Promise<void> {
  return new Promise((resolve, reject) => {
    // Convert the JSON data to a string
    const jsonString = JSON.stringify(jsonData, null, 2) // The third argument (2) is for formatting the JSON with indentation.

    // Write the JSON data to the file
    fs.writeFile(filePath, jsonString, 'utf8', (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

async function exportJson() {
  for (let i = 0; i < 15; i++) {
    let description = ``
    if (i < 10) {
      description = rawDesc
    } else {
      description = mergeDesc[i - 10]
    }
    const jsonData = {
      name: nameList[i],
      description: description,
      image: `ipfs://QmUoC9dFEUYsESbHA1jrfuB5VSFCUMAENrGXchpf2PwJht/${i}.png`,
    }
    await exportJSONToFile(`export/freemints/json/${i}.json`, jsonData)
  }
}

async function main() {
  await exportJson()
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
