const mongoose = require('mongoose');

const DynamicSectionSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    productIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
    displayOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DynamicSection', DynamicSectionSchema);
