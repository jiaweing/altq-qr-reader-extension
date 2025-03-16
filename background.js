// Handle keyboard command
browser.commands.onCommand.addListener((command) => {
  if (command === "activate-qr-select") {
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      browser.tabs.sendMessage(tabs[0].id, { command: "activate-qr-select" });
    });
  }
});

// Handle clipboard operations and screenshots
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "copyToClipboard") {
    navigator.clipboard
      .writeText(request.text)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Required for async response
  }

  if (request.action === "captureVisibleTab") {
    browser.tabs
      .captureVisibleTab(null, { format: "png" })
      .then((dataUrl) => {
        sendResponse(dataUrl);
      })
      .catch((error) => {
        console.error("Screenshot error:", error);
        sendResponse(null);
      });
    return true; // Required for async response
  }
});
