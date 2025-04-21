import { ChatGoogleGenerativeAI } from "@langchain/google-genai";


export const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash", // 768 dimensions
    apiKey: process.env.GOOGLE_API_KEY,
  });
  