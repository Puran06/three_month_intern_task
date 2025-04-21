const express = require('express');
const router = express.Router();
const receive = require('./multerConfig'); // Correctly importing multer config
const { handleFileUpload } = require('./controller'); // Controller logic

// Route to handle file upload and extraction
router.post('/upload', receive.array('file'), handleFileUpload);

module.exports = router;
