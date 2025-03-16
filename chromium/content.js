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

  // Calculate selection dimensions directly in viewport space
  const left = Math.round(Math.min(startX, endX));
  const top = Math.round(Math.min(startY, endY));
  const right = Math.round(Math.max(startX, endX));
  const bottom = Math.round(Math.max(startY, endY));

  // Set selection element dimensions
  selection.style.left = left + "px";
  selection.style.top = top + "px";
  selection.style.width = right - left + "px";
  selection.style.height = bottom - top + "px";
}

function captureArea(dimensions) {
  console.log("captureArea called");
  if (!dimensions) {
    console.error("captureArea: dimensions not provided");
    return;
  }

  // Keep coordinates in viewport space for capture
  const captureRect = {
    x: Math.round(dimensions.rect.left),
    y: Math.round(dimensions.rect.top),
    width: Math.round(dimensions.rect.width),
    height: Math.round(dimensions.rect.height),
  };

  console.log("Capture coordinates (viewport space):", {
    captureRect,
    dimensions,
  });

  try {
    showToast("Reading QR code...", "success");
    console.log("Starting screenshot capture");
    chrome.runtime.sendMessage(
      {
        action: "captureVisibleTab",
        area: captureRect,
      },
      (imageData) => {
        if (chrome.runtime.lastError) {
          console.error("Screenshot error:", chrome.runtime.lastError);
          showToast("Error capturing area", "error");
          return;
        }

        console.log("Screenshot captured, processing image");

        // Create an image from the screenshot data
        const img = new Image();
        img.onload = () => {
          let code = null;

          // Create preview toast
          const previewToast = document.createElement("div");
          previewToast.className = "qr-toast success";

          // Create small preview canvas
          const previewCanvas = document.createElement("canvas");
          const size = 100; // Small fixed size for preview
          previewCanvas.width = size;
          previewCanvas.height = size;
          previewCanvas.style.marginRight = "10px";
          previewCanvas.style.verticalAlign = "middle";
          const previewCtx = previewCanvas.getContext("2d");

          // Calculate device pixel ratio based on image vs window size
          const imageScaleRatio = img.width / window.innerWidth;
          console.log("Scale ratio:", {
            imageWidth: img.width,
            windowWidth: window.innerWidth,
            ratio: imageScaleRatio,
          });

          // Calculate scaled coordinates
          const scaledX = Math.round(captureRect.x * imageScaleRatio);
          const scaledY = Math.round(captureRect.y * imageScaleRatio);
          const scaledWidth = Math.round(captureRect.width * imageScaleRatio);
          const scaledHeight = Math.round(captureRect.height * imageScaleRatio);

          // Create QR detection canvas at full resolution
          const qrCanvas = document.createElement("canvas");
          const qrCtx = qrCanvas.getContext("2d");
          qrCanvas.width = scaledWidth;
          qrCanvas.height = scaledHeight;

          // Extract the exact region from the full screenshot
          qrCtx.drawImage(
            img,
            scaledX,
            scaledY,
            scaledWidth,
            scaledHeight,
            0,
            0,
            scaledWidth,
            scaledHeight
          );

          // Get image data for QR detection at full resolution
          const qrImageData = qrCtx.getImageData(
            0,
            0,
            scaledWidth,
            scaledHeight
          );

          // Apply high contrast filter for better QR detection
          const data = qrImageData.data;
          for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const val = avg > 127 ? 255 : 0;
            data[i] = data[i + 1] = data[i + 2] = val;
          }

          // Attempt QR detection
          code = jsQR(data, scaledWidth, scaledHeight);

          // Draw scaled preview
          previewCtx.imageSmoothingEnabled = true;
          previewCtx.drawImage(qrCanvas, 0, 0, size, size);

          // If QR code was found, highlight its location with a simple outline
          if (code) {
            previewCtx.strokeStyle = "#fff";
            previewCtx.lineWidth = 2;
            previewCtx.strokeRect(2, 2, size - 4, size - 4);
          }

          // Create preview container with flex layout
          const container = document.createElement("div");
          container.style.display = "flex";
          container.style.alignItems = "center";

          // Add the canvas
          container.appendChild(previewCanvas);

          // Add the QR code data
          const textContent = document.createElement("div");
          textContent.style.marginLeft = "10px";
          textContent.style.flex = "1";
          textContent.innerHTML = code
            ? `Found QR Code:<br><strong>${code.data}</strong>`
            : "No QR code found";
          container.appendChild(textContent);

          previewToast.appendChild(container);
          document.body.appendChild(previewToast);

          // Force reflow and show
          previewToast.offsetHeight;
          previewToast.classList.add("show");

          // Auto-hide after 5 seconds
          setTimeout(() => {
            previewToast.classList.remove("show");
            setTimeout(() => previewToast.remove(), 300);
          }, 5000);

          if (code) {
            console.log("QR code found:", code.data);
            chrome.runtime.sendMessage(
              {
                action: "copyToClipboard",
                text: code.data,
              },
              (response) => {
                console.log("Clipboard response:", response);
                if (response?.success) {
                  showToast("QR code copied to clipboard!", "success");
                } else {
                  showToast("Failed to copy QR code", "error");
                }
              }
            );
          } else {
            console.log("No QR code found in selection");
            showToast("No QR code found in selection", "error");
          }
        };
        img.src = imageData;
      }
    );
  } catch (error) {
    console.error("captureArea error:", error);
    showToast("Error processing QR code", "error");
  }
}

// Listen for keyboard shortcut command
chrome.runtime.onMessage.addListener((request) => {
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
  isSelecting = true;
  startX = e.clientX;
  startY = e.clientY;
  createSelection(startX, startY);
}

function handleMouseMove(e) {
  if (selectionModeActive && isSelecting && selection) {
    e.preventDefault();
    updateSelection(startX, startY, e.clientX, e.clientY);
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

    // Get dimensions for capture in viewport coordinates
    const rect = selection.getBoundingClientRect();

    // Store exact coordinates before cleanup (already in viewport space)
    const dimensions = {
      rect: {
        left: Math.round(rect.left),
        top: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
      // No scroll offset needed since we're using viewport coordinates
      scroll: { x: 0, y: 0 },
    };

    console.log("Captured dimensions:", dimensions);

    // Small delay to ensure stable rendering before capture
    setTimeout(() => {
      // Remove overlay before capturing to ensure it's not in the screenshot
      removeOverlay();

      // Clean up selection
      console.log("Cleaning up selection element");
      selection.remove();
      selection = null;

      // Start capture after cleanup
      captureArea(dimensions);
    }, 50);
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
