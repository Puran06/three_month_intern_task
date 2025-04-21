const express = require("express");
const router = express.Router();
const storeGeminiSession = require("../controllers/storeGeminiSession"); // Import the controller for storing sessions

// Assuming the 'GoogleGenerativeAI' package is used for content generation
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });  // Use the 'gemini-2.0-flash' model

// Basic content generation route
router.post("/", async (req, res) => {
    try {
        const { prompt } = req.body;  // Extract the prompt from the request body.

        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required." });
        }

        // Call the generateContent function with the prompt using the 'gemini-2.0-flash' model.
        const result = await model.generateContent(prompt);
        const response = await result.response;  // Retrieve the response from the result.
        const text = response.text();  // Get the text from the response object.

        res.json({ message: "Content generated successfully", content: text });  // Return the generated content.
    } catch (err) {
        console.error("Error in /gemini:", err);
        res.status(500).json({ error: "Unexpected Error!" });  // If any error occurs, return a 500 error.
    }
});

// Add the store route for storing sessions in the database
router.post("/store", storeGeminiSession);  // Link to the storeGeminiSession controller

module.exports = router;
