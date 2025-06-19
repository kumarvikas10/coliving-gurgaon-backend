const express = require('express');
const router = express.Router();
const CityContent = require('../models/CityContent');

// Simple login route (hardcoded for now)
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === 'admin123') {
    // Generate token (simple hardcoded token for now)
    res.json({ success: true, token: 'secret-token-123' });
  } else {
    res.json({ success: false });
  }
});

// Admin save or update city content
router.post('/cities', async (req, res) => {
  const { city, title, description, footerTitle, footerDescription } = req.body;

  try {
    let existing = await CityContent.findOne({ city });

    if (existing) {
      // Update
      existing.title = title;
      existing.description = description;
      existing.footerTitle = footerTitle;
      existing.footerDescription = footerDescription;
      await existing.save();
    } else {
      // Create new
      await CityContent.create({
        city,
        title,
        description,
        footerTitle,
        footerDescription,
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
