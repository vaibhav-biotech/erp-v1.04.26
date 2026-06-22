const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  delta: {
    type: Number,
    required: true,
    validate: {
      validator: function(v) {
        return v !== 0; // Delta should be positive or negative, not zero
      },
      message: 'Stock movement delta cannot be zero'
    }
  },
  reason: {
    type: String,
    enum: ['Purchase', 'Order', 'Manual Adjustment', 'Damaged', 'Found', 'Other'],
    required: true
  },
  referenceId: {
    type: String, // Can be Order ID, PO ID, etc.
    default: null
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null // Will be null for system automated movements like Orders
  },
  notes: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('StockMovement', stockMovementSchema);
