#!/bin/bash
# Bootstrap script — installs dependencies then starts the server
# Run: bash start.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ] || [ ! -d "node_modules/express" ]; then
  echo "   Running npm install..."
  npm install
  echo "   Done."
else
  echo "   Already installed."
fi

echo ""
echo "🚀 Starting Ticket Mock API..."
node server.js
