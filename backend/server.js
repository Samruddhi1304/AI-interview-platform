// backend/server.js - TEMPORARY MINIMAL VERSION FOR DEBUGGING

require('dotenv').config(); // Keep if you use .env locally

const express = require('express');
const path = require('path'); // Ensure path is imported

const app = express();
const port = process.env.PORT || 3001;

// --- Serve React App (Frontend) ---
console.log("Minimal Server.js: Setting up static file serving for frontend.");
app.use(express.static(path.join(__dirname, 'build')));
console.log("Minimal Server.js: Static files path set to:", path.join(__dirname, 'build'));

// Basic health check route (for testing backend directly)
app.get('/health', (req, res) => {
    res.send('Minimal backend is healthy!');
    console.log("Minimal Server.js: /health route accessed.");
});

// For any requests that are NOT caught by static files or /health, serve the main React index.html
app.get('*', (req, res) => {
    console.log("Minimal Server.js: Serving index.html for route:", req.path);
    res.sendFile(path.join(__dirname, 'build', 'index.html'), (err) => {
        if (err) {
            console.error("Minimal Server.js: Error sending index.html:", err);
            res.status(500).send(err);
        }
    });
});

// Start the server
console.log(`Minimal Server.js: Attempting to start server on port: ${port}`);
app.listen(port, () => {
    console.log(`Minimal Server.js: Backend server is running on port ${port}`);
    console.log("Minimal Server.js: Application fully started!");
});

// Add general error handler at the very end to catch unhandled promise rejections or uncaught exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('Minimal Server.js UNHANDLED REJECTION:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Minimal Server.js UNCAUGHT EXCEPTION:', error);
  process.exit(1);
});