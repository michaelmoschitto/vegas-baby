const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { NFC } = require("nfc-pcsc");
const axios = require("axios");
const crypto = require("crypto");
const { userDataPath, defaultConfig } = require("./config");

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require("electron-squirrel-startup")) {
  app.quit();
}

// Create NFC reader instance
const nfc = new NFC();

// Keep a global reference of the window object
let mainWindow;
let store;

// Initialize the app
async function initApp() {
  const { default: Store } = await import("electron-store");
  store = new Store({
    name: "vegas-baby-config",
    cwd: userDataPath,
    defaults: defaultConfig,
  });

  // Reset API configuration to ensure we're using the latest URLs
  store.set("api", defaultConfig.api);

  // Log the current configuration
  console.log("App configuration:", {
    userDataPath,
    config: store.store,
  });

  createWindow();
  fetchVendors();
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load the index.html of the app
  mainWindow.loadFile("index.html");

  // Open DevTools in development
  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }
}

// Initialize app when Electron is ready
app.whenReady().then(() => {
  initApp();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

// IPC handlers
ipcMain.handle("get-vendors", async () => {
  // Always fetch fresh data when getting vendors
  await fetchVendors();
  return store.get("vendors", []);
});

ipcMain.handle("save-selected-vendor", async (event, vendorId) => {
  try {
    // Generate new API key for the vendor
    const response = await axios.post(
      `${store.get("api.baseUrl")}/api/vendors/${vendorId}/api-key`
    );

    if (response.data.success) {
      const { key_id, secret_key } = response.data.data;

      // Store the API key info
      store.set("apiKey", {
        key_id,
        secret_key,
        vendor_id: vendorId,
      });

      // Store the selected vendor
      store.set("selectedVendorId", vendorId);

      return true;
    }
    return false;
  } catch (error) {
    console.error("Error generating API key:", error);
    return false;
  }
});

ipcMain.handle("get-selected-vendor", () => {
  return store.get("selectedVendorId", "");
});

ipcMain.handle("start-nfc-reader", () => {
  setupNfcReader();
  return true;
});

ipcMain.handle("stop-nfc-reader", () => {
  // In a production app, you'd want to properly close the NFC connection
  // This is simplified for the MVP
  return true;
});

// Add new handler for refreshing vendors
ipcMain.handle("refresh-vendors", async () => {
  await fetchVendors();
  return store.get("vendors", []);
});

// Function to fetch vendors from API
async function fetchVendors() {
  try {
    const response = await axios.get(store.get("api.vendorsUrl"));
    if (response.data) {
      store.set("vendors", response.data);
      if (mainWindow) {
        mainWindow.webContents.send("vendors-updated", response.data);
      }
    }
  } catch (error) {
    console.error("Error fetching vendors:", error);
    if (mainWindow) {
      mainWindow.webContents.send("vendors-error", {
        message:
          "Failed to fetch vendors. Please check your connection and try again.",
      });
    }
  }
}

// Create HMAC signature
function createSignature(timestamp, body) {
  const apiKey = store.get("apiKey");
  if (!apiKey) {
    return null;
  }

  const hmac = crypto.createHmac("sha256", apiKey.secret_key);
  const message = `${timestamp}:${body}`;
  hmac.update(message);
  return hmac.digest("hex");
}

// Function to set up NFC reader
function setupNfcReader() {
  console.log("setupNfcReader called"); // DEBUG LOG
  const apiKey = store.get("apiKey");
  if (!apiKey) {
    if (mainWindow) {
      mainWindow.webContents.send(
        "nfc-error",
        "No API key found. Please select a vendor first."
      );
    }
    return;
  }

  // Remove all previous listeners to prevent duplicates
  nfc.removeAllListeners("reader");
  nfc.removeAllListeners("error");

  nfc.on("reader", (reader) => {
    console.log(`NFC reader event registered for: ${reader.reader.name}`); // DEBUG LOG
    reader.removeAllListeners(); // Remove all previous listeners on this reader
    if (mainWindow) {
      mainWindow.webContents.send("reader-status", {
        status: "connected",
        name: reader.reader.name,
      });
    }

    reader.on("card", async (card) => {
      console.log(`Card event handler triggered for UID: ${card.uid}`); // DEBUG LOG
      if (mainWindow) {
        mainWindow.webContents.send("card-detected", {
          uid: card.uid.toLowerCase(),
          reader: reader.reader.name,
        });
      }

      try {
        const timestamp = new Date().toISOString();
        const payload = {
          vendor_id: apiKey.vendor_id,
          card_uid: card.uid.toLowerCase(),
          reader_name: reader.reader.name,
          key_id: apiKey.key_id,
          timestamp: timestamp,
        };

        const body = JSON.stringify(payload);
        const signature = createSignature(timestamp, body);

        if (!signature) {
          throw new Error("Failed to create signature");
        }

        // Send data to webhook
        const response = await axios.post(store.get("api.webhookUrl"), {
          ...payload,
          signature,
        });

        if (mainWindow) {
          mainWindow.webContents.send("webhook-response", {
            success: true,
            data: response.data,
          });
        }
      } catch (error) {
        console.error("Error sending to webhook:", error);
        if (mainWindow) {
          mainWindow.webContents.send("webhook-response", {
            success: false,
            error: error.message,
          });
        }
      }
    });

    reader.on("error", (err) => {
      console.error(`${reader.reader.name} error:`, err);
      if (mainWindow) {
        mainWindow.webContents.send("reader-error", {
          reader: reader.reader.name,
          error: err.message,
        });
      }
    });

    reader.on("end", () => {
      if (mainWindow) {
        mainWindow.webContents.send("reader-status", {
          status: "disconnected",
          name: reader.reader.name,
        });
      }
    });
  });

  nfc.on("error", (err) => {
    console.error("NFC error:", err);
    if (mainWindow) {
      mainWindow.webContents.send("nfc-error", err.message);
    }
  });
}
