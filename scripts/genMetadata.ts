import fs from 'fs'

const rawDesc = 'Discover diverse "Relic" and "Relic EVO" artifacts scattered throughout SLASH206.'

const nameList = [
  'Relic Camera',
  'Relic Handheld Console',
  'Relic Computer',
  'Relic Slide Projector',
  'Relic Cassette Player',
  'Relic Roll Film',
  'Relic ROM Cart',
  'Relic Disk',
  'Relic Slide',
  'Relic Cassette',
  'Relic EVO Camera',
  'Relic EVO Handheld Game',
  'Relic EVO Computer',
  'Relic EVO Slide Projector',
  'Relic EVO Cassette Player'
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
    let imageLink = `ipfs://QmXt65CZYZpdfrnKb3MACqHgyrvTWhZXFBirpXfHg8NNxE/`
    if (i < 10) {
      imageLink += `${i}.png`
    } else {
      imageLink += `${i-10}-${i-5}.mp4`
    }
    const jsonData = {
      name: nameList[i],
      description: rawDesc,
      image: imageLink,
    }
    await exportJSONToFile(`export/freemints/json/prod/${i}.json`, jsonData)
  }
}

async function main() {
  await exportJson()
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
