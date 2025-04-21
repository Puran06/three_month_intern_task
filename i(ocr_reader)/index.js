const express = require('express');
const app = express();
const port = process.env.PORT || 3000; // Default to port 3000 if not specified

// Middleware to parse JSON bodies (useful for APIs)
app.use(express.json()); // If you're expecting JSON data in the request body

// Import the extractRoute
const extractRoute = require('./extractRoute');

// Use the extractRoute for the `/extract` endpoint
app.use('/extract', extractRoute);

// Start the server
app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});
