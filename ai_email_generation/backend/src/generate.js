// src/generate.js
import dotenv from 'dotenv';
import { llm } from './generative_ai.js';  // Your AI model setup
import { ChatPromptTemplate } from '@langchain/core/prompts';

dotenv.config(); // Load environment variables

// LangChain prompt setup
const promptTemplate = ChatPromptTemplate.fromMessages([
  ["system", "You are a professional email writing assistant. Use the user's bullet points and selected tone to craft a polished, clear email."],
  ["user", "Tone: {tone}\n\nBullet Points:\n{bullets}"]
]);

const generateEmail = async (bullets, tone, to) => {
  // Format the prompt with input data
  const formattedPrompt = await promptTemplate.formatMessages({ tone, bullets });

  // Generate the email content using AI
  const response = await llm.call(formattedPrompt);
  const emailContent = response.content;

  // Return just the generated content
  return emailContent;
};

export default generateEmail;
