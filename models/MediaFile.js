const mongoose = require('mongoose');

const MediaFileSchema = new mongoose.Schema({
  url: { type: String, required: true },
  public_id: { type: String, required: true },
  resource_type: { type: String, required: true }, // image or video
  original_filename: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MediaFile', MediaFileSchema);
