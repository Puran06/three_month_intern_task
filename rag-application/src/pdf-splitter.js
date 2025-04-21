import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import dotenv from "dotenv";
import fs from "fs";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

dotenv.config();

// === Initialize LLM ===
const llm = new ChatGoogleGenerativeAI({
  model: "models/gemini-2.0-flash",
  temperature: 0,
  apiKey: process.env.GOOGLE_API_KEY,
});

// === Initialize Embeddings ===
const embeddings = new GoogleGenerativeAIEmbeddings({
  model:
    process.env.GoogleGenerativeAIEmbeddings_EMBEDDING_MODEL ||
    "models/text-embedding-004",
  apiKey: process.env.GOOGLE_API_KEY,
});

// === Initialize vectorStore as undefined initially ===
let vectorStore;

// === Function to load and index PDF ===
export const loadAndIndexPDF = async (pdfPath) => {
  if (!pdfPath || !fs.existsSync(pdfPath)) {
    throw new Error("PDF file not found at provided path.");
  }

  const loader = new PDFLoader(pdfPath);
  const docs = await loader.load();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const splits = await splitter.splitDocuments(docs);

  // ✅ Filter out empty or invalid chunks
  const validSplits = splits.filter(
    (doc) => doc.pageContent && doc.pageContent.trim().length > 10
  );

  if (validSplits.length === 0) {
    throw new Error("No valid content found in the PDF.");
  }

  console.log(`📄 Total valid chunks to index: ${validSplits.length}`);

  try {
    // Create vector store from documents
    vectorStore = await Chroma.fromDocuments(validSplits, embeddings, {
      collectionName: "a-test-collection",
      url: "http://localhost:8000",
      numDimensions: 768,
    });

    return { message: "PDF loaded and indexed successfully." };
  } catch (err) {
    console.error("🔥 Chroma addDocuments error:", err.message);
    throw new Error("Failed to add documents to Chroma vector store.");
  }
};

// === Function to ask a question ===
export const askQuestion = async (question) => {
  if (!question) {
    throw new Error("Question is required.");
  }

  if (!vectorStore) {
    throw new Error("No vector store found. Please upload and index a PDF first.");
  }

  try {
    const retrievedDocs = await vectorStore.similaritySearch(question, 4);
    const context = retrievedDocs
      .map((doc) => doc.pageContent)
      .filter(Boolean)
      .join("\n\n");

    const prompt = `Use the following context to answer the question:\n\n${context}\n\nQuestion: ${question}\nAnswer:`;

    const response = await llm.invoke(prompt);
    return { answer: response.content };
  } catch (err) {
    console.error("🧠 LLM error:", err.message);
    throw new Error("Failed to retrieve answer from the model.");
  }
};
