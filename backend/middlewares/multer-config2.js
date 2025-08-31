// middlewares/multer-config2.js
const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ok = ['image/jpeg','image/png','image/webp','image/avif'].includes(file.mimetype);
  cb(ok ? null : new Error('Type d’image non autorisé'), ok);
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 3 * 1024 * 1024 } // 3 Mo max
}).single('image');
