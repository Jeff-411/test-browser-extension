const fs = require('fs')
const path = require('path')

/**
 * Synchronizes version between package.json and manifest.json
 */
async function syncVersion() {
  // Read package.json
  const packageJson = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8')
  )

  // Read manifest.json
  const manifestPath = path.resolve(__dirname, '../manifest.json')
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))

  // Update manifest version
  manifest.version = packageJson.version

  // Write updated manifest
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
  console.log('Version synchronized successfully:', packageJson.version)
}

// Main execution
async function main() {
  try {
    await syncVersion()
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

// Execute if running directly
if (require.main === module) {
  main()
}

module.exports = { syncVersion }
