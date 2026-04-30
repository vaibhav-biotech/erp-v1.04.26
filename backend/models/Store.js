const mongoose = require('mongoose');

const StoreSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    storeName: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    domain: {
      type: String,
      required: true
    },
    primaryColor: {
      type: String,
      default: '#000000'
    },
    logo: {
      type: String,
      default: null
    },
    description: {
      type: String,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null
    },
    giftWrapOptions: [
      {
        _id: mongoose.Schema.Types.ObjectId,
        name: String,
        price: Number,
        displayOrder: {
          type: Number,
          default: 0
        }
      }
    ]
  },
  {
    timestamps: true,
    collection: 'stores' // Shared collection for all stores
  }
);

module.exports = mongoose.model('Store', StoreSchema);
