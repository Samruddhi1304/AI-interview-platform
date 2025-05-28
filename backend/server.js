// backend/server.js - TEMPORARY MINIMAL VERSION FOR DEBUGGING (NO WILDCARD CATCH-ALL)

require('dotenv').config(); // Keep if you use .env locally

const express = require('express');
const path = require('path'); // Ensure path is imported

const app = express();
const port = process.env.PORT || 3001;

// --- Serve React App (Frontend) ---
console.log("Minimal Server.js (No Wildcard): Setting up static file serving for frontend.");
// Serve static files from 'backend/build'
app.use(express.static(path.join(__dirname, 'build')));
console.log("Minimal Server.js (No Wildcard): Static files path set to:", path.join(__dirname, 'build'));

// Basic health check route (for testing backend directly)
// This will be reachable at /health, and should work if the server starts.
app.get('/health', (req, res) => {
    res.send('Minimal backend is healthy and /health works!');
    console.log("Minimal Server.js (No Wildcard): /health route accessed.");
});

// IMPORTANT: The app.get('*', ...) catch-all is REMOVED for this test.
// This means direct access to the root URL (https://your-app.onrender.com/)
// will now rely purely on express.static finding index.html in 'build'.
// If 'build' is empty or index.html isn't at the root of 'build', you'll likely
// get a "Cannot GET /" from Express itself, but the server should at least *start*.


// Start the server
console.log(`Minimal Server.js (No Wildcard): Attempting to start server on port: ${port}`);
app.listen(port, () => {
    console.log(`Minimal Server.js (No Wildcard): Backend server is running on port ${port}`);
    console.log("Minimal Server.js (No Wildcard): Application fully started!");
});

// Add general error handler at the very end to catch unhandled promise rejections or uncaught exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('Minimal Server.js (No Wildcard) UNHANDLED REJECTION:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Minimal Server.js (No Wildcard) UNCAUGHT EXCEPTION:', error);
  process.exit(1);
});