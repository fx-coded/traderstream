const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

// Basic health check endpoint
app.get('/', (req, res) => {
  res.send('Server is running');
});

// Start server
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});