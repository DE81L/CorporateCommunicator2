#!/bin/bash

# Start the simple server on port 5000 in the background
node simple-server.js &
simple_server_pid=$!

# Start the actual web application
node replit-web-entry.js &
web_app_pid=$!

# Function to handle termination
cleanup() {
  echo "Shutting down servers..."
  kill $simple_server_pid
  kill $web_app_pid
  exit 0
}

# Register signal handlers
trap cleanup SIGINT SIGTERM

# Wait for processes to complete
wait $web_app_pid
wait $simple_server_pid
