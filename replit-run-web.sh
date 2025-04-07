#!/bin/bash

# Start the simple server in the background
echo "Starting simple server on port 5000..."
node replit-simple-server.cjs &
SIMPLE_SERVER_PID=$!

# Wait a moment to ensure the simple server starts
sleep 2

# Start the Node.js server in the background
echo "Starting Express server..."
tsx server/index.ts &
SERVER_PID=$!

# Start the Vite development server
echo "Starting Vite development server..."
cd client && cross-env ELECTRON=false NODE_ENV=development vite

# Clean up on exit
kill $SIMPLE_SERVER_PID
kill $SERVER_PID