const fs = require('fs')
const path = require('path')
const AdmZip = require('adm-zip')

/**
 * Creates a ZIP package of the extension
 * @param {string} outputPath - Path where ZIP file should be saved
 * @returns {Promise<string>} Path to the created ZIP file
 */
async function generateZip(outputPath = './extensionPackage.zip') {
  const isCI = process.env.CI === 'true'
  const logPrefix = isCI ? '[Extension Package]' : ''

  try {
    const zip = new AdmZip()
    const rootDir = path.resolve(__dirname, '')
    const assetsDir = path.join(rootDir, 'assets')

    // Files to include - these are required
    const requiredFiles = [
      'manifest.json',
      'background.js',
      'content.js',
      'popup.html',
      'popup.css',
      'popup.js',
      'options.html',
    ]

    // Optional files
    const optionalFiles = ['assets/README.html']

    // Validate required files exist before starting
    const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join(rootDir, file)))

    if (missingFiles.length > 0) {
      throw new Error(`Missing required files: ${missingFiles.join(', ')}`)
    }

    // Add required files
    for (const file of requiredFiles) {
      const filePath = path.join(rootDir, file)
      const dirname = path.dirname(file)
      zip.addLocalFile(filePath, dirname === '.' ? '' : dirname)
      console.log(`${logPrefix} Added required file: ${file}`)
    }

    // Add optional files if they exist
    for (const file of optionalFiles) {
      const filePath = path.join(rootDir, file)
      if (fs.existsSync(filePath)) {
        if (file === 'assets/README.html') {
          // Add README.html to root of zip
          zip.addLocalFile(filePath, '', 'README.html')
        } else {
          zip.addLocalFile(filePath, path.dirname(file))
        }
        console.log(`${logPrefix} Added optional file: ${file}`)
      } else {
        console.warn(`${logPrefix} Optional file not found: ${file}`)
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
          console.log(`${logPrefix} Added icon: ${iconFile}`)
        }
      }
    } else {
      throw new Error('Required icons directory not found')
    }

    // Write the ZIP file
    const outputFilePath = path.resolve(rootDir, outputPath)
    zip.writeZip(outputFilePath)
    console.log(`${logPrefix} Extension packaged successfully: ${outputFilePath}`)

    return outputFilePath
  } catch (error) {
    console.error(`${logPrefix} Error packaging extension:`, error)
    throw error
  }
}

// Only run if called directly (not imported as a module)
if (require.main === module) {
  generateZip().catch(error => {
    console.error('Failed to generate extension package:', error)
    process.exit(1)
  })
}

module.exports = { generateZip }
