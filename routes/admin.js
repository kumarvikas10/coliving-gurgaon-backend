const express = require('express');
const router = express.Router();
const CityContent = require('../models/CityContent');

// Simple login route (hardcoded for now)
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === 'admin123') {
    res.json({ success: true, token: 'secret-token-123' });
  } else {
    res.json({ success: false });
  }
});

router.post('/cities', async (req, res) => {
  let {
    city,
    title,
    description,
    footerTitle,
    footerDescription,
    metaTitle,
    metaDescription,
    schemaMarkup,
  } = req.body;

  if (!city) {
    return res.status(400).json({ success: false, error: 'City is required' });
  }

  city = city.toLowerCase();

  try {
    let existing = await CityContent.findOne({ city });

    if (existing) {
      existing.title = title || '';
      existing.description = description || '';
      existing.footerTitle = footerTitle || '';
      existing.footerDescription = footerDescription || '';
      existing.metaTitle = metaTitle || '';
      existing.metaDescription = metaDescription || '';
      existing.schemaMarkup = schemaMarkup || '';
      await existing.save();
    } else {
      await CityContent.create({
        city, // now always lowercase
        title: title || '',
        description: description || '',
        footerTitle: footerTitle || '',
        footerDescription: footerDescription || '',
        metaTitle: metaTitle || '',
        metaDescription: metaDescription || '',
        schemaMarkup: schemaMarkup || '',
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});


// DELETE city
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

// ✅ PUT rename city
router.put('/cities/:city', async (req, res) => {
  const { city } = req.params;
  const { newCity } = req.body;

  if (!newCity) {
    return res.status(400).json({ success: false, error: 'New city name required' });
  }

  try {
    const existing = await CityContent.findOne({ city });

    if (existing) {
      existing.city = newCity;
      await existing.save();

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