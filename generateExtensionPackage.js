const fs = require('fs')
const path = require('path')
const AdmZip = require('adm-zip')

/**
 * Creates a ZIP package of the extension
 * @param {string} outputPath - Path where ZIP file should be saved
 * @returns {Promise<string>} Path to the created ZIP file
 */
async function generateZip(outputPath = './extensionPackage.zip') {
  try {
    const zip = new AdmZip()
    const rootDir = path.resolve(__dirname, '')
    const assetsDir = path.join(rootDir, 'assets')

    // Files to include
    const filesToInclude = [
      'manifest.json',
      'background.js',
      'content.js',
      'popup.html',
      'popup.css',
      'popup.js',
      'options.html',
      'assets/README.html',
    ]

    // Add each file to the ZIP
    for (const file of filesToInclude) {
      const filePath = path.join(rootDir, file)
      if (fs.existsSync(filePath)) {
        if (file === 'assets/README.html') {
          // Add README.html to root of zip
          zip.addLocalFile(filePath, '', 'README.html')
        } else if (path.dirname(file) !== '.') {
          zip.addLocalFile(filePath, path.dirname(file))
        } else {
          zip.addLocalFile(filePath)
        }
      } else {
        console.warn(`Warning: File not found: ${file}`)
      }
    }

    // Add icons folder from assets
    const iconsDir = path.join(assetsDir, 'icons')
    if (fs.existsSync(iconsDir)) {
      const iconFiles = fs.readdirSync(iconsDir)
      for (const iconFile of iconFiles) {
        const iconPath = path.join(iconsDir, iconFile)
        if (fs.statSync(iconPath).isFile()) {
          zip.addLocalFile(iconPath, 'icons')
        }
      }
    } else {
      console.warn('Warning: Icons directory not found')
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

generateZip()
