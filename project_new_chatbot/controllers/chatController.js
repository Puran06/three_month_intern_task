import { processAndAnswerQuery } from '../src/splitter.js';
import { processPdfQuery } from '../src/splitter_pdf.js';
import { translateSentence } from '../utils/translate.js';
import { handleGeneralQuery } from '../utils/generalQuery.js';
import fs from 'fs/promises';  // for deleting file

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
      const result = await processPdfQuery(pdfFile.path, sentence);

      // Delete the uploaded PDF after it's processed
      try {
        await fs.unlink(pdfFile.path);
        console.log(`Deleted uploaded file: ${pdfFile.path}`);
      } catch (deleteError) {
        console.warn(`Failed to delete uploaded file: ${deleteError.message}`);
      }

      return res.json({ from: pdfFile.originalname, answer: result.answer });
    }

    // 4. Handle general question
    if (sentence) {
      const response = await handleGeneralQuery(sentence);
      return res.json({ response });
    }

  } catch (error) {
    console.error("Chat handling error:", error);
    return res.status(500).json({ error: 'Failed to process the request.' });
  }
};
