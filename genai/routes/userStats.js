// routes/gemini.js
const express = require('express');
const storeGeminiSession = require('../controllers/storeGeminiSession');

const router = express.Router();

// Route for storing the prompt session
router.post('/store', storeGeminiSession);

module.exports = router;
