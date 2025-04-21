const { GoogleGenerativeAI } = require("@google/generative-ai");
const Session = require("../models/Session");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Custom pricing per 1K tokens
const PRICING_PER_1K_INPUT_TOKENS = 2;
const PRICING_PER_1K_OUTPUT_TOKENS = 1;

const storeGeminiSession = async (req, res) => {
    const { prompt, sessionId, userId } = req.body;

    if (!prompt || !userId) {
        return res.status(400).json({ error: "Prompt and userId are required." });
    }

    try {
        const startTime = new Date();

        // Generate content from Gemini
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // ✅ Get usageMetadata from correct location
        const usage = response.usageMetadata || {};
        const inputTokens = usage.promptTokenCount || 0;
        const outputTokens = usage.candidatesTokenCount || 0;
        const totalTokens = inputTokens + outputTokens;

        // Calculate cost
        const cost = (
            (inputTokens / 1000) * PRICING_PER_1K_INPUT_TOKENS +
            (outputTokens / 1000) * PRICING_PER_1K_OUTPUT_TOKENS
        ).toFixed(4);

        // Save the session to MongoDB
        const session = new Session({
            model: "gemini-2.0-flash",
            timestamp: startTime.toISOString(),
            prompt,
            inputTokens,
            outputTokens,
            totalTokens,
            costUSD: `$${cost}`,
            response: text,
            sessionId: sessionId || null,
            userId
        });

        await session.save();

        res.json({ message: "Session stored successfully!", session });
    } catch (err) {
        console.error("Error storing session:", err);
        res.status(500).json({ error: "Unexpected Error!" });
    }
};

module.exports = storeGeminiSession;
