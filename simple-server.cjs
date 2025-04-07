/**
 * Simple Express Server
 * 
 * This is a minimal server that listens on port 5000 to satisfy Replit's requirements
 * while also serving as a compatibility layer for the application.
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Serve static files if they exist
app.use(express.static(path.join(__dirname, 'public')));

// Basic routes
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Simple Server</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #333; }
          .info { background-color: #f0f0f0; padding: 15px; border-radius: 5px; }
          .redirect { margin-top: 20px; }
          a { color: #0066cc; }
        </style>
      </head>
      <body>
        <h1>Simple Server Running</h1>
        <div class="info">
          <p>This is a simple server running on port ${PORT}.</p>
          <p>The main application is available on port 3000.</p>
        </div>
        <div class="redirect">
          <p><a href="https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co" target="_blank">Go to Main Application →</a></p>
        </div>
      </body>
    </html>
  `);
});

// Status endpoint for health checks
app.get('/status', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Simple Express server running on port ${PORT}`);
});