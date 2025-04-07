#!/bin/bash

# Start the simple server on port 5000 first in the background
echo "Starting simple server on port 5000..."
node replit-simple-server.cjs &
SIMPLE_SERVER_PID=$!

# Wait a moment to ensure the simple server started
sleep 3

# Then start the main application
echo "Starting main application..."
npm run dev:web

# Cleanup on exit
trap "kill $SIMPLE_SERVER_PID" EXIT