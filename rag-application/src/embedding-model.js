import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import "dotenv/config";

export const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "embedding-001", // 768 dimensions
  apiKey: process.env.GOOGLE_API_KEY,
});
