const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true,
    },
    store: {
      type: String,
      default: 'plants in garden',
      trim: true,
    },
    address: {
      street: { type: String, trim: true, default: '' },
      city: { type: String, trim: true, default: '' },
      state: { type: String, trim: true, default: '' },
      zipCode: { type: String, trim: true, default: '' },
      country: { type: String, trim: true, default: 'India' },
    },
    addresses: [
      {
        isDefault: { type: Boolean, default: false },
        firstName: { type: String, trim: true },
        lastName: { type: String, trim: true },
        phone: { type: String, trim: true },
        street: { type: String, trim: true, default: '' },
        city: { type: String, trim: true, default: '' },
        state: { type: String, trim: true, default: '' },
        zipCode: { type: String, trim: true, default: '' },
        country: { type: String, trim: true, default: 'India' },
        category: { type: String, enum: ['Home', 'Office', 'Other'], default: 'Home' },
      }
    ],
    paymentMethods: [
      {
        type: { type: String, enum: ['upi', 'card', 'bank'], required: true },
        isDefault: { type: Boolean, default: false },
        details: { type: String, required: true }, // UPI ID, masked card, or account number
        nameOnAccount: { type: String, trim: true }
      }
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: 'customers' }
);

module.exports = mongoose.model('Customer', CustomerSchema);
