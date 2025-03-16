// Handle keyboard command
chrome.commands.onCommand.addListener((command) => {
  if (command === "activate-qr-select") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { command: "activate-qr-select" });
    });
  }
});

// Handle clipboard operations and screenshots
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        console.error("Screenshot error:", chrome.runtime.lastError);
        sendResponse(null);
      } else {
        console.log("Full screenshot captured");
        sendResponse(dataUrl);
      }
    });
    return true; // Required for async response
  }
});
