const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables from .env

const connectDB = async () => {
    try {
        // No need for useNewUrlParser and useUnifiedTopology anymore
        await mongoose.connect(process.env.MONGODB_URI);  // MongoDB driver automatically handles this now
        console.log("✅ MongoDB connected");
    } catch (err) {
        console.error("❌ MongoDB connection failed:", err.message);
        process.exit(1); // Exit the process if the connection fails
    }
};

module.exports = connectDB;
