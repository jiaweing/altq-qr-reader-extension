// Function to handle QR select activation
async function activateQRSelect(tab) {
  try {
    if (tab?.id) {
      await chrome.tabs.sendMessage(tab.id, {
        command: "activate-qr-select",
      });
    }
  } catch (error) {
    console.error("Error activating QR select:", error);
  }
}

// Handle keyboard command
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "activate-qr-select") {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    await activateQRSelect(tab);
  }
});

// Handle toolbar icon click
chrome.action.onClicked.addListener(activateQRSelect);

// Handle clipboard operations and screenshots
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "copyToClipboard") {
    navigator.clipboard
      .writeText(request.text)
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === "captureVisibleTab") {
    chrome.tabs
      .captureVisibleTab(null, { format: "png" })
      .then((dataUrl) => {
        console.log("Full screenshot captured");
        sendResponse(dataUrl);
      })
      .catch((error) => {
        console.error("Screenshot error:", error);
        sendResponse(null);
      });
    return true;
  }
});
