import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import 'dotenv/config';

export const llm = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
  model: "gemini-2.0-flash",
  temperature: 0.7,
  maxOutputTokens: 500
});