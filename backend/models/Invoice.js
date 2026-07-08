const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 }
});

const InvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
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
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: false // If generated from an order
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: false // Optional for manual invoices
    },
    customerName: {
      type: String,
      required: false // In case of manual entry without customer reference
    },
    customerEmail: {
      type: String,
      required: false
    },
    items: [invoiceItemSchema],
    subtotal: {
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
    tax: {
      type: Number,
      default: 0,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'],
      default: 'Draft'
    },
    dueDate: {
      type: Date,
      required: false
    }
  },
  {
    timestamps: true,
    collection: 'invoices'
  }
);

module.exports = mongoose.model('Invoice', InvoiceSchema);
