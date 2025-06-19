const express = require('express');
const router = express.Router();
const CityContent = require('../models/CityContent');

// Get all cities (only names, for dropdown)
router.get('/', async (req, res) => {
  try {
    const cities = await CityContent.find({}, 'city').sort({ city: 1 });
    const cityNames = cities.map((item) => item.city);
    res.json(cityNames);
  } catch (err) {
    console.error('Error fetching cities:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single city content by name
router.get('/:city', async (req, res) => {
  const { city } = req.params;

  try {
    const cityContent = await CityContent.findOne({ city });

    if (cityContent) {
      res.json(cityContent);
    } else {
      res.status(404).json({ error: 'City not found' });
    }
  } catch (err) {
    console.error('Error fetching city:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
