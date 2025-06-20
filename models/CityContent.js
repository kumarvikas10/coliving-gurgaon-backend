const mongoose = require('mongoose');

const CityContentSchema = new mongoose.Schema({
  city: { type: String, required: true, unique: true },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  footerTitle: { type: String, default: '' },
  footerDescription: { type: String, default: '' },
  metaTitle: { type: String, default: '' },
  metaDescription: { type: String, default: '' },
  schemaMarkup: { type: String, default: '' },
});

module.exports = mongoose.model('CityContent', CityContentSchema);
