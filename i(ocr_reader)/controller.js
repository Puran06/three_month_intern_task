// controller.js
const fs = require('fs');
const path = require('path');
const tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');
const summarizeText = require('./summarizer');  // Import summarization function
const { addToWeaviate } = require('./weaviateService'); // Import the function that will handle adding the data to Weaviate
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters'); // Import splitter

async function handleFileUpload(req, res) {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'At least one file is required' });
  }

  try {
    const extractedTexts = [];

    for (const file of req.files) {
      const filePath = file.path;
      const ext = path.extname(file.originalname).toLowerCase();
      let extractedText = '';

      // 🧾 PDF Case
      if (ext === '.pdf') {
        const buffer = fs.readFileSync(filePath);
        const data = await pdfParse(buffer);
        extractedText = data.text;
      }
      // 🖼 Image OCR Case
      else if (['.png', '.jpg', '.jpeg', '.bmp'].includes(ext)) {
        const result = await tesseract.recognize(filePath, 'eng', {
          logger: (m) => console.log(m),
        });
        extractedText = result.data.text;
      } else {
        // Cleanup file and skip unsupported type
        fs.unlinkSync(filePath);
        continue;
      }

      // Cleanup temp file after extraction
      fs.unlinkSync(filePath);

      // Split large text using the RecursiveCharacterTextSplitter
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      const allSplits = await splitter.splitDocuments([{ pageContent: extractedText, metadata: "puran" }]);

      // Send each chunk to summarizer and add to Weaviate
      for (const chunk of allSplits) {
        const summary = await summarizeText(chunk.pageContent);
        await addToWeaviate(chunk.pageContent, summary);
        extractedTexts.push({
          type: ext === '.pdf' ? 'pdf' : 'image',
          extractedText: chunk.pageContent,
          summary: summary,
        });
      }
    }

    return res.json({
      message: 'Text extraction and summarization completed successfully',
      extractedTexts: extractedTexts,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: 'Text extraction or summarization failed',
      error: err.message,
    });
  }
}

module.exports = { handleFileUpload };
