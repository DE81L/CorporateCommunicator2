// Simple server for testing Replit workflow
const express = require('express');
const app = express();
const PORT = 5000;

app.get('/', (req, res) => {
  res.send('Hello from Replit server!');
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API working' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});