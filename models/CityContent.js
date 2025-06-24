const mongoose = require('mongoose');

const CityContentSchema = new mongoose.Schema({
  city: { type: String, required: true, unique: true },  // lowercase slug
  displayCity: { type: String, required: true },         // for display
  title: String,
  description: String,
  footerTitle: String,
  footerDescription: String,
  metaTitle: String,
  metaDescription: String,
  schemaMarkup: String,
});

module.exports = mongoose.model('CityContent', CityContentSchema);
