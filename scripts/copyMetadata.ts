import * as fs from 'fs'
import * as path from 'path'

// Define the mapping
const colorMapping: { [key: string]: string } = {
  Blue: '0',
  Red: '1',
  Black: '2',
  Gold: '3',
}

// Define the array
const colors = [
  'Gold',
  'Black',
  'Red',
  'Black',
  'Gold',
  'Black',
  'Red',
  'Black',
  'Red',
  'Gold',
  'Red',
  'Black',
  'Red',
  'Black',
  'Gold',
  'Red',
  'Gold',
  'Red',
  'Gold',
  'Red',
  'Gold',
  'Black',
  'Black',
  'Red',
  'Gold',
  'Black',
  'Gold',
  'Gold',
  'Black',
  'Gold',
  'Black',
  'Red',
  'Black',
  'Gold',
  'Red',
  'Black',
  'Red',
  'Gold',
  'Red',
  'Gold'
]

// Iterate over the array
for (let i = 0; i < colors.length; i++) {
  const number = colorMapping[colors[i]]

  // Define the source and destination paths
  const sourcePath = path.join(
    'export',
    'soulbound',
    'template',
    `${number}.json`
  )
  const destinationPath = path.join('export', 'soulbound', 'json', `${i}.json`)

  // Copy the file
  fs.copyFileSync(sourcePath, destinationPath)
}
