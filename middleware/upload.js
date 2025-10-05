const multer = require("multer");
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(png|jpe?g|webp|gif|bmp|tiff)$/i.test(file.mimetype);
    if (ok) return cb(null, true);
    cb(new Error("Unsupported file type"), false);
  },
});

module.exports = upload;