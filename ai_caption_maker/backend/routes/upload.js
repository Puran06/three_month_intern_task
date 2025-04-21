import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { generateCaptionAndStore } from "../src/captionService.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

// 👇 Only this function is new
const deleteFileAfterTimeout = (filePath, timeout = 100000) => {
  setTimeout(() => {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`❌ Failed to delete file: ${filePath}`, err);
      } else {
        console.log(`🗑️ File deleted: ${filePath}`);
      }
    });
  }, timeout);
};

router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const filePath = req.file.path;

    // ⏱️ Schedule the file to be deleted in 1 minute
    deleteFileAfterTimeout(filePath, 60000);

    // ✅ Nothing changed here
    const result = await generateCaptionAndStore(filePath);
    res.json({ message: "Image processed", ...result });

  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Failed to process image" });
  }
});

export default router;
