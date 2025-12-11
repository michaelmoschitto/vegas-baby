const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("api", {
  // Vendor management
  getVendors: () => ipcRenderer.invoke("get-vendors"),
  refreshVendors: () => ipcRenderer.invoke("refresh-vendors"),
  saveSelectedVendor: (vendorId) =>
    ipcRenderer.invoke("save-selected-vendor", vendorId),
  getSelectedVendor: () => ipcRenderer.invoke("get-selected-vendor"),

  // NFC reader controls
  startNfcReader: () => ipcRenderer.invoke("start-nfc-reader"),
  stopNfcReader: () => ipcRenderer.invoke("stop-nfc-reader"),

  // Event listeners
  onVendorsUpdated: (callback) =>
    ipcRenderer.on("vendors-updated", (_, data) => callback(data)),
  onReaderStatus: (callback) =>
    ipcRenderer.on("reader-status", (_, data) => callback(data)),
  onCardDetected: (callback) =>
    ipcRenderer.on("card-detected", (_, data) => callback(data)),
  onWebhookResponse: (callback) =>
    ipcRenderer.on("webhook-response", (_, data) => callback(data)),
  onNfcError: (callback) =>
    ipcRenderer.on("nfc-error", (_, error) => callback(error)),
  onReaderError: (callback) =>
    ipcRenderer.on("reader-error", (_, data) => callback(data)),

  // Clean up event listeners (good practice)
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
});
