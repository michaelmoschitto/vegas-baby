module.exports = {
  packagerConfig: {
    asar: true,
    appBundleId: "com.vegasbaby.nfcdriver",
    appCategoryType: "public.app-category.utilities",
    osxSign: {
      identity: "Developer ID Application: YOUR_NAME_HERE", // Replace with your Apple Developer ID
      hardenedRuntime: true,
      "gatekeeper-assess": false,
      entitlements: "entitlements.plist",
      "entitlements-inherit": "entitlements.plist",
      "signature-flags": "library",
    },
    osxNotarize: {
      tool: "notarytool",
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
    },
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "Vegas_Baby_NFC_Driver",
        authors: "Vegas Baby",
        exe: "Vegas Baby NFC Driver.exe",
      },
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
    },
    {
      name: "@electron-forge/maker-deb",
      config: {
        options: {
          maintainer: "Vegas Baby",
          homepage: "https://vegasbaby.com",
        },
      },
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {
        options: {
          maintainer: "Vegas Baby",
          homepage: "https://vegasbaby.com",
        },
      },
    },
  ],
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: "your-github-username",
          name: "your-repo-name",
        },
        prerelease: true,
      },
    },
  ],
};
