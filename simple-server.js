const express = require('express');

// Create a simple Express server to satisfy Replit's port 5000 requirement
const app = express();
const PORT = 5000;

app.get('/', (req, res) => {
  res.send('Simple server running on port 5000. The main application is running on port 3000.');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Simple server running on port ${PORT}`);
});