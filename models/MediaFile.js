const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema(
  {
    url: String,
    public_id: String,
    resource_type: String,
    original_filename: String,
    alt: String,
    width: Number,   // ✅
    height: Number,  // ✅
  },
  { timestamps: true }
);

module.exports = mongoose.model("MediaFile", mediaSchema);
