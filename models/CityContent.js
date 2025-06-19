const mongoose = require('mongoose');

const CityContentSchema = new mongoose.Schema({
  city: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  footerTitle: { type: String, required: false },
  footerDescription: { type: String, required: false },
});

module.exports = mongoose.model('CityContent', CityContentSchema);
