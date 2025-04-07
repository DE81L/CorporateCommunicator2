#!/bin/bash

# Start the simple server in the background immediately
echo "Starting simple server on port 5000..."
node replit-simple-server.cjs &
SIMPLE_SERVER_PID=$!

# Wait a moment to ensure the simple server starts
sleep 2

# Then run the normal startup script
echo "Starting main application..."
npm run dev

# Clean up on exit
trap "kill $SIMPLE_SERVER_PID" EXIT