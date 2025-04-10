/**
 * Background service worker for Test Browser Extension
 * Implements event listeners and handles communication between extension components
 */

// Constants
const STORAGE_KEYS = {
  USER_SETTINGS: 'userSettings',
  LAST_ERROR: 'lastError',
  EXTENSION_STATE: 'extensionState',
}

const DEFAULT_SETTINGS = {
  theme: 'light',
  notifications: true,
  autoAnalyze: false,
  fontSize: 'medium',
}

// Initialize on installation or update
chrome.runtime.onInstalled.addListener(async details => {
  console.log(`Extension ${details.reason}: ${new Date().toISOString()}`)

  try {
    // Inject content script into all existing tabs - Added to resolve Issue #2
    const tabs = await chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] })

    for (const tab of tabs) {
      try {
        await injectContentScript(tab.id, tab.title)
      } catch (error) {
        console.warn('Re tab:', tab.title)
        console.warn('Failed to inject into tab:', tab.id, error)
        // Continue with other tabs even if one fails
      }
    }

    // Check if settings already exist
    const result = await chrome.storage.local.get(STORAGE_KEYS.USER_SETTINGS)

    if (!result || !result[STORAGE_KEYS.USER_SETTINGS]) {
      // Initialize with default settings if not found
      await chrome.storage.local.set({
        [STORAGE_KEYS.USER_SETTINGS]: DEFAULT_SETTINGS,
        [STORAGE_KEYS.EXTENSION_STATE]: {
          installDate: new Date().toISOString(),
          lastActive: new Date().toISOString(),
          version: chrome.runtime.getManifest().version,
        },
      })
      console.log('Default settings initialized successfully')
    } else {
      // Update existing settings with any new defaults
      const updatedSettings = {
        ...DEFAULT_SETTINGS,
        ...result[STORAGE_KEYS.USER_SETTINGS],
      }

      await chrome.storage.local.set({
        [STORAGE_KEYS.USER_SETTINGS]: updatedSettings,
        [STORAGE_KEYS.EXTENSION_STATE]: {
          lastUpdateDate: new Date().toISOString(),
          lastActive: new Date().toISOString(),
          version: chrome.runtime.getManifest().version,
        },
      })
      console.log('Settings updated successfully')
    }
  } catch (error) {
    console.error('Error initializing settings:', error)
    // Store error information for diagnostic purposes
    await chrome.storage.local
      .set({
        [STORAGE_KEYS.LAST_ERROR]: {
          message: error.message,
          stack: error.stack,
          time: new Date().toISOString(),
          context: 'onInstalled',
        },
      })
      .catch(storageError => {
        console.error('Failed to store error information:', storageError)
      })
  }
})

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received in background script:', message)

  // Always verify message structure
  if (!message || typeof message !== 'object' || !message.action) {
    sendResponse({
      success: false,
      error: 'Invalid message format',
    })
    return false
  }

  // Handle different action types
  switch (message.action) {
    case 'getData':
      handleGetData(message, sender, sendResponse)
      break

    case 'updateSettings':
      handleUpdateSettings(message, sender, sendResponse)
      break

    case 'getState':
      handleGetState(message, sender, sendResponse)
      break

    default:
      console.warn(`Unknown action requested: ${message.action}`)
      sendResponse({
        success: false,
        error: `Unknown action: ${message.action}`,
      })
      return false
  }

  // Keep the message channel open for async response
  return true
})

// Handle navigation in single-page applications with proper filtering
// *** Updated to resolve Issue #2
chrome.webNavigation.onHistoryStateUpdated.addListener(
  function (details) {
    // Only inject if this is a top-level frame, not iframes
    if (details.frameId === 0) {
      console.log('History state updated:', details.url)

      // Check if we have permission first
      chrome.permissions.contains(
        {
          permissions: ['scripting'],
          origins: [details.url],
        },
        hasPermission => {
          if (hasPermission) {
            chrome.scripting
              .executeScript({
                target: { tabId: details.tabId },
                files: ['content.js'],
              })
              .catch(err => {
                console.error('Content script injection failed:', err)
                logError(new Error(err.message || 'Script injection failed'), 'historyStateUpdated')
              })
          } else {
            console.log('No permission to inject script into:', details.url)
          }
        }
      )
    }
  },
  { url: [{ schemes: ['http', 'https'] }] }
)

/**
 * *** Added to resolve Issue #2
 * Injects content script into specified tab
 * @param {number} tabId - The ID of the tab
 * @returns {Promise} Resolves when injection is complete
 */
//
async function injectContentScript(tabId, tabTitle) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js'],
    })
    console.log('Content script injected successfully into tab:', tabId)
  } catch (error) {
    console.error(`ERROR:\nTab id: ${tabId}\nTab title: ${tabTitle}\n${error}`)
    throw error
  }
}

/**
 * Handles data retrieval requests
 * @param {Object} message - The message object
 * @param {Object} sender - The message sender
 * @param {Function} sendResponse - The response callback
 */
async function handleGetData(message, sender, sendResponse) {
  try {
    // Simulate data retrieval operation
    const data = {
      timestamp: new Date().toISOString(),
      randomValue: Math.random().toString(36).substring(2),
      source: 'background script',
      messageReceived: JSON.stringify(message),
    }

    updateLastActiveTime()

    sendResponse({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Error handling getData request:', error)
    logError(error, 'handleGetData')

    sendResponse({
      success: false,
      error: error.message || 'Unknown error occurred',
    })
  }
}

/**
 * Handles settings update requests
 * @param {Object} message - The message object
 * @param {Object} sender - The message sender
 * @param {Function} sendResponse - The response callback
 */
async function handleUpdateSettings(message, sender, sendResponse) {
  try {
    if (!message.settings || typeof message.settings !== 'object') {
      throw new Error('Invalid settings object')
    }

    // Retrieve current settings
    const result = await chrome.storage.local.get(STORAGE_KEYS.USER_SETTINGS)
    const currentSettings = result[STORAGE_KEYS.USER_SETTINGS] || DEFAULT_SETTINGS

    // Update with new settings
    const updatedSettings = {
      ...currentSettings,
      ...message.settings,
    }

    // Validate settings
    if (
      updatedSettings.fontSize &&
      !['small', 'medium', 'large'].includes(updatedSettings.fontSize)
    ) {
      throw new Error('Invalid font size value')
    }

    // Save updated settings
    await chrome.storage.local.set({
      [STORAGE_KEYS.USER_SETTINGS]: updatedSettings,
    })

    updateLastActiveTime()

    sendResponse({
      success: true,
      settings: updatedSettings,
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    logError(error, 'handleUpdateSettings')

    sendResponse({
      success: false,
      error: error.message || 'Failed to update settings',
    })
  }
}

/**
 * Handles state information requests
 * @param {Object} message - The message object
 * @param {Object} sender - The message sender
 * @param {Function} sendResponse - The response callback
 */
async function handleGetState(message, sender, sendResponse) {
  try {
    const result = await chrome.storage.local.get([
      STORAGE_KEYS.USER_SETTINGS,
      STORAGE_KEYS.EXTENSION_STATE,
    ])

    updateLastActiveTime()

    sendResponse({
      success: true,
      state: {
        settings: result[STORAGE_KEYS.USER_SETTINGS] || DEFAULT_SETTINGS,
        extensionState: result[STORAGE_KEYS.EXTENSION_STATE] || {},
        version: chrome.runtime.getManifest().version,
        currentTime: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Error retrieving state:', error)
    logError(error, 'handleGetState')

    sendResponse({
      success: false,
      error: error.message || 'Failed to retrieve state',
    })
  }
}

/**
 * Updates the last active timestamp
 */
async function updateLastActiveTime() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.EXTENSION_STATE)
    const currentState = result[STORAGE_KEYS.EXTENSION_STATE] || {}

    await chrome.storage.local.set({
      [STORAGE_KEYS.EXTENSION_STATE]: {
        ...currentState,
        lastActive: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Error updating last active time:', error)
    // Non-critical error, just log it
  }
}

/**
 * Logs error information to storage for diagnostic purposes
 * @param {Error} error - The error object
 * @param {string} context - The context where the error occurred
 */
async function logError(error, context) {
  try {
    // Get existing errors
    const result = await chrome.storage.local.get('errorLog')
    const errorLog = result.errorLog || []

    // Add new error (keeping only the last 10 errors)
    errorLog.unshift({
      message: error.message,
      stack: error.stack,
      time: new Date().toISOString(),
      context: context,
    })

    // Store updated error log (limited to 10 entries)
    await chrome.storage.local.set({
      errorLog: errorLog.slice(0, 10),
      [STORAGE_KEYS.LAST_ERROR]: errorLog[0],
    })
  } catch (storageError) {
    console.error('Failed to log error information:', storageError)
  }
}
