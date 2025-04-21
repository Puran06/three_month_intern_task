import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import generateEmailRoute from './routes/generateEmail.js';
import sendEmailRoute from './routes/sendEmail.js'; // Import sendEmail route
import cors from 'cors'; // ✅ Import cors

dotenv.config(); // Load environment variables

const app = express();

// Middleware to parse JSON request body
app.use(bodyParser.json());
app.use(cors()); // <-- This allows requests from any origin

// Use the generate email route
app.use('/api/generate', generateEmailRoute);

// Use the send email route (Add this new route)
app.use('/api/send', sendEmailRoute);

// Start server
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
