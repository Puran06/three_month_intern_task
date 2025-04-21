// embedding.js
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import dotenv from 'dotenv';
dotenv.config();

export const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GOOGLE_API_KEY,
  model: "embedding-001",
});
