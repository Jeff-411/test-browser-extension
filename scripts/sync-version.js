const fs = require('fs')
const path = require('path')

// Read package.json
const packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8'))

// Read manifest.json
const manifestPath = path.resolve(__dirname, '../manifest.json')
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))

// Update manifest version
manifest.version = packageJson.version

// Write updated manifest
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
