const mongoose = require('mongoose');

const ShippingPartnerSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  trackingUrlPrefix: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  contactInfo: { type: String, default: '' }
}, {
  timestamps: true
});

module.exports = mongoose.model('ShippingPartner', ShippingPartnerSchema);
