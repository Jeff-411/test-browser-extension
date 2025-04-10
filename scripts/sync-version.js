const fs = require('fs')
const path = require('path')
const AdmZip = require('adm-zip')

/**
 * Creates a ZIP package of the extension
 * @param {string} outputPath - Path where ZIP file should be saved
 * @returns {Promise<string>} Path to the created ZIP file
 */
async function packageExtension(outputPath = 'test-browser-extension.zip') {
  try {
    const zip = new AdmZip()
    const rootDir = path.resolve(__dirname, '..')

    // Files to include
    const filesToInclude = [
      'manifest.json',
      'background.js',
      'content.js',
      'popup.html',
      'popup.css',
      'popup.js',
      'options.html',
      'icons/icon16.png',
      'icons/icon48.png',
      'icons/icon128.png',
    ]

    // Add each file to the ZIP
    for (const file of filesToInclude) {
      const filePath = path.join(rootDir, file)
      if (fs.existsSync(filePath)) {
        if (path.dirname(file) !== '.') {
          // For files in subdirectories, preserve the directory structure
          zip.addLocalFile(filePath, path.dirname(file))
        } else {
          // For files in root directory
          zip.addLocalFile(filePath)
        }
      } else {
        console.warn(`Warning: File not found: ${file}`)
      }
    }

    // Add README.html to root of ZIP
    const readmePath = path.join(rootDir, 'docs/distribution-package/README.html')
    if (fs.existsSync(readmePath)) {
      zip.addLocalFile(readmePath, '') // Empty string means root directory
    } else {
      console.warn('Warning: README.html not found')
    }

    // Write the ZIP file
    const outputFilePath = path.resolve(rootDir, outputPath)
    zip.writeZip(outputFilePath)
    console.log(`Extension packaged successfully: ${outputFilePath}`)

    return outputFilePath
  } catch (error) {
    console.error('Error packaging extension:', error)
    throw error
  }
}

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
  const command = process.argv[2]

  try {
    if (command === 'package') {
      await packageExtension()
    } else {
      await syncVersion()
    }
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

// Execute if running directly
if (require.main === module) {
  main()
}

module.exports = { packageExtension, syncVersion }
