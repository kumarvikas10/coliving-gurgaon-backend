// models/Microlocation.js
const mongoose = require("mongoose");

const MicrolocationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },               
    slug: { type: String, required: true, trim: true, lowercase: true },
    city: { type: mongoose.Schema.Types.ObjectId, ref: "CityContent", required: true, index: true },
    enabled: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },

    footerTitle: String,
    footerDescription: String,
    metaTitle: String,
    metaDescription: String,
    schemaMarkup: String,
  },
  { timestamps: true }
);

// uniqueness within a city
MicrolocationSchema.index({ city: 1, slug: 1 }, { unique: true });

// avoid OverwriteModelError during hot reloads
module.exports = mongoose.models.Microlocation || mongoose.model("Microlocation", MicrolocationSchema);
