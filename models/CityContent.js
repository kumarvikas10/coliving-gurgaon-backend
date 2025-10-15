// models/CityContent.js
const mongoose = require("mongoose");

const CityContentSchema = new mongoose.Schema(
  {
    city: { type: String, required: true, unique: true, trim: true, lowercase: true },
    displayCity: { type: String, required: true, trim: true },
    state: { type: mongoose.Schema.Types.ObjectId, ref: "State", required: true, index: true },
    title: String,
    description: String,
    footerTitle: String,
    footerDescription: String,
    metaTitle: String,
    metaDescription: String,
    schemaMarkup: String,
  },
  { timestamps: true }
);

CityContentSchema.index({ state: 1, displayCity: 1 });

module.exports = mongoose.models.CityContent || mongoose.model("CityContent", CityContentSchema);
