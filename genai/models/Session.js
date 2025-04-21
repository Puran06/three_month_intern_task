const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    model: { type: String, required: true },
    timestamp: { type: String, required: true },
    prompt: { type: String, required: true },
    inputTokens: { type: Number, required: true },
    outputTokens: { type: Number, required: true },
    totalTokens: { type: Number, required: true },
    costUSD: { type: String, required: true },
    response: { type: String, required: true },
    sessionId: { type: String, required: false }, // SessionId is optional
    userId: { type: String, required: false }  // Make userId optional
});

module.exports = mongoose.model('Session', sessionSchema);
