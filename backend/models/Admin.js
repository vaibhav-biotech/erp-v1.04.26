const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AdminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      select: false, // Don't return password by default
      minlength: 6
    },
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      default: null
    },
    role: {
      type: String,
      enum: ['super_admin', 'store_admin'],
      required: true,
      default: 'store_admin'
    },
    storeName: {
      type: String,
      default: null // null for super_admin, store name for store_admin
    },
    permissions: {
      canEditProducts: { type: Boolean, default: true },
      canEditCategories: { type: Boolean, default: false },
      canManageCustomers: { type: Boolean, default: false },
      canViewAnalytics: { type: Boolean, default: true },
      canManageOrders: { type: Boolean, default: true },
      canManageAdmins: { type: Boolean, default: false }, // Only super admin
      canAccessAllStores: { type: Boolean, default: false } // Only super admin
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'admins' // Shared collection for all stores
  }
);

// Hash password before saving
AdminSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

// Method to compare passwords
AdminSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Admin', AdminSchema);
