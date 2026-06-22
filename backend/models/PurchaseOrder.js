const mongoose = require('mongoose');

const poProductSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  orderedQty: {
    type: Number,
    required: true,
    min: 1
  },
  receivedQty: {
    type: Number,
    default: 0
  },
  damagedQty: {
    type: Number,
    default: 0
  },
  pendingQty: {
    type: Number,
    default: function() {
      return this.orderedQty;
    }
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0
  },
  gstPercent: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  }
});

const grnHistorySchema = new mongoose.Schema({
  receivedDate: {
    type: Date,
    default: Date.now
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  receivedQty: {
    type: Number,
    required: true,
    min: 0
  },
  damagedQty: {
    type: Number,
    default: 0,
    min: 0
  },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  notes: String
});

const purchaseOrderSchema = new mongoose.Schema({
  poNumber: {
    type: String,
    required: true,
    unique: true
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  expectedDate: {
    type: Date
  },
  warehouse: {
    type: String,
    default: 'Central Warehouse'
  },
  paymentTerms: {
    type: String,
    default: 'Net 30'
  },
  reference: {
    type: String
  },
  products: [poProductSchema],
  financials: {
    subtotal: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    transportFee: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Accepted', 'Partially Received', 'Received', 'Completed', 'Cancelled'],
    default: 'Draft'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Partial', 'Paid'],
    default: 'Pending'
  },
  grnHistory: [grnHistorySchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, { timestamps: true });

// Auto-generate PO Number if missing
purchaseOrderSchema.pre('validate', async function(next) {
  if (!this.poNumber) {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await mongoose.model('PurchaseOrder').countDocuments();
    this.poNumber = `PO-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
