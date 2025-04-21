// routes/sendEmail.js
import express from "express";
import nodemailer from "nodemailer";
import validator from 'validator';

const router = express.Router();

// POST /api/send
router.post("/", async (req, res) => {
  const { emailContent, to } = req.body;

  // Basic validation
  if (!emailContent || !to) {
    return res.status(400).json({ error: "'emailContent' and 'to' are required." });
  }

  // Optional: Validate email format
  if (!validator.isEmail(to)) {
    return res.status(400).json({ error: "Invalid email format." });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Use your email service provider
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,  // Your email address
      to, // Recipient's email
      subject: 'Generated Email',  // Customize this subject
      text: emailContent, // Body of the email
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully!' });
  } catch (err) {
    console.error("❌ Error sending email:", err.message);
    res.status(500).json({ error: `Email sending failed: ${err.message}` });
  }
});

export default router;
