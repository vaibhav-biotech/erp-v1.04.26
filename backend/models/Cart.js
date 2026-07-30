const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  sizeVariant: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true }
  },
  potVariant: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true }
  },
  quantity: { type: Number, required: true, min: 1 },
  totalPrice: { type: Number, required: true },
  giftWrap: {
    isGift: { type: Boolean, default: false },
    price: { type: Number, default: 0 },
    message: { type: String }
  }
}, { _id: false });

const CartSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    unique: true
  },
  storeName: {
    type: String,
    required: true,
    default: 'plants in garden'
  },
  items: [CartItemSchema],
  recoveryEmailSent: {
    type: Boolean,
    default: false
  },
  lastUpdatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Cart', CartSchema);
