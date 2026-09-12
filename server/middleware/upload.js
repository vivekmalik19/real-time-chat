const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitizedOriginal = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, uniqueSuffix + '-' + sanitizedOriginal);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow common images, audio, documents, archives, code
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
  fileFilter
});

module.exports = upload;
