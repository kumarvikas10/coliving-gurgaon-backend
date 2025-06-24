// routes/media.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
require('dotenv').config();
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer config
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;

    const result = await cloudinary.uploader.upload_stream(
      { resource_type: 'auto' },
      (error, result) => {
        if (error) return res.status(500).json({ success: false, error });

        res.json({
          success: true,
          url: result.secure_url,
          public_id: result.public_id,
          resource_type: result.resource_type,
        });
      }
    );

    // Pipe the file buffer to Cloudinary
    result.end(file.buffer);

  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Delete file
router.delete('/delete/:public_id', async (req, res) => {
  const { public_id } = req.params;
  try {
    await cloudinary.uploader.destroy(public_id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete Error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
