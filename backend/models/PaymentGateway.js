const mongoose = require('mongoose');

const PaymentGatewaySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true // e.g. "Razorpay"
    },
    provider: {
      type: String,
      required: true,
      enum: ['razorpay', 'stripe', 'phonepe', 'paytm', 'custom'],
      default: 'razorpay'
    },
    keyId: {
      type: String,
      required: true
    },
    keySecret: {
      type: String,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    assignedStores: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store'
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('PaymentGateway', PaymentGatewaySchema);
