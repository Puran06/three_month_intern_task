import { CheerioWebBaseLoader } from '@langchain/community/document_loaders/web/cheerio';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { vectorStore } from './vector-store.js';
import { createRetrievalChain } from 'langchain/chains/retrieval';
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { model } from './gen-ai.js';

// Function to load content, chunk, and return results based on the question
export const LoadAndChunks = async (url, question) => {
  try {
    const pTagSelector = 'p';
    
    // Step 1: Load content from the URL using cheerio
    const cheerioLoader = new CheerioWebBaseLoader(url, { selector: pTagSelector });
    const docs = await cheerioLoader.load();
    
    if (!docs || docs.length === 0) {
      throw new Error('No content found on the provided URL.');
    }

    
    // Step 2: Split documents into chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const allSplits = await splitter.splitDocuments(docs);

    // Step 3: Add chunks to the vector store
    await vectorStore.addDocuments(allSplits);

    // Step 4: Create the retriever and setup retrieval chain
    const retriever = vectorStore.asRetriever();

    const systemTemplate = [
      `You are an assistant for question-answering tasks.`,
      `Use the following pieces of retrieved context to answer`,
      `the question. If you don't know the answer, say that you`,
      `don't know. Use three sentences maximum and keep the`,
      `answer concise.`,
      `\n\n`,
      `{context}`,
    ].join('');
    
    // Create the prompt template
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', systemTemplate],
      ['human', '{input}'],
    ]);

    // Step 5: Initialize the question-answer chain
    const questionAnswerChain = await createStuffDocumentsChain({ llm: model, prompt });

    // Step 6: Create the retrieval chain
    const ragChain = await createRetrievalChain({
      retriever,
      combineDocsChain: questionAnswerChain,
    });

    // Step 7: Get the answer to the question
    const results = await ragChain.invoke({
      input: question,
    });

    return { question:results.input,answer: results.context[0].pageContent};
  } catch (error) {
    console.error('Error in LoadAndChunks:', error);
    throw error;  // Re-throw error to be handled in the server
  }
};
