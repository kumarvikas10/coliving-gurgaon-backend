const mongoose = require('mongoose');

const CityContentSchema = new mongoose.Schema({
  city: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
});

module.exports = mongoose.model('CityContent', CityContentSchema);
