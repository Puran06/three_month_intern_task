import multer from "multer";

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public"); // Save files to /public
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Keep original file name
  },
});

// Export the configured multer middleware
export const upload = multer({ storage });
