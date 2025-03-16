<div align="center">
  <img src="src/icon.png" alt="QR Code Reader Logo" width="128" height="128">
  
  # QR Code Reader Extension

  <a href="https://chromewebstore.google.com/detail/mkmmdabdljidjfkmdgklmgjfpkjmgplj" style="margin: 0 10px;">
    <img src="https://developer.chrome.com/static/docs/webstore/branding/image/UV4C4ybeBTsZt43U4xis.png" alt="Available in the Chrome Web Store" height="58">
  </a>
  <a href="https://addons.mozilla.org/en-US/firefox/addon/offline-local-qr-code-reader/" style="margin: 0 10px;">
    <img src="https://blog.mozilla.org/addons/files/2020/04/get-the-addon-fx-apr-2020.svg" alt="Get the Firefox Add-on" height="58">
  </a>

<br><br>

</div>

A powerful browser extension that allows you to read QR codes directly from web pages without requiring an internet connection. Simply select any area of the webpage containing a QR code, and the extension will decode it instantly.

## Installation

Install the extension directly from your browser's store:

- **Chrome, Edge, Brave**: Click the Chrome Web Store button above
- **Firefox**: Click the Firefox Add-on button above

## Features

- 🔍 **Region Selection**: Click and drag to select any area containing a QR code
- 🌐 **Offline Functionality**: Works completely offline using local QR code processing
- ⌨️ **Keyboard Shortcuts**: Quick activation using Alt+Q
- 📋 **Clipboard Integration**: Automatically copies decoded QR code content to clipboard
- 🔔 **Visual Feedback**: Toast notifications for all operations
- 🛡️ **Privacy-Focused**: No data transmission - all processing happens locally
- 🎯 **Precise Selection**: Visual overlay for accurate QR code targeting

## Development

### Firefox

1. Download the extension files
2. Open Firefox and navigate to `about:debugging`
3. Click "This Firefox" in the left sidebar
4. Click "Load Temporary Add-on"
5. Select the `manifest.json` file from the firefox directory

### Chromium (Chrome, Edge, Brave)

1. Download the extension files
2. Open Chrome/Edge/Brave and navigate to `chrome://extensions`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked"
5. Select the chromium directory

## Usage

1. Navigate to any webpage containing a QR code
2. Press `Alt+Q` or activate the extension from the toolbar
3. Click and drag to select the area containing the QR code
4. The QR code content will be automatically decoded and copied to your clipboard
5. A notification will appear showing the success/failure of the operation

### Additional Controls

- Press `Esc` to cancel the selection mode
- The selection overlay can be adjusted by clicking and dragging

## Technologies Used

- `jsQR.js` - QR code detection and decoding
- Browser WebExtensions API (compatible with Firefox and Chromium)
- Inter font (Medium and Regular weights) - Clean UI typography
- Pure JavaScript with no external dependencies for core functionality

## Permissions

The extension requires minimal permissions:

- `clipboardWrite`: For copying decoded QR codes to clipboard
- `activeTab`: For capturing the selected region
- `commands`: For keyboard shortcut support
- `web_accessible_resources`: For loading local font files

## Privacy

This extension processes everything locally:

- No data is sent to external servers
- QR code processing happens entirely in your browser
- No tracking or analytics included
- Fonts are locally bundled and don't make external requests
- All resources are served from the extension package

## Contributing

Feel free to submit issues and enhancement requests!
