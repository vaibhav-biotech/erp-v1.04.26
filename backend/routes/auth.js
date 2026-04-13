const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User.js');
const Customer = require('../models/Customer.js');

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '30d' }
  );
};

// @route   POST /api/login
// @desc    Admin login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Find admin user
    const admin = await User.findOne({ email }).select('+password');
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Compare password with bcrypt
    const isPasswordCorrect = await bcrypt.compare(password, admin.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate token
    const token = generateToken(admin._id.toString());

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      data: {
        admin: {
          _id: admin._id,
          email: admin.email,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during admin login',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// @route   POST /api/auth/login
// @desc    Customer login
// @access  Public
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔍 Customer login attempt:', email);

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Find customer in Customer collection
    const customer = await Customer.findOne({ email }).select('+password');
    console.log('📦 Customer found:', !!customer);

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Compare password using model method
    const isPasswordCorrect = await customer.comparePassword(password);
    console.log('🔐 Password match:', isPasswordCorrect);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate token
    const token = generateToken(customer._id.toString());

    console.log('✅ Customer login successful:', customer.email);

    res.status(200).json({
      success: true,
      message: 'Customer login successful',
      data: {
        customer: {
          _id: customer._id,
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
          phone: customer.phone,
        },
        token,
      },
    });
  } catch (error) {
    console.error('❌ Customer login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during customer login',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

module.exports = router;
