const express = require('express');
const router = express.Router();
const Microlocation = require('../models/Microlocation');

// ✅ Get all microlocations for a city
router.get('/:city', async (req, res) => {
  try {
    const { city } = req.params; // slug
    const micros = await Microlocation.find({ city }); // match city slug
    res.json(micros);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Get single microlocation by slug
router.get('/:city/:microSlug', async (req, res) => {
  try {
    const { city, microSlug } = req.params;
    const micro = await Microlocation.findOne({ city, slug: microSlug });
    if (!micro) return res.status(404).json({ error: 'Microlocation not found' });
    res.json(micro);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add new microlocation
router.post('/', async (req, res) => {
  try {
    const { name, city } = req.body;
    if (!name || !city) {
      return res.status(400).json({ error: 'Name and city are required' });
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-');

    const microExists = await Microlocation.findOne({ city, slug });
    if (microExists) {
      return res.status(400).json({ error: 'Microlocation already exists for this city' });
    }

    const micro = new Microlocation({ name, slug, city });
    await micro.save();

    res.json({ success: true, micro });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


router.post('/update', async (req, res) => {
  try {
    const { city, slug, footerTitle, footerDescription, metaTitle, metaDescription, schemaMarkup } = req.body;
    if (!city || !slug) return res.status(400).json({ error: 'City and slug required' });

    const micro = await Microlocation.findOneAndUpdate(
      { city, slug },
      { footerTitle, footerDescription, metaTitle, metaDescription, schemaMarkup },
      { new: true, upsert: true } // create if not exists
    );

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
