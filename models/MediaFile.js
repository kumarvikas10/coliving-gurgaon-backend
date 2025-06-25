const mongoose = require('mongoose');

const mediaFileSchema = new mongoose.Schema({
  url: String,
  public_id: String,
  resource_type: String,
  original_filename: String,
  alt: String, // <-- add this line
}, { timestamps: true });

module.exports = mongoose.model('MediaFile', mediaFileSchema);