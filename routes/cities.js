const express = require('express');
const router = express.Router();
const CityContent = require('../models/CityContent');

// Get all cities
router.get('/', async (req, res) => {
  const cities = await CityContent.find({});
  res.json(cities);
});

// Get single city by name
router.get('/:city', async (req, res) => {
  const { city } = req.params;

  const cityContent = await CityContent.findOne({ city });

  if (cityContent) {
    res.json(cityContent);
  } else {
    res.status(404).json({ error: 'City not found' });
  }
});

module.exports = router;
