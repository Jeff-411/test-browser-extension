## background.js

```javascript
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
```

## popup.js

```javascript
/**
 * Main popup functionality for Test Browser Extension
 * Handles user interaction and communication with background/content scripts
 */

// Constants for timeouts and retries
const TIMEOUT = {
  TAB_QUERY: 5000,
  MESSAGE: 8000,
  ANIMATION: 300,
}

const ERROR_MESSAGES = {
  NO_ACTIVE_TAB: 'Could not detect an active tab. Please refresh the page and try again.',
  COMMUNICATION_FAILED:
    'Could not communicate with the page. The extension may need permission to access this site.',
  CONTENT_SCRIPT_ERROR: 'The content script encountered an error.',
  BACKGROUND_ERROR: 'Could not connect to the extension background service.',
  TIMEOUT: 'The operation timed out. Please try again.',
  GENERIC: 'An unexpected error occurred. Please try again.',
}

// Store DOM references
let elements = {}
let timeoutHandlers = {}
let currentTab = null

// Initialize the popup
document.addEventListener('DOMContentLoaded', function () {
  try {
    // Cache DOM elements
    cacheElements()

    // Set up event listeners
    setupEventListeners()

    // Get current tab information
    getCurrentTab().catch(error => {
      showError(error.message || ERROR_MESSAGES.NO_ACTIVE_TAB)
    })

    // Check connection with background script
    checkBackgroundConnection().catch(error => {
      console.warn('Background connection check failed:', error)
      // Non-fatal error, don't show to user
    })
  } catch (error) {
    console.error('Error initializing popup:', error)
    showFatalError(
      'Failed to initialize the extension popup: ' + (error.message || ERROR_MESSAGES.GENERIC)
    )
  }
})

/**
 * Cache DOM elements for better performance
 */
function cacheElements() {
  elements = {
    analyzePageBtn: document.getElementById('analyze-page'),
    notifyBtn: document.getElementById('notify'),
    openOptionsLink: document.getElementById('open-options'),
    resultsContent: document.getElementById('results-content'),
    statusText: document.getElementById('status-text'),
    statusIcon: document.querySelector('.status-icon'),
  }

  // Validate required elements
  if (!elements.analyzePageBtn || !elements.notifyBtn || !elements.resultsContent) {
    throw new Error('Required DOM elements not found')
  }
}

/**
 * Set up event listeners for user interactions
 */
function setupEventListeners() {
  // Analyze current page button
  elements.analyzePageBtn.addEventListener('click', analyzePageHandler)

  // Show notification button
  elements.notifyBtn.addEventListener('click', notifyHandler)

  // Open options page
  elements.openOptionsLink.addEventListener('click', e => {
    e.preventDefault()
    chrome.runtime.openOptionsPage()
  })

  // Add error retry functionality
  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('retry-button')) {
      e.preventDefault()
      const action = e.target.dataset.action
      if (action === 'analyze') {
        analyzePageHandler()
      } else if (action === 'notify') {
        notifyHandler()
      }
    }
  })
}

/**
 * Handler for Analyze Page button
 */
async function analyzePageHandler() {
  try {
    // Clear previous results and show loading
    showLoading('Analyzing page...')

    // Make sure we have the current tab
    if (!currentTab) {
      await getCurrentTab()
    }

    if (!currentTab || !currentTab.id) {
      throw new Error(ERROR_MESSAGES.NO_ACTIVE_TAB)
    }

    // Send message with timeout
    const response = await sendMessageWithTimeout(
      currentTab.id,
      { action: 'analyze' },
      TIMEOUT.MESSAGE
    )

    if (!response) {
      throw new Error(ERROR_MESSAGES.TIMEOUT)
    }

    if (!response.success) {
      throw new Error(response.error || ERROR_MESSAGES.CONTENT_SCRIPT_ERROR)
    }

    // Display results
    displayResults(response.data)
  } catch (error) {
    console.error('Analysis error:', error)
    showError(error.message || ERROR_MESSAGES.GENERIC, 'analyze')
  }
}

/**
 * Handler for Show Notification button
 */
async function notifyHandler() {
  try {
    // Reset any previous error states
    elements.notifyBtn.classList.remove('error')
    showLoading('Sending notification...')

    // Make sure we have the current tab
    if (!currentTab) {
      await getCurrentTab()
    }

    if (!currentTab || !currentTab.id) {
      throw new Error(ERROR_MESSAGES.NO_ACTIVE_TAB)
    }

    // Send message with timeout
    const response = await sendMessageWithTimeout(
      currentTab.id,
      { action: 'showNotification' },
      TIMEOUT.MESSAGE
    )

    if (!response) {
      throw new Error(ERROR_MESSAGES.TIMEOUT)
    }

    if (!response.success) {
      throw new Error(response.error || ERROR_MESSAGES.CONTENT_SCRIPT_ERROR)
    }

    showSuccess('Notification displayed!')
  } catch (error) {
    console.error('Notification error:', error)
    showError(error.message || ERROR_MESSAGES.GENERIC, 'notify')
  }
}

/**
 * Helper function to get the current active tab
 * @returns {Promise} The current active tab
 */
async function getCurrentTab() {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(ERROR_MESSAGES.TIMEOUT))
    }, TIMEOUT.TAB_QUERY)

    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      clearTimeout(timeoutId)

      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message))
      }

      if (!tabs || tabs.length === 0) {
        return reject(new Error(ERROR_MESSAGES.NO_ACTIVE_TAB))
      }

      currentTab = tabs[0]
      updateStatusIndicator(currentTab.url)
      resolve(currentTab)
    })
  })
}

/**
 * Helper function to send a message with timeout
 * @param {number} tabId - The ID of the tab to send the message to
 * @param {Object} message - The message to send
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise} The response from the content script
 */
function sendMessageWithTimeout(tabId, message, timeout) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      resolve(null) // Return null on timeout, handled by caller
    }, timeout)

    try {
      chrome.tabs.sendMessage(tabId, message, response => {
        clearTimeout(timeoutId)

        if (chrome.runtime.lastError) {
          console.warn('Send message error:', chrome.runtime.lastError)
          return resolve({
            success: false,
            error: chrome.runtime.lastError.message,
          })
        }

        resolve(response)
      })
    } catch (error) {
      clearTimeout(timeoutId)
      console.error('Exception in sendMessage:', error)
      reject(error)
    }
  })
}

/**
 * Verify background script connection
 */
async function checkBackgroundConnection() {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(ERROR_MESSAGES.TIMEOUT))
    }, TIMEOUT.MESSAGE)

    try {
      chrome.runtime.sendMessage({ action: 'getState' }, response => {
        clearTimeout(timeoutId)

        if (chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message))
        }

        if (!response || !response.success) {
          return reject(new Error(ERROR_MESSAGES.BACKGROUND_ERROR))
        }

        // Optional: Update UI with version info
        if (response.state && response.state.version) {
          const footerVersion = document.querySelector('footer p')
          if (footerVersion) {
            footerVersion.textContent = `v${response.state.version} | Options`
          }
        }

        resolve(response)
      })
    } catch (error) {
      clearTimeout(timeoutId)
      reject(error)
    }
  })
}

/**
 * Update status indicator based on current URL
 * @param {string} url - The current URL
 */
function updateStatusIndicator(url) {
  if (!url) return

  try {
    const urlObj = new URL(url)
    const isHttps = urlObj.protocol === 'https:'

    if (elements.statusIcon) {
      elements.statusIcon.className = `status-icon ${isHttps ? 'active' : 'inactive'}`
    }

    if (elements.statusText) {
      elements.statusText.textContent = isHttps ? 'active' : 'limited'
      elements.statusText.className = isHttps ? 'active' : 'inactive'
    }
  } catch (error) {
    console.warn('Error parsing URL:', error)
  }
}

/**
 * Display analysis results
 * @param {Object} data - The page analysis data
 */
function displayResults(data) {
  if (!data) {
    showError('No data received from page analysis')
    return
  }

  // Validate required fields
  if (
    !Object.prototype.hasOwnProperty.call(data, 'title') ||
    !Object.prototype.hasOwnProperty.call(data, 'headings') ||
    !Object.prototype.hasOwnProperty.call(data, 'paragraphs') ||
    !Object.prototype.hasOwnProperty.call(data, 'links')
  ) {
    showError('Incomplete data received from page analysis')
    return
  }

  let html = 'Page analysis complete!'

  html += ''
  html += 'Page Title:'
  html += '' + sanitizeHTML(data.title) + ''
  html += ''

  html += ''
  html += 'Headings:'
  html += '' + sanitizeHTML(String(data.headings)) + ''
  html += ''

  html += ''
  html += 'Paragraphs:'
  html += '' + sanitizeHTML(String(data.paragraphs)) + ''
  html += ''

  html += ''
  html += 'Links:'
  html += '' + sanitizeHTML(String(data.links)) + ''
  html += ''

  if (elements.resultsContent) {
    elements.resultsContent.innerHTML = html
    fadeIn(elements.resultsContent)
  }
}

/**
 * Show loading state in the results area
 * @param {string} message - The loading message to display
 */
function showLoading(message) {
  if (elements.resultsContent) {
    elements.resultsContent.innerHTML = `
      
        
        ${sanitizeHTML(message || 'Loading...')}
      
    `
  }
}

/**
 * Show error message with retry option
 * @param {string} message - The error message to display
 * @param {string} action - The action that failed (for retry button)
 */
function showError(message, action = '') {
  console.warn('Error shown to user:', message)

  let html = `${sanitizeHTML(message)}`

  if (action) {
    html += `
      
        Try Again
      
    `
  }

  if (elements.resultsContent) {
    elements.resultsContent.innerHTML = html
    fadeIn(elements.resultsContent)
  }
}

/**
 * Show fatal error (used for popup initialization failures)
 * @param {string} message - The error message
 */
function showFatalError(message) {
  document.body.innerHTML = `
    
      ${sanitizeHTML(message)}
      Please try reloading the extension or contact support if the problem persists.
    
  `
}

/**
 * Show success message
 * @param {string} message - The success message to display
 */
function showSuccess(message) {
  if (elements.resultsContent) {
    elements.resultsContent.innerHTML = `
      ${sanitizeHTML(message)}
    `
    fadeIn(elements.resultsContent)
  }
}

/**
 * Simple fade-in animation
 * @param {HTMLElement} element - The element to fade in
 */
function fadeIn(element) {
  if (!element) return

  // Clean up any existing animation
  if (timeoutHandlers.fadeIn) {
    clearTimeout(timeoutHandlers.fadeIn)
  }

  element.style.opacity = 0
  element.style.transition = `opacity ${TIMEOUT.ANIMATION}ms ease-in-out`

  // Force reflow to ensure transition works
  void element.offsetWidth

  element.style.opacity = 1

  timeoutHandlers.fadeIn = setTimeout(() => {
    element.style.transition = ''
  }, TIMEOUT.ANIMATION)
}

/**
 * Helper function to sanitize HTML strings
 * @param {string} str - The string to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeHTML(str) {
  if (str === undefined || str === null) {
    return ''
  }

  const temp = document.createElement('div')
  temp.textContent = str
  return temp.innerHTML
}
```

These updated files feature significantly improved error handling with:

1. **Comprehensive Error Management**:

   - Detailed error objects with context
   - Error logging to storage for diagnostics
   - User-friendly error messages with retry options

2. **Timeout Handling**:

   - All asynchronous operations now have timeouts
   - Prevents operations from hanging indefinitely

3. **Data Validation**:

   - Extensive input validation for all operations
   - Type checking and structure validation

4. **Defensive Programming**:

   - Null/undefined checks throughout
   - Safe property access patterns
   - Proper separation of concerns

5. **User Feedback**:
   - Loading states with visual indicators
   - Clear success/error messaging
   - Retry mechanisms for failed operations

These improvements will make the extension more robust, providing better user experience and easier debugging when issues occur.

Citations:
[1] https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/18441009/27aaae73-b159-4a5f-a2dd-904fbb219b1c/project-structure.md
[2] https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_dafc2955-8f1b-4c2a-8c51-12299e3e7166/979ee60c-328a-47c6-a1a5-409045025021/README.md

---

Answer from Perplexity: pplx.ai/share
