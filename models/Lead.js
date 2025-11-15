const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  roomType: String,
  moveInDate: String,
  propertyId: mongoose.Schema.Types.ObjectId,
  city: String,
  microlocation: String,
  url: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Lead', LeadSchema);
