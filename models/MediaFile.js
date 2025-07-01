// models/MediaFile.js
const mongoose = require('mongoose');

const MediaFileSchema = new mongoose.Schema({
  url: String,
  public_id: String,
  resource_type: String,
  original_filename: String,
  alt: String,
  width: Number,
  height: Number,
  isPriority: {
    type: Boolean,
    default: false
  },
  priorityOrder: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('MediaFile', MediaFileSchema);
