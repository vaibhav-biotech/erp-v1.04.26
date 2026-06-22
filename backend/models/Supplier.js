const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  companyName: { type: String, trim: true },
  gstNo: { type: String, trim: true },
  panNo: { type: String, trim: true },
  contactName: { type: String, default: null, trim: true },
  email: { 
    type: String, 
    default: null, 
    trim: true, 
    lowercase: true, 
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address'] 
  },
  phone: { type: String, default: null, trim: true },
  address: {
    street: { type: String, default: null, trim: true },
    city: { type: String, default: null, trim: true },
    state: { type: String, default: null, trim: true },
    pincode: { type: String, default: null, trim: true }
  },
  businessDetails: {
    paymentTerms: { type: String, default: 'Net 30', trim: true },
    creditLimit: { type: Number, default: 0 },
    gstPercent: { type: Number, default: 18 },
    defaultCurrency: { type: String, default: 'INR', trim: true }
  },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  notes: {
    isPreferred: { type: Boolean, default: false },
    internalNotes: { type: String, default: null }
  },
  rating: { type: Number, min: 0, max: 5, default: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('Supplier', supplierSchema);
