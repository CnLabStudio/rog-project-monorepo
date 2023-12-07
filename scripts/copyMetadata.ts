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
  'Blue',
  'Blue',
  'Red',
  'Red',
  'Blue',
  'Red',
  'Red',
  'Black',
  'Black',
  'Red',
  'Gold',
  'Red',
  'Blue',
  'Blue',
  'Black',
  'Blue',
  'Gold',
  'Red',
  'Red',
  'Red',
  'Black',
  'Blue',
  'Black',
  'Black',
  'Red',
  'Black',
  'Gold',
  'Blue',
  'Black',
  'Red',
  'Blue',
  'Black',
  'Gold',
  'Black',
  'Red',
  'Red',
  'Gold',
  'Blue',
  'Blue',
  'Gold',
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
