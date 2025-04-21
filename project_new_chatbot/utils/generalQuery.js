import { llm } from '../src/generative_ai.js'; // Import the LLM from generative_ai.js

// Define the function to handle general queries
export const handleGeneralQuery = async (query) => {
  try {
    // Construct the prompt for general queries
    const prompt = `Answer the following question: "${query}"`;

    // Use the LLM to get a response for the general query
    const result = await llm.call([{ role: 'user', content: prompt }]);

    // Log the result to inspect the structure
    console.log("General query response:", result);

    // Check if the result has the expected structure
    if (result && result.content) {
      const response = result.content.trim();
      
      if (!response) {
        throw new Error('No response returned for the query.');
      }

      return response;
    } else {
      throw new Error('Unexpected response structure from LLM.');
    }
  } catch (error) {
    console.error('General query error:', error);
    throw new Error('Failed to process the general query.');
  }
};
