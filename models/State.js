// models/State.js
const mongoose = require("mongoose");

const StateSchema = new mongoose.Schema(
  {
    state: { type: String, required: true, unique: true, trim: true, lowercase: true },
    displayState: { type: String, required: true, trim: true },
    country: { type: String, trim: true, default: "India" },
    enabled: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

StateSchema.index({ enabled: 1, order: 1, displayState: 1 });

module.exports = mongoose.models.State || mongoose.model("State", StateSchema);
