import { Chroma } from "@langchain/community/vectorstores/chroma";
import {embeddings} from "./embedding-model.js";

export const vectorStore = new Chroma(embeddings, {
  collectionName: "a-test-collection",
  url: "http://localhost:8000",
  
});