const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const CustomerSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    store: {
      type: String,
      default: 'test',
      trim: true,
    },
    profileImage: {
      type: String,
      default: null,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    preferences: {
      notifications: {
        type: Boolean,
        default: true,
      },
      newsletter: {
        type: Boolean,
        default: true,
      },
    },
  },
  { timestamps: true }
);

// Hash password before saving
CustomerSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (err) {
    throw err;
  }
});

// Method to compare passwords
CustomerSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

/**
 * STEP 2: Dynamic Customer Model (Option C Implementation)
 * 
 * Purpose: Support multiple store collections (plantsingarden_customers, store2_customers, etc.)
 * 
 * Usage:
 *   - const Customer = getCustomerModel('plantsingarden');
 *   - const customer = await Customer.findOne({ email });
 *   
 * Backwards Compatible:
 *   - const Customer = getCustomerModel(); // defaults to test.customers
 *   - const Customer = require('./models/Customer'); // still works (defaults to test)
 */

// Cache models to avoid recreating them
const modelCache = {};

/**
 * Get or create a Customer model for the specified store
 * @param {string} storeName - Store name (e.g., 'plantsingarden', 'store2')
 * @returns {mongoose.Model} Customer model for the specified store
 */
const getCustomerModel = (storeName = process.env.STORE_NAME || 'test') => {
  // Return cached model if exists
  if (modelCache[storeName]) {
    return modelCache[storeName];
  }

  // Generate collection name: test -> test.customers, plantsingarden -> plantsingarden_customers
  const collectionName = storeName === 'test' 
    ? 'test.customers' 
    : `${storeName}_customers`;

  // Create or get model (mongoose caches models internally)
  let model;
  try {
    // Try to get existing model
    model = mongoose.model(`Customer_${storeName}`);
  } catch (e) {
    // Create new model if not exists
    model = mongoose.model(
      `Customer_${storeName}`, 
      CustomerSchema, 
      collectionName
    );
  }

  // Cache the model
  modelCache[storeName] = model;
  return model;
};

// Export both: default model and dynamic getter function
module.exports = getCustomerModel('test'); // Default export for backwards compatibility
module.exports.getCustomerModel = getCustomerModel; // Export function for dynamic usage
