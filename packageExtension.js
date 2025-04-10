const AdmZip = require('adm-zip')
const path = require('path')
const fs = require('fs')

/**
 * Creates a ZIP package of the extension
 * @param {string} outputPath - Path where ZIP file should be saved
 * @returns {Promise<string>} Path to the created ZIP file
 */
async function packageExtension(outputPath = 'extension.zip') {
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

// Allow CLI usage
if (require.main === module) {
  const outputPath = process.argv[2] || 'extension.zip'
  packageExtension(outputPath)
    .then(path => console.log('Package created:', path))
    .catch(err => {
      console.error('Packaging failed:', err)
      process.exit(1)
    })
} else console.log(`oops!`)

module.exports = { packageExtension }
