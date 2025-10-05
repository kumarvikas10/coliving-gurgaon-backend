// models/ColivingPlan.js
const mongoose = require("mongoose");

const ImageSchema = new mongoose.Schema(
  {
    publicId: { type: String, required: true, trim: true }, // e.g. folder/asset_xxx
    secureUrl: { type: String, required: true, trim: true }, // cloudinary https URL
    bytes: { type: Number }, // optional metadata
    format: { type: String }, // optional metadata
    width: { type: Number },
    height: { type: Number },
  },
  { _id: false }
);

const ColivingPlanSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 2000, default: "" },
    image: { type: ImageSchema, required: false }, // set when a file is uploaded
    enabled: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ColivingPlan", ColivingPlanSchema);
