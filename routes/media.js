const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const MediaFile = require('../models/MediaFile');

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer setup
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload file (image or video)
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;

    const isVideo = file.mimetype.startsWith('video/');
    const uploadOptions = {
      folder: 'sandy_photography_media',
      resource_type: isVideo ? 'video' : 'image',
    };

    if (isVideo) {
      uploadOptions.format = 'mp4';
    } else {
      uploadOptions.format = 'webp';
      uploadOptions.quality = 'auto:eco';
      uploadOptions.transformation = [
        { fetch_format: 'auto', quality: 'auto' },
      ];
    }

    cloudinary.uploader.upload_stream(
      uploadOptions,
      async (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return res.status(500).json({ success: false, error: 'Upload failed' });
        }

        // Generate alt tag from original uploaded file name (not from Cloudinary result)
        const alt = req.file.originalname
          .toLowerCase()
          .replace(/\.[^/.]+$/, "")
          .replace(/[^a-z0-9]/g, "-");

        // Save in MongoDB
        const newMedia = new MediaFile({
          url: result.secure_url,
          public_id: result.public_id,
          resource_type: result.resource_type,
          original_filename: result.original_filename,
          alt,
          width: result.width,   // ✅ add this
          height: result.height, // ✅ add this
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


// GET all media files
router.get('/', async (req, res) => {
  try {
    const files = await MediaFile.find().sort({ createdAt: -1 });
    res.json({ success: true, files });
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// DELETE media by public_id
router.delete('/delete/:public_id', async (req, res) => {
  const public_id = decodeURIComponent(req.params.public_id);

  try {
    const file = await MediaFile.findOne({ public_id });
    if (!file) return res.status(404).json({ success: false, error: 'Not found' });

    await cloudinary.uploader.destroy(public_id, {
      resource_type: file.resource_type,
    });

    await MediaFile.deleteOne({ public_id });

    res.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PATCH: Update alt tag
router.patch('/update/:public_id', async (req, res) => {
  const { public_id } = req.params;
  const { alt } = req.body;

  try {
    const updated = await MediaFile.findOneAndUpdate(
      { public_id },
      { alt },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    res.json({ success: true, file: updated });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});


module.exports = router;