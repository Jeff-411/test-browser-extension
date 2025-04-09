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
  CONNECTION_FAILED: 'Could not establish connection to the page. Try reloading the page first.',
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

  // Add error retry and reload functionality
  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('retry-button')) {
      e.preventDefault()
      const action = e.target.dataset.action
      if (action === 'analyze') {
        analyzePageHandler()
      } else if (action === 'notify') {
        notifyHandler()
      }
    } else if (e.target.classList.contains('reload-button')) {
      e.preventDefault()
      reloadCurrentTab()
    }
  })
}

/**
 * Reload the current tab
 */
function reloadCurrentTab() {
  if (currentTab && currentTab.id) {
    chrome.tabs.reload(currentTab.id, function () {
      // Show loading message after reload is triggered
      showLoading('Reloading page...')
    })
  }
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
      if (response.needsReload) {
        showError(response.error || ERROR_MESSAGES.CONNECTION_FAILED, '', true)
      } else {
        throw new Error(response.error || ERROR_MESSAGES.CONTENT_SCRIPT_ERROR)
      }
      return
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
      if (response.needsReload) {
        showError(response.error || ERROR_MESSAGES.CONNECTION_FAILED, '', true)
      } else {
        throw new Error(response.error || ERROR_MESSAGES.CONTENT_SCRIPT_ERROR)
      }
      return
    }

    showSuccess('Notification displayed!')
  } catch (error) {
    console.error('Notification error:', error)
    showError(error.message || ERROR_MESSAGES.GENERIC, 'notify')
  }
}

/**
 * Helper function to get the current active tab
 * @returns {Promise<chrome.tabs.Tab>} The current active tab
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
 * @returns {Promise<Object>} The response from the content script
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
          const errorMessage = chrome.runtime.lastError.message

          // Check for the specific "receiving end does not exist" error
          const needsReload =
            errorMessage.includes('receiving end does not exist') ||
            errorMessage.includes('could not establish connection')

          return resolve({
            success: false,
            error: needsReload ? ERROR_MESSAGES.CONNECTION_FAILED : errorMessage,
            needsReload: needsReload,
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

  let html = '<div class="message success">Page analysis complete!</div>'

  html += '<div class="data-item">'
  html += '<span class="data-label">Page Title:</span>'
  html += '<span class="data-value">' + sanitizeHTML(data.title) + '</span>'
  html += '</div>'

  html += '<div class="data-item">'
  html += '<span class="data-label">Headings:</span>'
  html += '<span class="data-value">' + sanitizeHTML(String(data.headings)) + '</span>'
  html += '</div>'

  html += '<div class="data-item">'
  html += '<span class="data-label">Paragraphs:</span>'
  html += '<span class="data-value">' + sanitizeHTML(String(data.paragraphs)) + '</span>'
  html += '</div>'

  html += '<div class="data-item">'
  html += '<span class="data-label">Links:</span>'
  html += '<span class="data-value">' + sanitizeHTML(String(data.links)) + '</span>'
  html += '</div>'

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
      <div class="loading">
        <div class="spinner"></div>
        <p>${sanitizeHTML(message || 'Loading...')}</p>
      </div>
    `
  }
}

/**
 * Show error message with retry option or reload button
 * @param {string} message - The error message to display
 * @param {string} action - The action that failed (for retry button)
 * @param {boolean} needsReload - Whether page reload is required to fix the error
 */
function showError(message, action = '', needsReload = false) {
  console.warn('Error shown to user:', message)

  let html = `<div class="message error">${sanitizeHTML(message)}</div>`

  if (needsReload) {
    html += `
      <button class="reload-button">
        Reload Page
      </button>
      <p class="reload-hint">The page needs to be reloaded for the extension to work properly.</p>
    `
  } else if (action) {
    html += `
      <button class="retry-button" data-action="${sanitizeHTML(action)}">
        Try Again
      </button>
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
    <div class="fatal-error">
      <div class="message error">${sanitizeHTML(message)}</div>
      <p>Please try reloading the extension or contact support if the problem persists.</p>
    </div>
  `
}

/**
 * Show success message
 * @param {string} message - The success message to display
 */
function showSuccess(message) {
  if (elements.resultsContent) {
    elements.resultsContent.innerHTML = `
      <div class="message success">${sanitizeHTML(message)}</div>
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
