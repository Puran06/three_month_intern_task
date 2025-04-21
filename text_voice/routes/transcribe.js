import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import AssemblyAIDocumentLoader from '../AssemblyAIDocumentLoader.js';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { Document } from 'langchain/document';
import { loadSummarizationChain } from 'langchain/chains';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    const filePath = path.resolve(req.file.path);
    const loader = new AssemblyAIDocumentLoader();

    // Step 1: Transcribe the audio
    const transcript = await loader.transcribe(filePath);

    // Step 2: Summarize using Google Generative AI (Gemini)
    const llm = new ChatGoogleGenerativeAI({
      model: 'gemini-2.0-flash',
      apiKey: process.env.GOOGLE_API_KEY,
    });

    const chain = loadSummarizationChain(llm, { type: 'map_reduce' });
    const docs = [new Document({ pageContent: transcript })];
    const summaryResult = await chain.call({ input_documents: docs });

    // Clean up the file
    fs.unlinkSync(filePath);

    res.json({
      transcript,
      summary: summaryResult.text,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

export default router;
