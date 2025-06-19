const express = require('express');
const router = express.Router();
const CityContent = require('../models/CityContent');

// Simple login route
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === 'admin123') {
    res.json({ success: true, token: 'secret-token-123' });
  } else {
    res.json({ success: false });
  }
});

// Admin save or update city content
router.post('/cities', async (req, res) => {
  const { city, title, description, footerTitle, footerDescription } = req.body;

  if (!city) {
    return res.status(400).json({ success: false, error: 'City is required' });
  }

  try {
    await CityContent.updateOne(
      { city },
      {
        $set: {
          title,
          description,
          footerTitle,
          footerDescription,
        },
      },
      { upsert: true } // create if not exists
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Error saving city:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
