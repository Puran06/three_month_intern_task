import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { vectorStore } from "./weaviate.js";  // Assuming you're using Weaviate for the vector store
import { llm } from "./generative_ai.js";  // The LLM model for generating answers (e.g., Google Gemini)
// import { abc } from "./weaviate.js";
// Function to load, split, store chunks, and query for a given question
// const vectorStore = await abc();

import { ChatPromptTemplate } from "@langchain/core/prompts";
export const processAndAnswerQuery = async (url, question) => {
    try {
        // Step 1: Load content from URL using Cheerio



        const loader = new CheerioWebBaseLoader(url, {
            selector: "p, li, h1, h2, h3, h4", // Scrape paragraphs, list items, and headers
        });

        const docs = await loader.load();

        // Step 2: Split the documents into chunks
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });

        const chunks = await splitter.splitDocuments(docs);
        console.log(chunks.length);

        // Initialize the Weaviate vector store
        // Step 3: Store the chunks in the vector store (e.g., Weaviate)
        const add = await vectorStore.addDocuments(chunks);
        // console.log("succesful", add);

        // Step 4: Perform a similarity search in the vector store to find relevant chunks
        const relevantDocs = await vectorStore.similaritySearch(question);
        // console.log("relevant docs", relevantDocs.length);
        // Step 5: Combine the content of the retrieved documents
        const context = relevantDocs.map(doc => doc.pageContent).join("\n");

        const systemTemplate = "Give the best answer based on provided context {context}";

        const promptTemplate = ChatPromptTemplate.fromMessages([
            ["system", systemTemplate],
            ["user", "{question}"],
          ]);

          const chain = promptTemplate.pipe(llm)
          // Step 6: Use the LLM to generate the answer
        const llmResponse = await chain.invoke({
            context,
            question
        });
        console.log(llmResponse); 

        // Step 7: Return the answer from the LLM
        return { answer: llmResponse.content };
    } catch (error) {
        console.error("Error in processing and answering:", error);
        throw new Error("Failed to process the URL and generate an answer.");
    }
};
