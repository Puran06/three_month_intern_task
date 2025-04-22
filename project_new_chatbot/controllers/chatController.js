import { loadAndIndexPDF, askQuestion } from '../src/splitter_pdf.js'; // ⬅️ Updated import
import { processAndAnswerQuery } from '../src/splitter.js';
import { translateSentence } from '../utils/translate.js';
import { handleGeneralQuery } from '../utils/generalQuery.js';
import fs from 'fs/promises';

export const handleChat = async (req, res) => {
  const { sentence, url } = req.body;
  const pdfFile = req.file;

  if (!sentence && !url && !pdfFile) {
    return res.status(400).json({ error: 'You must provide a sentence, URL, or PDF file.' });
  }

  try {
    // 1. Handle translation
    if (sentence?.toLowerCase().startsWith("translate")) {
      const translation = await translateSentence(sentence);
      return res.json({ translation });
    }

    // 2. Handle URL + question
    if (sentence && url) {
      const result = await processAndAnswerQuery(url, sentence);
      return res.json({ from: url, answer: result.answer });
    }

    // 3. Handle PDF + question
    if (sentence && pdfFile) {
      // Step 1: Index the uploaded PDF
      const { documentId } = await loadAndIndexPDF(pdfFile.path);

      // Step 2: Ask the question with the generated documentId
      const result = await askQuestion(sentence, documentId);

      // Step 3: Schedule deletion of the file after 5 minutes
      setTimeout(async () => {
        try {
          await fs.unlink(pdfFile.path);
          console.log(`🧹 Deleted uploaded file after delay: ${pdfFile.path}`);
        } catch (deleteError) {
          console.warn(`⚠️ Failed to delete uploaded file: ${deleteError.message}`);
        }
      }, 5 * 60 * 1000);

      return res.json({ from: pdfFile.originalname, answer: result.answer });
    }

    // 4. Handle general question (no PDF or URL)
    if (sentence) {
      const response = await handleGeneralQuery(sentence);
      return res.json({ response });
    }

  } catch (error) {
    console.error("💥 Chat handling error:", error.message);
    return res.status(500).json({ error: 'Failed to process the request.' });
  }
};
