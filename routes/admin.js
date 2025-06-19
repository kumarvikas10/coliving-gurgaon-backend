const express = require('express');
const router = express.Router();
const CityContent = require('../models/CityContent');

// Simple login route (hardcoded for now)
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === 'admin123') {
    // Simple token for now
    res.json({ success: true, token: 'secret-token-123' });
  } else {
    res.json({ success: false });
  }
});

// Add or update city content
router.post('/cities', async (req, res) => {
  const { city, title, description, footerTitle, footerDescription } = req.body;

  if (!city) {
    return res.status(400).json({ success: false, error: 'City is required' });
  }

  try {
    let existing = await CityContent.findOne({ city });

    if (existing) {
      // Update
      existing.title = title || '';
      existing.description = description || '';
      existing.footerTitle = footerTitle || '';
      existing.footerDescription = footerDescription || '';
      await existing.save();
    } else {
      // Create new
      await CityContent.create({
        city,
        title: title || '',
        description: description || '',
        footerTitle: footerTitle || '',
        footerDescription: footerDescription || '',
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Delete city
router.delete('/cities/:city', async (req, res) => {
  const { city } = req.params;

  try {
    const result = await CityContent.deleteOne({ city });

    if (result.deletedCount === 1) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, error: 'City not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;