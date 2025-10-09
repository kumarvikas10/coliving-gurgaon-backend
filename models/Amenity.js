const mongoose = require("mongoose");

const IconSchema = new mongoose.Schema(
  {
    publicId: { type: String, required: true, trim: true },
    secureUrl: { type: String, required: true, trim: true },
    bytes: { type: Number },
    format: { type: String },
    width: { type: Number },
    height: { type: Number },
  },
  { _id: false }
);

const AmenitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    icon: { type: IconSchema, required: false }, // set when a file is uploaded
    enabled: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Amenity", AmenitySchema);
