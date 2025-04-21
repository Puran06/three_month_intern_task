const multer = require('multer');
const path = require('path');

const receive = multer({
  dest: 'receivers/', // Folder where files will be temporarily stored
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.pdf', '.png', '.jpg', '.jpeg', '.bmp'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  }
});

module.exports = receive;
