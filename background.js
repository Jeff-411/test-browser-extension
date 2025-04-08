// Background service worker for Test Browser Extension
console.log('Background service worker initialized')

// Listen for installation
chrome.runtime.onInstalled.addListener(details => {
  console.log('Extension installed:', details.reason)

  // Initialize storage with default values
  chrome.storage.local.set(
    {
      userSettings: {
        theme: 'light',
        notifications: true,
      },
    },
    () => {
      console.log('Default settings initialized')
    }
  )
})

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received in background script:', message)

  if (message.action === 'getData') {
    sendResponse({
      success: true,
      data: 'Sample data from background script',
    })
  }

  return true // Keep the message channel open for async response
})
