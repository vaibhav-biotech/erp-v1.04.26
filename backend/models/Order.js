const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  variety: { type: String, default: '' },
  extraDescription: { type: String, default: '' }
});

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: false // Optional for generic orders without pre-registered customers
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    shipping: {
      type: Number,
      default: 0,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending'
    },
    paymentStatus: {
      type: String,
      enum: ['Unpaid', 'Paid', 'Refunded'],
      default: 'Unpaid'
    },
    source: {
      type: String, // e.g., 'Shopify', 'WooCommerce', 'Manual'
      default: 'Website'
    },
    paymentDate: {
      type: Date
    },
    dispatchingCenter: {
      type: String
    },
    shippingDetail: {
      type: String
    }
  },
  {
    timestamps: true,
    collection: 'orders'
  }
);

module.exports = mongoose.model('Order', OrderSchema);
