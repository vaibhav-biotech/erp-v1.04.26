const mongoose = require('mongoose');

const StoreShippingCostSchema = new mongoose.Schema({
  storeName: { type: String, required: true },
  cost: { type: Number, required: true, default: 0 },
  freeShippingThreshold: { type: Number }
});

const ShippingSettingsSchema = new mongoose.Schema({
  type: { type: String, default: 'global', unique: true }, // Singleton pattern
  storeCosts: [StoreShippingCostSchema],
  defaultCost: { type: Number, default: 0 },
  freeShippingThreshold: { type: Number, default: 60 }
}, {
  timestamps: true
});

module.exports = mongoose.model('ShippingSettings', ShippingSettingsSchema);
