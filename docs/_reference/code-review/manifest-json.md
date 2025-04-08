```json
{
  "manifest_version": 3,
  "name": "Test Browser Extension",
  "version": "1.0.0",
  "description": "A simple test browser extension with optimized permissions and security features",
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    },
    "default_title": "Test Browser Extension"
  },
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "permissions": ["storage", "activeTab"],
  "optional_host_permissions": ["https://*/*"],
  "options_page": "options.html",
  "content_scripts": [
    {
      "matches": ["https://*/*"],
      "js": ["content.js"],
      "run_at": "document_end"
    }
  ],
  "web_accessible_resources": [
    {
      "resources": ["images/*"],
      "matches": ["https://*/*"],
      "use_dynamic_url": false
    }
  ],
  "content_security_policy": {
    "extension_pages": "default-src 'self'; script-src 'self'; object-src 'none'; connect-src 'self'",
    "sandbox": "sandbox allow-scripts allow-forms allow-popups allow-modals; script-src 'self'; worker-src 'self'"
  },
  "author": "Jeff-411",
  "homepage_url": "https://github.com/Jeff-411/test-browser-extension",
  "minimum_chrome_version": "88",
  "incognito": "spanning"
}
```

This updated manifest.json implements several important improvements:

1. **Permission Optimization**:

   - Replaced broad `host_permissions` with the more targeted `activeTab` permission[1]
   - Added `optional_host_permissions` so the extension can request broader access only when needed[1]

2. **Security Enhancements**:

   - Implemented Content Security Policy using the modern object format instead of strings[1]
   - Added explicit CSP directives for extension pages to prevent XSS attacks[1]
   - Set `use_dynamic_url: false` for web accessible resources to improve security[1]

3. **Additional Best Practices**:
   - Added `type: "module"` to the background service worker for better code organization[1]
   - Specified `minimum_chrome_version: "88"` to ensure compatibility with Manifest V3[1]
   - Added `incognito: "spanning"` to define proper incognito mode behavior[1]

These changes maintain all the functionality while significantly improving security and adhering more closely to Chrome extension best practices and Manifest V3 guidelines.

Citations:
[1] https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/18441009/27aaae73-b159-4a5f-a2dd-904fbb219b1c/project-structure.md

---

Answer from Perplexity: pplx.ai/share
