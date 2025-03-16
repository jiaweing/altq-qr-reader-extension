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

function showToast(message, type, options = {}) {
  if (options.preview) {
    // Remove any existing preview toasts only
    const existingPreviews = document.querySelectorAll(".qr-toast.preview");
    existingPreviews.forEach((t) => t.remove());

    const previewToast = document.createElement("div");
    previewToast.className = `qr-toast preview ${type}`;

    // Create preview container with vertical flex layout
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.alignItems = "center";
    container.style.gap = "16px";
    container.style.padding = "12px";
    container.style.width = "100%";
    container.style.maxHeight = "90vh";

    // Add the preview canvas
    const { canvas, code } = options.preview;
    container.appendChild(canvas);

    // Add the QR code data
    const textContent = document.createElement("div");
    textContent.className = "qr-text-content";
    textContent.style.textAlign = "center";
    textContent.style.width = "100%";
    textContent.innerHTML = code ? `${code}` : message;
    container.appendChild(textContent);

    previewToast.appendChild(container);

    // Preview toast styles
    previewToast.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
    previewToast.style.backdropFilter = "blur(8px)";
    previewToast.style.border = "1px solid rgba(255, 255, 255, 0.15)";

    document.body.appendChild(previewToast);
    // Force reflow
    previewToast.offsetHeight;
    previewToast.classList.add("show");

    setTimeout(() => {
      previewToast.classList.remove("show");
      setTimeout(() => previewToast.remove(), 300);
    }, 5000);
  } else {
    // Use global toast for simple messages
    toast.textContent = message;
    toast.className = `qr-toast ${type}`;
    // Force reflow
    toast.offsetHeight;
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }
}

function createSelection(x, y) {
  selection = document.createElement("div");
  selection.className = "qr-selection";
  document.body.appendChild(selection);
  updateSelection(x, y, x, y);
}

function updateSelection(startX, startY, endX, endY) {
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

  try {
    browser.runtime
      .sendMessage({
        action: "captureVisibleTab",
        area: captureRect,
      })
      .then((imageData) => {
        // Create an image from the screenshot data
        const img = new Image();
        img.onload = () => {
          // Create preview canvas
          const previewCanvas = document.createElement("canvas");
          const size = 180;
          previewCanvas.width = size;
          previewCanvas.height = size;
          previewCanvas.style.borderRadius = "8px";
          previewCanvas.style.verticalAlign = "middle";
          const previewCtx = previewCanvas.getContext("2d");

          // Calculate coordinates and prepare QR detection
          const imageScaleRatio = img.width / window.innerWidth;
          const scaledX = Math.round(captureRect.x * imageScaleRatio);
          const scaledY = Math.round(captureRect.y * imageScaleRatio);
          const scaledWidth = Math.round(captureRect.width * imageScaleRatio);
          const scaledHeight = Math.round(captureRect.height * imageScaleRatio);

          // Create QR detection canvas
          const qrCanvas = document.createElement("canvas");
          const qrCtx = qrCanvas.getContext("2d");
          qrCanvas.width = scaledWidth;
          qrCanvas.height = scaledHeight;

          // Extract region and prepare for QR detection
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
          const qrImageData = qrCtx.getImageData(
            0,
            0,
            scaledWidth,
            scaledHeight
          );

          // Apply high contrast filter
          const data = qrImageData.data;
          for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const val = avg > 127 ? 255 : 0;
            data[i] = data[i + 1] = data[i + 2] = val;
          }

          // Detect QR code
          let code = jsQR(data, scaledWidth, scaledHeight);

          // Draw preview
          previewCtx.imageSmoothingEnabled = true;
          previewCtx.drawImage(qrCanvas, 0, 0, size, size);

          // Draw QR code polygon if found
          if (code) {
            const scaleX = size / scaledWidth;
            const scaleY = size / scaledHeight;

            previewCtx.strokeStyle = "#00ff00";
            previewCtx.lineWidth = 2;
            previewCtx.beginPath();
            previewCtx.moveTo(
              code.location.topLeftCorner.x * scaleX,
              code.location.topLeftCorner.y * scaleY
            );
            previewCtx.lineTo(
              code.location.topRightCorner.x * scaleX,
              code.location.topRightCorner.y * scaleY
            );
            previewCtx.lineTo(
              code.location.bottomRightCorner.x * scaleX,
              code.location.bottomRightCorner.y * scaleY
            );
            previewCtx.lineTo(
              code.location.bottomLeftCorner.x * scaleX,
              code.location.bottomLeftCorner.y * scaleY
            );
            previewCtx.closePath();
            previewCtx.stroke();
          }

          // Show preview toast
          showToast("No QR code found", code ? "" : "error", {
            preview: {
              canvas: previewCanvas,
              code: code?.data,
            },
          });

          if (code) {
            console.log("QR code found:", code.data);
            browser.runtime
              .sendMessage({
                action: "copyToClipboard",
                text: code.data,
              })
              .then((response) => {
                console.log("Clipboard response:", response);
              })
              .catch((err) => {
                console.error("Clipboard operation failed:", err);
                showToast("Failed to copy QR code", "error");
              });
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
  if (request.command === "activate-qr-select") {
    selectionModeActive = true;
    createOverlay();
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
  if (selectionModeActive && isSelecting && selection) {
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

    // Small delay to ensure stable rendering before capture
    setTimeout(() => {
      // Remove overlay before capturing to ensure it's not in the screenshot
      removeOverlay();

      // Clean up selection
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
    selectionModeActive = false;
    removeOverlay();
    if (selection) {
      selection.remove();
      selection = null;
    }
    isSelecting = false;
    showToast("Exited Selection", "error");
  }
});
