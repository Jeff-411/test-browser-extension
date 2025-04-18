# Test Browser Extension

A simple Chrome browser extension demonstrating basic functionality using Manifest V3.

## Description

Test Browser Extension is a lightweight browser extension that demonstrates Chrome extension capabilities using the Manifest V3 architecture. This extension allows you to analyze basic page metrics and display notifications on web pages.

## Features

- **Page Analysis**: Analyze any webpage to see statistics about its structure (headings, paragraphs, links)
- **Custom Notifications**: Display notifications on the current page
- **Customizable Settings**: Configure the extension appearance and behavior through an options page
- **Modern Architecture**: Built using Chrome's Manifest V3 specification

## Installation

Since this extension is not published to the Chrome Web Store, you'll need to install it manually (sideloading):

1. **Download the Extension**

   - Clone this repository: `git clone https://github.com/Jeff-411/test-browser-extension.git`
   - Or download it as a ZIP file and extract it

2. **Load in Chrome**

   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" using the toggle in the top-right corner
   - Click "Load unpacked"
   - Select the extension directory where you cloned/extracted the files

3. **Verify Installation**
   - You should see "Test Browser Extension" appear in your extensions list
   - The extension icon should appear in your browser toolbar

## Usage

### Basic Usage

1. **Analyzing a Page**

   - Navigate to any website
   - Click the extension icon in the toolbar
   - Click the "Analyze Page" button in the popup
   - View the statistics about the current page

2. **Displaying Notifications**
   - Navigate to any website
   - Click the extension icon
   - Click the "Show Notification" button
   - A notification will appear at the top of the webpage

### Configuring Options

1. Click the extension icon to open the popup
2. Click "Options" at the bottom of the popup
3. Adjust the following settings:
   - Dark Mode
   - Font Size
   - Notification settings
   - Auto-analysis settings
   - Custom API Key (if needed)
4. Click "Save Settings" to apply your changes

## Updating the Extension

When updates are available:

1. Pull the latest changes: `git pull origin main`
2. Go to `chrome://extensions/`
3. Find "Test Browser Extension" and click the refresh icon
4. If that doesn't work, remove the extension and reload it using "Load unpacked"

## Deployment and Updates

### Initial Setup

1. Generate your extension ID by loading it in Chrome at least once
2. Add your extension ID as a GitHub repository secret named `EXTENSION_ID`

### Creating a New Release

To create a new release:

1. Run one of the following commands based on the type of update:

   ```bash
   npm run version:patch  # For bug fixes (1.0.0 -> 1.0.1)
   npm run version:minor  # For new features (1.0.0 -> 1.1.0)
   npm run version:major  # For breaking changes (1.0.0 -> 2.0.0)
   ```

2. Run the release command to push changes and trigger the deployment:
   ```bash
   npm run release
   ```

This will:

- Update the version in package.json and manifest.json
- Create a git tag
- Trigger the GitHub Actions workflow
- Create a GitHub release with the extension package
- Generate and upload the updates.xml file

### Automatic Updates

The extension will automatically check for updates using the update_url in manifest.json. When an update is available, Chrome will download and install it automatically.

## Development

This extension was developed using:

- VS Code on Windows 11
- Node.js v22.13.1
- Chrome's Manifest V3 extension framework

## Permissions

The extension requires these permissions:

- **storage**: To save user preferences
- **activeTab**: To interact with the current browser tab
- **optional_host_permissions**: For advanced webpage interactions (requested only when needed)

## License

This project is open-source and available for educational purposes.

## Contributing

This is a learning project, but suggestions and improvements are welcome. Please open an issue or submit a pull request if you'd like to contribute.
