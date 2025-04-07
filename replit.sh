#!/bin/bash

# This is a special script for the Replit workflow
# It starts the quick server first to satisfy the port requirement
# Then it starts the main application

# Start the quick server on port 5000
echo "Starting quick server..."
node replit-simple-server.cjs &
QUICK_SERVER_PID=$!

# Give the quick server a moment to start
sleep 1

# Run the main application with the original dev script
echo "Starting main application..."
npm run dev

# Cleanup
kill $QUICK_SERVER_PID