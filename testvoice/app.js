import express from "express";
import fs from "fs";
import multer from "multer";
import "dotenv/config";
import { ElevenLabsClient } from "elevenlabs";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { Readable } from "stream";
import cors from "cors"; // Import the cors package
// 🔑 Load API keys
const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

if (!ELEVEN_LABS_API_KEY || !GOOGLE_API_KEY) {
  console.error("❌ Missing API keys in .env");
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 3000;

app.use(cors()); // This will allow all domains to access your API
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// 📁 Setup uploads folder if not exists
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer for storing uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

// 🧠 Generate Creative Text using Gemini
async function generateCreativeText(topic) {
  const model = new ChatGoogleGenerativeAI({
    modelName: "gemini-2.0-flash",
    apiKey: GOOGLE_API_KEY,
  });

  const prompt = new PromptTemplate({
    inputVariables: ["topic"],
    template: `Write an engaging spoken script about: "{topic}". Keep it conversational, informative, and easy to follow when listened to. Limit to 300 words.`,
  });

  const chain = RunnableSequence.from([prompt, model]);
  const result = await chain.invoke({ topic });

  return result.content;
}

// 🎤 Get Voice ID from ElevenLabs API
async function getVoiceId(client, preferredName = "Rachel") {
  try {
    const voices = await client.voices.getAll();
    let voicesArray = Array.isArray(voices)
      ? voices
      : voices?.voices || voices?.data || [];

    if (voicesArray.length === 0) {
      console.warn("⚠️ No voices returned. Using fallback.");
      return "21m00Tcm4TlvDq8ikWAM";
    }

    const voice = voicesArray.find((v) =>
      v.name.toLowerCase().includes(preferredName.toLowerCase())
    );

    return voice?.voice_id || voicesArray[0].voice_id;
  } catch (error) {
    console.error("❌ Error getting voice:", error.message);
    return "21m00Tcm4TlvDq8ikWAM";
  }
}

// 🔊 Convert Text to Speech and Save MP3 using Stream API
async function convertTextToSpeech(client, voiceId, text, outputFile) {
  try {
    const audioStream = await client.textToSpeech.convertAsStream(voiceId, {
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    });

    const readable = Readable.from(audioStream);
    const writeStream = fs.createWriteStream(outputFile);

    await new Promise((resolve, reject) => {
      readable.pipe(writeStream);
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });

    console.log(`✅ Audio saved to: ${outputFile}`);
  } catch (error) {
    console.error("❌ Error in text-to-speech conversion:", error.message);
    throw error;
  }
}

// 🛣️ POST /speak — Receives Text and Saves Audio
app.post("/speak", async (req, res) => {
  try {
    const { text, topicMode = false } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const client = new ElevenLabsClient({ apiKey: ELEVEN_LABS_API_KEY });

    const voiceId = await getVoiceId(client);
    const finalText = topicMode ? await generateCreativeText(text) : text;

    const fileName = `audio_${Date.now()}.mp3`;
    const filePath = `${uploadDir}/${fileName}`;

    await convertTextToSpeech(client, voiceId, finalText, filePath);

    res.json({
      success: true,
      message: "Text successfully converted to audio",
      fileUrl: `/uploads/${fileName}`,
      text: finalText,
      length: finalText.length,
    });
  } catch (err) {
    console.error("❌ Error:", err.message);
    res.status(500).json({
      error: "Text-to-speech conversion failed",
      details: err.message,
    });
  }
});

// 🛣️ GET /voices — List available voices
app.get("/voices", async (req, res) => {
  try {
    const client = new ElevenLabsClient({ apiKey: ELEVEN_LABS_API_KEY });
    const voices = await client.voices.getAll();
    res.json({ success: true, voices });
  } catch (err) {
    console.error("❌ Error fetching voices:", err.message);
    res.status(500).json({ error: "Failed to fetch voices" });
  }
});

// Basic route
app.get("/", (req, res) => {
  res.send("🎙️ Text-to-Speech API is running. Use POST /speak to convert text.");
});

// Start the server
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
