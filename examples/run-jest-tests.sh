#!/usr/bin/env bash
# Run the Jest unit + integration test suite.
# No running server needed — MSW intercepts all network calls.

set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Installing dependencies..."
npm install

echo ""
echo "==> Running Jest tests..."
npx jest --verbose

echo ""
echo "Done. All Jest tests passed."
