// Main popup functionality
document.addEventListener('DOMContentLoaded', function () {
  // Cache DOM elements
  const analyzePageBtn = document.getElementById('analyze-page')
  const notifyBtn = document.getElementById('notify')
  const openOptionsLink = document.getElementById('open-options')
  const resultsContent = document.getElementById('results-content')

  // Analyze current page button
  analyzePageBtn.addEventListener('click', function () {
    // Show loading state
    resultsContent.innerHTML = '<p>Analyzing page...</p>'

    // Query the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs.length === 0) {
        showError('No active tab found')
        return
      }

      const activeTab = tabs[0]

      // Send message to content script
      chrome.tabs.sendMessage(activeTab.id, { action: 'analyze' }, function (response) {
        if (chrome.runtime.lastError) {
          showError('Error: ' + chrome.runtime.lastError.message)
          return
        }

        if (response && response.success) {
          displayResults(response.data)
        } else {
          showError('Failed to analyze page')
        }
      })
    })
  })

  // Show notification button
  notifyBtn.addEventListener('click', function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'showNotification' }, function (response) {
          if (chrome.runtime.lastError) {
            showError('Error: ' + chrome.runtime.lastError.message)
          } else {
            showSuccess('Notification displayed!')
          }
        })
      }
    })
  })

  // Open options page
  openOptionsLink.addEventListener('click', function (e) {
    e.preventDefault()
    chrome.runtime.openOptionsPage()
  })

  // Helper function to display analysis results
  function displayResults(data) {
    let html = '<div class="message success">Page analysis complete!</div>'

    html += '<div class="data-item">'
    html += '<span class="data-label">Page Title:</span>'
    html += '<span class="data-value">' + sanitizeHTML(data.title) + '</span>'
    html += '</div>'

    html += '<div class="data-item">'
    html += '<span class="data-label">Headings:</span>'
    html += '<span class="data-value">' + data.headings + '</span>'
    html += '</div>'

    html += '<div class="data-item">'
    html += '<span class="data-label">Paragraphs:</span>'
    html += '<span class="data-value">' + data.paragraphs + '</span>'
    html += '</div>'

    html += '<div class="data-item">'
    html += '<span class="data-label">Links:</span>'
    html += '<span class="data-value">' + data.links + '</span>'
    html += '</div>'

    resultsContent.innerHTML = html
  }

  // Helper function to show error message
  function showError(message) {
    resultsContent.innerHTML = '<div class="message error">' + message + '</div>'
  }

  // Helper function to show success message
  function showSuccess(message) {
    resultsContent.innerHTML = '<div class="message success">' + message + '</div>'
  }

  // Helper function to sanitize HTML
  function sanitizeHTML(str) {
    const temp = document.createElement('div')
    temp.textContent = str
    return temp.innerHTML
  }
})
