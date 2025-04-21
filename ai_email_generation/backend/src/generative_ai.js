// src/generative_ai.js
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"; 
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

// Initialize LangChain AI model
export const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash", // Example model name
  temperature: 0.7,
  maxRetries: 2,
  apiKey: process.env.GOOGLE_API_KEY, // API key from .env file
});
