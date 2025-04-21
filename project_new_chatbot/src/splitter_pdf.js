import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { vectorStore } from "./weaviate.js";
import { llm } from "./generative_ai.js";
import { ChatPromptTemplate } from "@langchain/core/prompts";

export const processPdfQuery = async (pdfFilePath, question) => {
    try {
        // Step 1: Load PDF content from file path
        const loader = new PDFLoader(pdfFilePath);
        const docs = await loader.load();

        // Step 2: Split the documents into chunks
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });

        const chunks = await splitter.splitDocuments(docs);
        console.log(chunks.length);

        // Step 3: Store the chunks in the vector store (e.g., Weaviate)
        const add = await vectorStore.addDocuments(chunks);

        // Step 4: Perform a similarity search
        const relevantDocs = await vectorStore.similaritySearch(question);

        // Step 5: Combine the content of the retrieved documents
        const context = relevantDocs.map(doc => doc.pageContent).join("\n");

        const systemTemplate = "Give the best answer based on provided context {context}";

        const promptTemplate = ChatPromptTemplate.fromMessages([
            ["system", systemTemplate],
            ["user", "{question}"],
        ]);

        const chain = promptTemplate.pipe(llm);

        // Step 6: Generate the answer
        const llmResponse = await chain.invoke({
            context,
            question
        });

        console.log(llmResponse); 

        // Step 7: Return the answer
        return { answer: llmResponse.content };
    } catch (error) {
        console.error("Error in processing and answering:", error);
        throw new Error("Failed to process the PDF and generate an answer.");
    }
};
