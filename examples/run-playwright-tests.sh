#!/usr/bin/env bash
# Run the Playwright E2E test suite.
# The Playwright config auto-starts the Express server before tests run.

set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Installing dependencies..."
npm install

echo ""
echo "==> Installing Playwright browsers..."
npx playwright install --with-deps chromium

echo ""
echo "==> Running Playwright tests..."
npx playwright test --config playwright/playwright.config.js

echo ""
echo "Done. All Playwright E2E tests passed."
