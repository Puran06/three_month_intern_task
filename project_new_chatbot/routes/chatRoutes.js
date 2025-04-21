import express from "express";
import { handleChat } from "../controllers/chatController.js";
import { upload } from "../middlewares/upload.js";  // Import multer config

const router = express.Router();

// Chat endpoint with optional PDF upload
router.post("/chat", upload.single("pdf"), handleChat);

export default router;
