const express = require('express');
const router = express.Router();

// Dummy login: just for simple test
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'password123') {
    res.json({ success: true, token: 'dummy-admin-token' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Example: get cities
router.get('/cities', async (req, res) => {
  const cities = await City.find();
  res.json(cities);
});

// Example: update city
router.post('/cities', async (req, res) => {
  const { city, title, description } = req.body;
  let existingCity = await City.findOne({ city });
  if (existingCity) {
    existingCity.title = title;
    existingCity.description = description;
    await existingCity.save();
  } else {
    await City.create({ city, title, description });
  }
  res.json({ success: true });
});

module.exports = router;
