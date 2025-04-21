import { WeaviateStore } from "@langchain/weaviate";
import { embeddings} from "./embedding .js";
import weaviate from "weaviate-ts-client";
import dotenv from "dotenv";
dotenv.config();

// Initialize the Weaviate client with your host and scheme
const client = weaviate.client({
  scheme:process.env.WEAVIATE_SCHEME , // or "https" if applicable
  host: process.env.WEAVIATE_HOST, // Make sure WEAVIATE_HOST is set in your .env file
});

// Creating or loading an existing Weaviate index for storing embeddings
export const vectorStore = new WeaviateStore(embeddings, {
  client: client,
  // Must start with a capital letter
  indexName: "Langchainjs_test",
  // Default value
  textKey: "text",
  // Any keys you intend to set as metadata
  metadataKeys: ["source"],
});
