const { GoogleGenerativeAI } = require("@google/generative-ai");
const Session = require("../models/Session");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Custom pricing per 1K tokens
const PRICING_PER_1K_INPUT_TOKENS = 2;
const PRICING_PER_1K_OUTPUT_TOKENS = 1;

// Rough estimate for token count (1 token ≈ 4 characters)
const estimateTokenCount = (text = "") => Math.ceil(text.length / 4);

// Limit constants
const MAX_INPUT_TOKENS = 200;
const MAX_OUTPUT_TOKENS = 500;

const storeGeminiSession = async (req, res) => {
    const { prompt, sessionId, userId } = req.body;

    if (!prompt || !userId) {
        return res.status(400).json({ error: "Prompt and userId are required." });
    }

    const estimatedInputTokens = estimateTokenCount(prompt);
    if (estimatedInputTokens > MAX_INPUT_TOKENS) {
        return res.status(400).json({ error: `Prompt exceeds the input token limit of ${MAX_INPUT_TOKENS}.` });
    }

    try {
        const startTime = new Date();

        // Generate content from Gemini
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // ✅ Get usageMetadata from correct location
        const usage = response.usageMetadata || {};
        const inputTokens = usage.promptTokenCount || estimatedInputTokens;
        const outputTokens = usage.candidatesTokenCount || estimateTokenCount(text);
        const totalTokens = inputTokens + outputTokens;

        // ✅ Enforce output token limit
        if (outputTokens > MAX_OUTPUT_TOKENS) {
            return res.status(400).json({ error: `Generated response exceeds the output token limit of ${MAX_OUTPUT_TOKENS}.` });
        }

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
