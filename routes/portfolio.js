const express = require('express');
const router = express.Router();
const Media = require('../models/MediaFile');

// Get only image files for portfolio
router.get('/', async (req, res) => {
  try {
    const images = await Media.find({ resource_type: 'image' }).sort({ createdAt: -1 });
    res.json({ success: true, images });
  } catch (err) {
    console.error('Portfolio fetch error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
