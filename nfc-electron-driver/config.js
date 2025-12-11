const { app } = require("electron");
const path = require("path");

// Get the user data directory
const userDataPath = app.getPath("userData");

const defaultConfig = {
  api: {
    baseUrl: "https://vegas-baby.vercel.app",
    webhookUrl: "https://vegas-baby.vercel.app/api/webhooks/card-scan",
    vendorsUrl: "https://vegas-baby.vercel.app/api/vendors",
  },
};

module.exports = {
  userDataPath,
  defaultConfig,
};
