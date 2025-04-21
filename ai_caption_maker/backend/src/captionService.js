import fs from "fs";
import client from "./weaviateClient.js";
import { model } from "./llm.js";

// Create schema if it doesn't exist
async function ensureSchemaExists() {
  const schema = await client.schema.getter().do();
  const exists = schema.classes.some((c) => c.class === "Images");

  if (!exists) {
    await client.schema
      .classCreator()
      .withClass({
        class: "Images",
        vectorizer: "none",
        properties: [
          { name: "caption", dataType: ["text"] },
          { name: "description", dataType: ["text"] },
          { name: "image_path", dataType: ["text"] },
        ],
      })
      .do();
  }
}

export async function generateCaptionAndStore(imagePath) {
  await ensureSchemaExists();

  const imageBytes = fs.readFileSync(imagePath);
  const base64Image = imageBytes.toString("base64");

  const prompt = "Describe the image in detail. Include a short caption and a detailed description.";

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Image,
      },
    },
  ]);

  const text = result.response.text();
  const captionMatch = text.match(/Caption:\s*(.+)/i);
  const descriptionMatch = text.match(/Description:\s*([\s\S]+)/i);

  const caption = captionMatch ? captionMatch[1].trim() : "N/A";
  const description = descriptionMatch ? descriptionMatch[1].trim() : "N/A";

  await client.data
    .creator()
    .withClassName("Images")
    .withProperties({
      caption,
      description,
      image_path: imagePath,
    })
    .do();

  return { caption, description };
}
