const { NFC } = require("nfc-pcsc");
const fetch = require("node-fetch");
const crypto = require("crypto");
const { app } = require("electron");
const path = require("path");
const fs = require("fs");

const nfc = new NFC();

// Load API keys from config file
const configPath = path.join(app.getPath("userData"), "config.json");
let config = {};

try {
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  } else {
    throw new Error(
      `Config file not found at ${configPath}. Please create it with the required fields: vendor_id, key_id, secret_key, webhook_url.`
    );
  }
  // Validate required fields
  const requiredFields = ["vendor_id", "key_id", "secret_key", "webhook_url"];
  for (const field of requiredFields) {
    if (!config[field]) {
      throw new Error(
        `Missing required config field: ${field}. Please update your config file at ${configPath}.`
      );
    }
  }
} catch (error) {
  console.error("Error loading config:", error.message);
  process.exit(1);
}

// Create HMAC signature
function createSignature(timestamp, body) {
  const hmac = crypto.createHmac("sha256", config.secret_key);
  hmac.update(`${timestamp}:${body}`);
  return hmac.digest("hex");
}

nfc.on("reader", (reader) => {
  console.log(`${reader.reader.name} device attached`);

  reader.on("card", async (card) => {
    console.log(`${reader.reader.name} card detected`, card);

    try {
      const timestamp = new Date().toISOString();
      const payload = {
        vendor_id: config.vendor_id,
        card_uid: card.uid.toLowerCase(),
        reader_name: reader.reader.name,
        key_id: config.key_id,
        timestamp: timestamp,
      };

      const body = JSON.stringify(payload);
      const signature = createSignature(timestamp, body);

      // Send data to webhook
      const response = await fetch(config.webhook_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...payload,
          signature,
        }),
      });

      const data = await response.json();
      console.log("Webhook response:", data);
    } catch (error) {
      console.error("Error sending to webhook:", error);
    }
  });

  reader.on("error", (err) => {
    console.log(`${reader.reader.name} an error occurred`, err);
  });

  reader.on("end", () => {
    console.log(`${reader.reader.name} device removed`);
  });
});

nfc.on("error", (err) => {
  console.log("an error occurred", err);
});
