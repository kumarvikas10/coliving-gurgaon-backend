const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const MediaFile = require('../models/MediaFile');
require('dotenv').config();

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer config (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload file → Cloudinary + MongoDB
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;

    cloudinary.uploader.upload_stream(
      { resource_type: 'auto' },
      async (error, result) => {
        if (error) {
          console.error('Upload error:', error);
          return res.status(500).json({ success: false, error: 'Upload failed' });
        }

        // Save to MongoDB
        const newMedia = new MediaFile({
          url: result.secure_url,
          public_id: result.public_id,
          resource_type: result.resource_type,
          original_filename: result.original_filename,
        });

        await newMedia.save();

        res.json({ success: true, file: newMedia });
      }
    ).end(file.buffer);

  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// List all media files
router.get('/', async (req, res) => {
  try {
    const files = await MediaFile.find().sort({ createdAt: -1 });
    res.json({ success: true, files });
  } catch (err) {
    console.error('List error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Delete file (Cloudinary + MongoDB)
router.delete('/delete/:public_id', async (req, res) => {
  const { public_id } = req.params;

  try {
    // Delete from Cloudinary
    await cloudinary.uploader.destroy(public_id, { resource_type: 'image' }); // adjust if video

    // Delete from MongoDB
    await MediaFile.deleteOne({ public_id });

    res.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;