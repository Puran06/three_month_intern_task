// src/utils/translate.js
import { llm } from '../src/generative_ai.js'; // Import the LLM from generative_ai.js

// Define the translation function using the model
export const translateSentence = async (sentence) => {
  // Construct the prompt for translation
  const prompt = `Translate the following sentence from English to hindi: "${sentence}"`;

  try {
    // Use the LLM to generate the translation
    const result = await llm.call([{ role: 'user', content: prompt }]);
    
    // Debugging: Log the result to inspect the structure
    console.log("LLM response:", result);

    // Check if the result has the expected structure
    if (result && result.content) {
      const translation = result.content.trim();
      
      if (!translation) {
        throw new Error('No translation returned.');
      }

      return translation;
    } else {
      throw new Error('Unexpected response structure from LLM.');
    }
  } catch (error) {
    console.error('Translation error:', error);
    throw new Error('Failed to translate the sentence.');
  }
};
