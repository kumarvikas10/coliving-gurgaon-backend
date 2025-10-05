const multer = require("multer");
const storage = multer.memoryStorage(); // keep file in RAM buffer
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB cap
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(png|jpe?g|webp|gif|bmp|tiff)$/i.test(file.mimetype);
    cb(ok ? null : new Error("Unsupported file type"), ok);
  },
});
module.exports = upload;