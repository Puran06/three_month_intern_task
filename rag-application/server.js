import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

import { upload } from "./src/multer.js";
import { loadAndIndexPDF, askQuestion } from "./src/pdf-splitter.js";
import { LoadAndChunks } from "./src/splitter.js"; // Update with actual file path

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use("/public", express.static("public")); // Serve uploaded files if needed



// === URL-based Q&A Route ===
app.post("/url-and-ask", async (req, res) => {
  try {
    const { url, question } = req.body;

    if (!url || !question) {
      return res.status(400).json({ error: "Both 'url' and 'question' are required." });
    }

    const result = await LoadAndChunks(url, question);

    res.status(200).json({
      message: "URL loaded, content embedded, and question answered successfully.",
      question: result.question,
      answer: result.answer,
    });
  } catch (err) {
    console.error("URL-and-Ask Error:", err);
    res.status(500).json({ error: "Failed to process URL and answer the question." });
  }
});


app.post("/upload-and-ask", upload.single("file"), async (req, res) => {
  try {
    const filePath = path.join("public", req.file.filename);
    const question = req.body.question;

    if (!question) {
      return res.status(400).json({ error: "Question is required." });
    }

    // Load and index the PDF
    const indexResult = await loadAndIndexPDF(filePath);

    // Ask question
    const answerResult = await askQuestion(question);

    res.status(200).json({
      message: "PDF uploaded, indexed, and question answered successfully.",
      file: req.file.filename,
      answer: answerResult.answer,
    });
  } catch (err) {
    console.error("Upload-and-Ask Error:", err);
    res.status(500).json({ error: "Failed to process file and question." });
  }
});


app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
