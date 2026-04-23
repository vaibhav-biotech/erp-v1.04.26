const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User.js');
const Customer = require('../models/Customer.js');
const Admin = require('../models/Admin.js');

const router = express.Router();

// Generate JWT Token
const generateToken = (id, type, role, storeName) => {
  const payload = { id, type };
  if (type === 'admin') {
    payload.role = role;
    payload.storeName = storeName;
  }
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '30d' }
  );
};

// @route   POST /api/auth/login
// @desc    Unified login for Admin & Customer
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const storeName = req.headers['x-store-name'] || 'test'; // Get store from header

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    console.log(`🔐 Login attempt for: ${email} in store: ${storeName}`);

    // STEP 1: Try Admin login first (Admin model)
    console.log('🔍 Checking Admin credentials...');
    const admin = await Admin.findOne({ email }).select('+password');
    
    if (admin) {
      console.log('✓ Admin found, verifying password...');
      const isPasswordCorrect = await admin.comparePassword(password);
      
      if (isPasswordCorrect) {
        const token = generateToken(admin._id.toString(), 'admin', admin.role, admin.storeName);
        console.log('✅ Admin login successful', `Role: ${admin.role}`);
        
        return res.status(200).json({
          success: true,
          message: 'Admin login successful',
          type: 'admin',
          data: {
            admin: {
              _id: admin._id,
              email: admin.email,
              firstName: admin.firstName,
              lastName: admin.lastName,
              role: admin.role,
              storeName: admin.storeName,
            },
            token,
          },
        });
      }
    }

    // STEP 2: If not admin, try Customer login (Customer model)
    console.log('🔍 Checking Customer credentials...');
    const customer = await Customer.findOne({ email }).select('+password');
    
    if (customer) {
      console.log('✓ Customer found, verifying password...');
      const isPasswordCorrect = await customer.comparePassword(password);
      
      if (isPasswordCorrect) {
        const token = generateToken(customer._id.toString(), 'customer', null, null);
        console.log('✅ Customer login successful');
        
        return res.status(200).json({
          success: true,
          message: 'Customer login successful',
          type: 'customer',
          data: {
            customer: {
              _id: customer._id,
              email: customer.email,
              firstName: customer.firstName,
              lastName: customer.lastName,
              phone: customer.phone,
              store: customer.store,
            },
            token,
          },
        });
      }
    }

    // STEP 3: If neither admin nor customer found or password wrong
    console.log('❌ Invalid credentials');
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// @route   POST /api/auth/signup
// @desc    Register a new customer
// @access  Public
router.post('/signup', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName || !phone) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Get store name from request (set by storeRouter middleware)
    const storeName = req.storeName || 'test';

    // Create new customer
    const newCustomer = new Customer({
      email,
      password,
      firstName,
      lastName,
      phone,
      store: storeName,
      isEmailVerified: false,
      preferences: {
        notifications: true,
        newsletter: true,
      },
    });

    await newCustomer.save();

    // Generate token
    const token = generateToken(newCustomer._id.toString(), 'customer');

    res.status(201).json({
      success: true,
      message: 'Customer registered successfully',
      data: {
        customer: {
          _id: newCustomer._id,
          email: newCustomer.email,
          firstName: newCustomer.firstName,
          lastName: newCustomer.lastName,
          phone: newCustomer.phone,
        },
        token,
      },
    });
  } catch (error) {
    console.error('❌ Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during signup',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

module.exports = router;
