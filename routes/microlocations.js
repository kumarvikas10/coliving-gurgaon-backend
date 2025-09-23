const express = require('express');
const router = express.Router();
const Microlocation = require('../models/Microlocation');

// ✅ Get microlocations by city
router.get('/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const micros = await Microlocation.find({ city });
    res.json(micros);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Add new microlocation
router.post('/', async (req, res) => {
  try {
    const { name, city } = req.body;

    if (!name || !city) {
      return res.status(400).json({ error: 'Name and city are required' });
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const micro = new Microlocation({ name, slug, city });
    await micro.save();

    res.json({ success: true, micro });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Delete microlocation
router.delete('/:id', async (req, res) => {
  try {
    await Microlocation.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
