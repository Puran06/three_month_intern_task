const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./db");
const geminiRoutes = require("./routes/gemini");

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const port = 3000;

// Middleware to parse JSON body
app.use(express.json());

// Routes
app.use("/gemini", geminiRoutes);

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
