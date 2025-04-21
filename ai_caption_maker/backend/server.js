import express from "express";
import uploadRouter from "./routes/upload.js";
import "dotenv/config";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use("/api", uploadRouter);

// Function to delete a file after 5 minutes
const deleteFileAfterTimeout = (filePath, timeout = 60000) => {
  setTimeout(() => {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`Failed to delete file: ${filePath}`, err);
      } else {
        console.log(`File deleted: ${filePath}`);
      }
    });
  }, timeout);
};

// Example upload route that you can modify in your `uploadRouter`
app.post("/upload", (req, res) => {
  // Your file upload logic here
  
  // Assuming `filePath` is the path to the uploaded file
  const filePath = path.join(__dirname, "uploads", "yourUploadedFile.jpg");
  
  // Call the function to delete the file after 5 minutes
  deleteFileAfterTimeout(filePath);

  res.send("File uploaded successfully!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
