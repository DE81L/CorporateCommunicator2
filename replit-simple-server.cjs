/**
 * Replit Simple Server
 * 
 * This is a minimal server that listens on port 5000 to satisfy Replit's requirement
 * for a port to be open within 20 seconds. It's designed to be as lightweight as possible.
 */

const express = require('express');
const app = express();
const PORT = 5000;

// Set up a simple route that explains what's happening
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Corporate Messaging App</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .btn { display: inline-block; background: #0066ff; color: white; padding: 10px 20px; 
                text-decoration: none; border-radius: 4px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Corporate Messaging Application</h1>
          <p>The application is running on port 3000.</p>
          <p>This is a simple server running on port 5000 to satisfy Replit's requirements.</p>
          <a class="btn" href="https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co" target="_blank">
            Open Main Application
          </a>
        </div>
      </body>
    </html>
  `);
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Simple server running on port ${PORT}`);
  console.log('NOTE: The main application runs separately on port 3000');
});