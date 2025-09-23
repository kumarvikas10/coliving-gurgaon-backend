const mongoose = require('mongoose');

const MicrolocationSchema = new mongoose.Schema({
  name: { type: String, required: true },   // e.g. "Cyber City"
  slug: { type: String, required: true },   // lowercase slug for API
  city: { type: String, required: true },   // reference city slug
  footerTitle: String,
  footerDescription: String,
  metaTitle: String,
  metaDescription: String,
  schemaMarkup: String,
});

module.exports = mongoose.model('Microlocation', MicrolocationSchema);
