/**
 * Playwright configuration — points at the local cart app.
 * Starts the dev server automatically before running tests.
 */

const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: ".",
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    headless: true,
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node ../src/server.js",
    port: 3000,
    reuseExistingServer: true,
    timeout: 10_000,
  },
});
