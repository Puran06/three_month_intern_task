import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { vectorStore } from "./weaviate.js";
import { llm } from "./generative_ai.js";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";

// ✅ Enhanced metadata sanitization for Weaviate compatibility
function sanitizeMetadata(metadata) {
  const sanitized = {};
  const ALLOWED_TYPES = ['string', 'number', 'boolean']; // Weaviate-compatible types
  
  for (const key in metadata) {
    try {
      // Skip if value type isn't compatible with Weaviate
      if (!ALLOWED_TYPES.includes(typeof metadata[key])) {
        continue;
      }

      // Remove namespace prefixes and special characters
      let cleanKey = key
        .replace(/^(pdf_metadata__metadata_|metadata_)/i, '') // Remove common prefixes
        .replace(/[^_0-9a-zA-Z]/g, '_') // Replace special chars with underscore
        .replace(/^[^a-zA-Z_]+/, '') // Remove leading numbers/invalid chars
        .replace(/_+/g, '_') // Collapse multiple underscores
        .substring(0, 230); // Limit length

      // Ensure key isn't empty after sanitization
      if (!cleanKey) {
        cleanKey = `field_${Math.random().toString(36).substring(2, 8)}`;
      }

      // Skip if value is empty or undefined
      if (metadata[key] !== undefined && metadata[key] !== null && metadata[key] !== '') {
        sanitized[cleanKey] = metadata[key];
      }
    } catch (err) {
      console.warn(`⚠️ Failed to sanitize metadata field "${key}":`, err);
    }
  }

  return sanitized;
}

// === Load and index the PDF ===
export const loadAndIndexPDF = async (pdfPath, options = {}) => {
  // Validate input
  if (!pdfPath || !fs.existsSync(pdfPath)) {
    throw new Error("PDF file not found at provided path.");
  }

  // Set default options
  const {
    chunkSize = 1000,
    chunkOverlap = 200,
    keepSource = false,
    verbose = true
  } = options;

  try {
    // Load PDF
    if (verbose) console.log(`📄 Loading PDF from: ${pdfPath}`);
    const loader = new PDFLoader(pdfPath, {
      splitPages: true,
      parsedItemSeparator: " " // Helps with text splitting
    });
    
    const docs = await loader.load();
    if (docs.length === 0) {
      throw new Error("No documents found in the PDF.");
    }
    if (verbose) console.log(`🔍 Found ${docs.length} raw document sections`);

    // Split documents
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
      separators: ["\n\n", "\n", " ", ""] // Better splitting for PDFs
    });

    const splits = await splitter.splitDocuments(docs);
    const validSplits = splits.filter(
      (doc) => doc.pageContent && doc.pageContent.trim().length > 10
    );

    if (validSplits.length === 0) {
      throw new Error("No valid content found in the PDF.");
    }
    if (verbose) console.log(`✂️ Split into ${validSplits.length} valid chunks`);

    // Generate document ID and prepare chunks
    const documentId = uuidv4();
    const filename = path.basename(pdfPath);
    const timestamp = new Date().toISOString();

    const taggedChunks = validSplits.map((chunk, index) => {
      const cleanMetadata = sanitizeMetadata(chunk.metadata || {});
      
      return {
        ...chunk,
        metadata: {
          ...cleanMetadata,
          documentId,
          chunkIndex: index,
          filename,
          timestamp,
          pageNumber: cleanMetadata.pageNumber || chunk.metadata?.loc?.pageNumber,
          totalChunks: validSplits.length
        }
      };
    });

    // Add to vector store in batches
    const batchSize = 50; // Adjust based on your Weaviate performance
    for (let i = 0; i < taggedChunks.length; i += batchSize) {
      const batch = taggedChunks.slice(i, i + batchSize);
      await vectorStore.addDocuments(batch);
      if (verbose) console.log(`↑ Batch ${i / batchSize + 1} of ${Math.ceil(taggedChunks.length / batchSize)} indexed`);
    }

    // Cleanup if requested
    if (!keepSource) {
      fs.unlinkSync(pdfPath);
      if (verbose) console.log(`♻️ Deleted source PDF: ${filename}`);
    }

    return {
      success: true,
      message: "PDF loaded and indexed successfully.",
      documentId,
      chunksIndexed: taggedChunks.length,
      filename
    };
  } catch (err) {
    console.error("🔥 Indexing error:", err.message);
    throw new Error(`Failed to index PDF: ${err.message}`);
  }
};

// === Ask question using indexed PDF ===
export const askQuestion = async (question, documentId, options = {}) => {
  const {
    k = 4, // Number of chunks to retrieve
    scoreThreshold = 0.7, // Minimum similarity score
    verbose = true
  } = options;

  if (!question?.trim()) {
    throw new Error("Question is required.");
  }

  if (!documentId) {
    throw new Error("Document ID is required to scope the query.");
  }

  try {
    // Retrieve relevant documents
    if (verbose) console.log(`🔍 Searching for relevant chunks for document: ${documentId}`);
    
    const retrievedDocs = await vectorStore.similaritySearch(question, k, {
      where: {
        operator: "And",
        operands: [
          {
            path: ["documentId"],
            operator: "Equal",
            valueString: documentId
          }
        ]
      },
      score: scoreThreshold // Minimum similarity score
    });

    if (!retrievedDocs.length) {
      throw new Error("No relevant documents found for this query.");
    }
    if (verbose) console.log(`📑 Retrieved ${retrievedDocs.length} relevant chunks`);

    // Prepare context
    const context = retrievedDocs
      .map((doc, i) => `[CHUNK ${i + 1}, PAGE ${doc.metadata?.pageNumber || '?'}]:\n${doc.pageContent}`)
      .join("\n\n---\n\n");

    // Create prompt
    const promptTemplate = ChatPromptTemplate.fromMessages([
      ["system", `You are an expert document analyst. Use the following context from a PDF to answer the question.
      If you don't know the answer, say "I couldn't find that information in the document."
      
      Context:
      {context}`],
      ["human", "Question: {question}\nAnswer:"]
    ]);

    const chain = promptTemplate.pipe(llm);
    const llmResponse = await chain.invoke({
      context,
      question: question.trim()
    });

    if (verbose) console.log("💡 Generated answer:", llmResponse.content);

    return {
      answer: llmResponse.content,
      sources: retrievedDocs.map(doc => ({
        page: doc.metadata?.pageNumber,
        text: doc.pageContent.substring(0, 150) + '...',
        score: doc.metadata?.score
      })),
      documentId
    };
  } catch (err) {
    console.error("🧠 Query error:", err.message);
    throw new Error(`Failed to process question: ${err.message}`);
  }
};