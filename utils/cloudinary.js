// utils/cloudinary.js
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
module.exports = cloudinary;

// middleware/upload.js
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
