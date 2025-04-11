// Content script for Test Browser Extension
if (!window._testExtensionInitialized) {
  window._testExtensionInitialized = true
  console.log('Test Browser Extension content script loaded')
}

// Function to show notification banner
function showNotification() {
  const bannerOpenTime = 5000
  const banner = document.createElement('div')
  banner.style.padding = '10px'
  banner.style.backgroundColor = '#f8f9fa'
  banner.style.color = 'red'
  banner.style.border = '3px solid red'
  banner.style.position = 'fixed'
  banner.style.top = '0'
  banner.style.left = '0'
  banner.style.zIndex = '10000'
  banner.style.fontSize = '24px'
  banner.textContent = 'Test Browser Extension is active on this page'

  const closeButton = document.createElement('button')
  closeButton.textContent = 'X'
  closeButton.style.marginLeft = '10px'
  closeButton.addEventListener('click', () => banner.remove())
  banner.appendChild(closeButton)

  document.body.appendChild(banner)

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (document.body.contains(banner)) {
      banner.remove()
    }
  }, bannerOpenTime)
}

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'analyze') {
    // Gather basic page information
    const pageInfo = {
      title: document.title,
      headings: document.querySelectorAll('h1, h2, h3').length,
      paragraphs: document.querySelectorAll('p').length,
      links: document.querySelectorAll('a').length,
    }

    sendResponse({ success: true, data: pageInfo })
  } else if (message.action === 'showNotification') {
    showNotification()
    sendResponse({ success: true })
  }

  return true // Keep the message channel open for async response
})
