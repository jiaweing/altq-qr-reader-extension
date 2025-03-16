# QR Code Reader Extension for Firefox

A powerful Firefox extension that allows you to read QR codes directly from web pages without requiring an internet connection. Simply select any area of the webpage containing a QR code, and the extension will decode it instantly.

## Features

- 🔍 **Region Selection**: Click and drag to select any area containing a QR code
- 🌐 **Offline Functionality**: Works completely offline using local QR code processing
- ⌨️ **Keyboard Shortcuts**: Quick activation using Alt+Q
- 📋 **Clipboard Integration**: Automatically copies decoded QR code content to clipboard
- 🔔 **Visual Feedback**: Toast notifications for all operations
- 🛡️ **Privacy-Focused**: No data transmission - all processing happens locally
- 🎯 **Precise Selection**: Visual overlay for accurate QR code targeting

## Installation

1. Download the extension files
2. Open Firefox and navigate to `about:debugging`
3. Click "This Firefox" in the left sidebar
4. Click "Load Temporary Add-on"
5. Select the `manifest.json` file from the extension directory

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
- `html2canvas.js` - Web page region capture
- Firefox WebExtensions API
- Pure JavaScript with no external dependencies for core functionality

## Permissions

The extension requires minimal permissions:

- `clipboardWrite`: For copying decoded QR codes to clipboard
- `activeTab`: For capturing the selected region
- `commands`: For keyboard shortcut support

## Privacy

This extension processes everything locally:

- No data is sent to external servers
- QR code processing happens entirely in your browser
- No tracking or analytics included

## Contributing

Feel free to submit issues and enhancement requests!
