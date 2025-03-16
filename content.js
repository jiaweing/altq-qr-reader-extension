// State variables
let selection = null;
let overlay = null;
let startX = 0;
let startY = 0;
let isSelecting = false;
let selectionModeActive = false;

// Create overlay element
function createOverlay() {
  overlay = document.createElement("div");
  overlay.className = "qr-overlay";
  document.body.appendChild(overlay);
}

// Remove overlay element
function removeOverlay() {
  if (overlay) {
    overlay.remove();
    overlay = null;
  }
}

// Create toast element for notifications
const toast = document.createElement("div");
toast.className = "qr-toast";
document.body.appendChild(toast);

function showToast(message, type) {
  console.log("showToast:", message, type);
  toast.textContent = message;
  toast.className = `qr-toast ${type}`;
  // Force reflow
  toast.offsetHeight;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function createSelection(x, y) {
  console.log("createSelection:", x, y);
  selection = document.createElement("div");
  selection.className = "qr-selection";
  document.body.appendChild(selection);
  updateSelection(x, y, x, y);
}

function updateSelection(startX, startY, endX, endY) {
  console.log("updateSelection:", { startX, startY, endX, endY });
  const scroll = getScrollOffset();

  // Convert coordinates to viewport-relative positions
  const viewportStartX = startX - scroll.x;
  const viewportStartY = startY - scroll.y;
  const viewportEndX = endX - scroll.x;
  const viewportEndY = endY - scroll.y;

  const left = Math.min(viewportStartX, viewportEndX);
  const top = Math.min(viewportStartY, viewportEndY);
  const width = Math.abs(viewportEndX - viewportStartX);
  const height = Math.abs(viewportEndY - viewportStartY);

  selection.style.left = left + "px";
  selection.style.top = top + "px";
  selection.style.width = width + "px";
  selection.style.height = height + "px";
}

function captureArea() {
  console.log("captureArea called");
  if (!selection) {
    console.error("captureArea: selection is null");
    return;
  }

  // Get selection dimensions from the viewport-relative selection element
  const rect = selection.getBoundingClientRect();
  const scroll = getScrollOffset();

  // Create capture rectangle in page coordinates
  const captureRect = {
    left: rect.left + scroll.x,
    top: rect.top + scroll.y,
    width: rect.width,
    height: rect.height,
  };

  // Ensure the capture area is within page bounds
  captureRect.left = Math.max(0, captureRect.left);
  captureRect.top = Math.max(0, captureRect.top);
  captureRect.width = Math.min(
    captureRect.width,
    document.documentElement.scrollWidth - captureRect.left
  );
  captureRect.height = Math.min(
    captureRect.height,
    document.documentElement.scrollHeight - captureRect.top
  );

  console.log("Selection dimensions:", captureRect);

  try {
    showToast("Reading QR code...", "success");

    // Create canvas and set dimensions
    const canvas = document.createElement("canvas");
    canvas.width = captureRect.width;
    canvas.height = captureRect.height;
    const ctx = canvas.getContext("2d");

    // Create a screenshot using native browser API
    console.log("Starting screenshot capture");
    browser.runtime
      .sendMessage({
        action: "captureVisibleTab",
        area: {
          x: captureRect.left,
          y: captureRect.top,
          width: captureRect.width,
          height: captureRect.height,
        },
      })
      .then((imageData) => {
        console.log("Screenshot captured, processing image");

        // Create an image from the screenshot data
        const img = new Image();
        img.onload = () => {
          // Draw the image onto our canvas
          ctx.drawImage(img, 0, 0, captureRect.width, captureRect.height);

          // Get the image data for QR processing
          const imageData = ctx.getImageData(
            0,
            0,
            captureRect.width,
            captureRect.height
          );
          console.log("Image data retrieved:", {
            width: imageData.width,
            height: imageData.height,
            dataLength: imageData.data.length,
          });

          // Ensure dimensions match between canvas and image data
          const width = imageData.width;
          const height = imageData.height;

          console.log("Attempting QR code detection");
          const code = jsQR(
            new Uint8ClampedArray(imageData.data.buffer),
            width,
            height
          );

          if (code) {
            console.log("QR code found:", code.data);
            browser.runtime
              .sendMessage({
                action: "copyToClipboard",
                text: code.data,
              })
              .then((response) => {
                console.log("Clipboard response:", response);
                if (response.success) {
                  showToast("QR code copied to clipboard!", "success");
                } else {
                  showToast("Failed to copy QR code", "error");
                }
              })
              .catch((err) => {
                console.error("Clipboard operation failed:", err);
                showToast("Failed to copy QR code", "error");
              });
          } else {
            console.log("No QR code found in selection");
            showToast("No QR code found in selection", "error");
          }
        };
        img.src = imageData;
      })
      .catch((err) => {
        console.error("Screenshot capture error:", err);
        showToast("Error capturing area", "error");
      });
  } catch (error) {
    console.error("captureArea error:", error);
    showToast("Error processing QR code", "error");
  }
}

// Listen for keyboard shortcut command
browser.runtime.onMessage.addListener((request) => {
  console.log("Received message:", request);
  if (request.command === "activate-qr-select") {
    console.log("Activating QR selection mode");
    selectionModeActive = true;
    createOverlay();
    showToast(
      "QR selection mode activated - Click and drag to select area",
      "success"
    );
  }
});

// Event listeners
function getScrollOffset() {
  return {
    x: window.pageXOffset || document.documentElement.scrollLeft,
    y: window.pageYOffset || document.documentElement.scrollTop,
  };
}

function handleMouseDown(e) {
  console.log("mousedown event:", {
    selectionModeActive,
    x: e.clientX,
    y: e.clientY,
  });
  if (!selectionModeActive) return;
  e.preventDefault();
  const scroll = getScrollOffset();
  isSelecting = true;
  startX = e.clientX + scroll.x;
  startY = e.clientY + scroll.y;
  createSelection(startX, startY);
}

function handleMouseMove(e) {
  if (selectionModeActive && isSelecting && selection) {
    e.preventDefault();
    const scroll = getScrollOffset();
    updateSelection(startX, startY, e.clientX + scroll.x, e.clientY + scroll.y);
  }
}

// Add event listeners to overlay instead of document
function handleMouseUp() {
  console.log("mouseup event:", {
    selectionModeActive,
    isSelecting,
    hasSelection: !!selection,
  });

  if (selectionModeActive && isSelecting && selection) {
    console.log("Starting capture process");
    isSelecting = false;
    selectionModeActive = false;

    // Get dimensions and capture area before removing selection
    captureArea();

    // Remove overlay before capturing to ensure it's not in the screenshot
    removeOverlay();

    // Clean up selection
    console.log("Cleaning up selection element");
    selection.remove();
    selection = null;
  }
}

function setupEventListeners() {
  if (overlay) {
    overlay.addEventListener("mousedown", handleMouseDown);
    overlay.addEventListener("mousemove", handleMouseMove);
    overlay.addEventListener("mouseup", handleMouseUp);
  }
}

// Remove event listeners when cleaning up
function removeEventListeners() {
  if (overlay) {
    overlay.removeEventListener("mousedown", handleMouseDown);
    overlay.removeEventListener("mousemove", handleMouseMove);
    overlay.removeEventListener("mouseup", handleMouseUp);
  }
}

// Update createOverlay to setup event listeners
function createOverlay() {
  overlay = document.createElement("div");
  overlay.className = "qr-overlay";
  document.body.appendChild(overlay);
  setupEventListeners();
}

// Update removeOverlay to cleanup event listeners
function removeOverlay() {
  if (overlay) {
    removeEventListeners();
    overlay.remove();
    overlay = null;
  }
}

// Disable selection mode on escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && selectionModeActive) {
    console.log("Escape key pressed, canceling selection");
    selectionModeActive = false;
    removeOverlay();
    if (selection) {
      selection.remove();
      selection = null;
    }
    isSelecting = false;
    showToast("Selection mode cancelled", "error");
  }
});
