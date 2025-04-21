// routes/generateEmail.js
import express from "express";
import generateEmail from "../src/generate.js"; // Importing the email generation function
import validator from 'validator';  // Optional: Email validation

const router = express.Router();

// POST /api/generate
router.post("/", async (req, res) => {
  const { bullets, tone, to } = req.body;

  // Basic validation
  if (!bullets || !tone || !to) {
    return res.status(400).json({ error: "Both 'bullets', 'tone', and 'to' are required." });
  }

  // Optional: Validate email format
  if (!validator.isEmail(to)) {
    return res.status(400).json({ error: "Invalid email format." });
  }

  try {
    const emailContent = await generateEmail(bullets, tone, to); // Call the function to generate the email content
    res.status(200).json({ message: 'Email generated successfully!', email: emailContent });
  } catch (err) {
    console.error("❌ Error generating email:", err.message);
    res.status(500).json({ error: `Email generation failed: ${err.message}` });
  }
});

export default router;
