const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');

// Create lead
router.post('/', async (req, res) => {
  try {
    const lead = new Lead(req.body);
    await lead.save();
    res.json({ success: true, lead });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Get all leads with optional filters
router.get('/', async (req, res) => {
  const { city, microlocation, fromDate, toDate } = req.query;
  let filter = {};
  if (city) filter.city = city;
  if (microlocation) filter.microlocation = microlocation;
  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate) filter.createdAt.$gte = new Date(fromDate);
    if (toDate) filter.createdAt.$lte = new Date(toDate);
  }
  const leads = await Lead.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, leads });
});

module.exports = router;
