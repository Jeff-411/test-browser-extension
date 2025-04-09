# Issue 2

The extension throws an error the first time it attempts to analyze a pre-existing page, but works after the page has been reloaded.

## Steps to replicate

### Step 1: Reload extension

1. Service worker log (background.js):

```log
Extension update: 2025-04-09T11:54:37.977Z
background.js:54 Settings updated successfully
```

2. Error log: N/A

### Step 2: Analyze Page1 (https://www.google.ca/)

1. Service worker log (background.js):

```log
Extension update: 2025-04-09T11:54:37.977Z
background.js:54 Settings updated successfully
background.js:76 Message received in background script: {action: 'getState'}
```

2. Error log: popup.js:256 (anonymous function)

```log
console.warn('Send message error:', chrome.runtime.lastError)
```

### Step 3: Clear Error log, then reload Page1 (https://www.google.ca/)

1. Service worker log (background.js): (no change)

```log
Extension update: 2025-04-09T11:54:37.977Z
background.js:54 Settings updated successfully
background.js:76 Message received in background script: {action: 'getState'}
```

2. Error log: N/A

3. Page1 DevTools log:

```log
Test Browser Extension content script loaded (content.js:4)
```

### Step 4: Analyze Page1

1. Service worker log (background.js):

```log
Extension update: 2025-04-09T11:54:37.977Z
background.js:54 Settings updated successfully
background.js:76 Message received in background script: {action: 'getState'}
background.js:76 Message received in background script: {action: 'getState'}
```

2. Error log: No errors. The page analyze results display properly

### Step 5: Analyze Page2 (https://en.wikipedia.org/wiki/Main_Page)

This produces the same error we got in `### Step 2: Analyze Page1`.

### Step 5: Clear Error logs, then Analyze Page1

This produces the same error-free result we got in `### Step 4`.

## RESPONSE

Workspace: Collecting workspace informationTo fix the issue with analyzing pre-existing tabs after extension reload, we need to inject the content script into existing tabs when the extension is reloaded. Here's the solution:

1. First, add a function in background.js to inject the content script:

```javascript
/**
 * Injects content script into specified tab
 * @param {number} tabId - The ID of the tab
 * @returns {Promise} Resolves when injection is complete
 */
async function injectContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js'],
    })
    console.log('Content script injected successfully into tab:', tabId)
  } catch (error) {
    console.error('Content script injection failed for tab:', tabId, error)
    throw error
  }
}
```

2. Then modify the `onInstalled` listener in background.js to inject into existing tabs:

```javascript
// Initialize on installation or update
chrome.runtime.onInstalled.addListener(async details => {
  console.log(`Extension ${details.reason}: ${new Date().toISOString()}`)

  try {
    // Inject content script into all existing tabs
    const tabs = await chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] })

    for (const tab of tabs) {
      try {
        await injectContentScript(tab.id)
      } catch (error) {
        console.warn('Failed to inject into tab:', tab.id, error)
        // Continue with other tabs even if one fails
      }
    }

    // ...existing settings initialization code...
  } catch (error) {
    console.error('Error during extension initialization:', error)
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
```

3. Update the error handling in popup.js to handle injection failures:

```javascript
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

          // If content script isn't injected, try injecting it
          if (chrome.runtime.lastError.message.includes('receiving end does not exist')) {
            chrome.scripting
              .executeScript({
                target: { tabId },
                files: ['content.js'],
              })
              .then(() => {
                // Retry the message after injection
                chrome.tabs.sendMessage(tabId, message, secondResponse => {
                  if (chrome.runtime.lastError) {
                    resolve({
                      success: false,
                      error: ERROR_MESSAGES.COMMUNICATION_FAILED,
                      needsReload: true,
                    })
                  } else {
                    resolve(secondResponse)
                  }
                })
              })
              .catch(err => {
                resolve({
                  success: false,
                  error: ERROR_MESSAGES.COMMUNICATION_FAILED,
                  needsReload: true,
                })
              })
            return
          }

          return resolve({
            success: false,
            error: chrome.runtime.lastError.message,
            needsReload: true,
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
```

These changes will:

1. Automatically inject the content script into all existing tabs when the extension is installed/updated
2. Handle cases where the content script isn't present by attempting to inject it on-demand
3. Provide better error messages and recovery options
4. Maintain existing timeout and error handling functionality

The solution preserves all existing security measures while adding robust content script injection handling for both new and existing tabs.
