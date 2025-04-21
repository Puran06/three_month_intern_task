const weaviate = require("weaviate-ts-client").default; // 👈 Add .default
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const { WeaviateStore } = require("@langchain/weaviate");
require("dotenv").config();

// Setup embeddings
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GOOGLE_API_KEY,
  model: "embedding-001",
});

// Setup Weaviate client
const weaviateClient = weaviate.client({
  scheme: process.env.WEAVIATE_SCHEME || "http",
  host: process.env.WEAVIATE_HOST || "localhost:8080",
});

// Setup vector store
const vectorStore = new WeaviateStore(embeddings, {
  client: weaviateClient,
  indexName: "DocumentChunks",
  textKey: "text",
  metadataKeys: ["summary"],
});

// Function to add data to Weaviate
async function addToWeaviate(text, summary) {
  await vectorStore.addDocuments([
    {
      pageContent: text,
      metadata: { summary },
    },
  ]);
}

module.exports = { addToWeaviate };
