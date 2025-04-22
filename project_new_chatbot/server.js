import express from "express";
import dotenv from "dotenv";
import chatRoutes from "./routes/chatRoutes.js";
import cors from "cors"; // Import CORS

// Configuration
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use("/api", chatRoutes);


// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`🔗 Endpoint: http://localhost:${port}/api/chat`);
});