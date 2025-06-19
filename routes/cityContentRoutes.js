// backend/routes/cityContentRoutes.js
const express = require('express');
const router = express.Router();
const CityContent = require('../models/CityContent');

// GET all cities
router.get('/', async (req, res) => {
  try {
    const cities = await CityContent.find();
    res.json(cities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET city by name
router.get('/:city', async (req, res) => {
  try {
    const city = await CityContent.findOne({ city: req.params.city.toLowerCase() });
    if (!city) return res.status(404).json({ message: 'City not found' });
    res.json(city);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add/update city
router.post('/', async (req, res) => {
  const { city, title, description } = req.body;

  try {
    let cityContent = await CityContent.findOne({ city: city.toLowerCase() });

    if (cityContent) {
      // Update existing
      cityContent.title = title;
      cityContent.description = description;
    } else {
      // Create new
      cityContent = new CityContent({ city: city.toLowerCase(), title, description });
    }

    await cityContent.save();
    res.json(cityContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
