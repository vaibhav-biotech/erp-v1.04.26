const mongoose = require('mongoose');

const InvoiceCounterSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true
    },
    monthYear: {
      type: String, // e.g. "0726"
      required: true
    },
    sequence: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Compound index to ensure one counter per store per month
InvoiceCounterSchema.index({ storeId: 1, monthYear: 1 }, { unique: true });

module.exports = mongoose.model('InvoiceCounter', InvoiceCounterSchema);
