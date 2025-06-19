const express = require('express');
const router = express.Router();
const CityContent = require('../models/CityContent');

// Get all cities
router.get('/', async (req, res) => {
  try {
    const cities = await CityContent.find({}, 'city'); // return city field only
    res.json(cities); // return empty array if no cities
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single city by name
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
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
