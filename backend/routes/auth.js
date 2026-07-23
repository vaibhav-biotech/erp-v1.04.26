const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Customer = require('../models/Customer');
const Store = require('../models/Store');
const emailService = require('../services/email.service');

const router = express.Router();

const generateToken = (customerId) => {
  return jwt.sign(
    { id: customerId, type: 'customer' },
    process.env.JWT_SECRET || 'your-super-secret-key-change-in-production',
    { expiresIn: '30d' }
  );
};

// @route   POST /api/auth/login
// @desc    Customer login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    console.log(`\n🔐 LOGIN ATTEMPT: ${email}`);

    const storeName = req.storeName || 'plantsingarden';
    // Find customer by email and store
    const customer = await Customer.findOne({ email: email.toLowerCase(), store: storeName });
    console.log(`   Customer found: ${customer ? '✓' : '✗'}`);

    if (!customer) {
      console.log(`   ❌ Customer not found`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Compare password (supports plain text + legacy bcrypt hashes)
    let isPasswordCorrect = false;
    if (typeof customer.password === 'string' && customer.password.startsWith('$2')) {
      isPasswordCorrect = await bcrypt.compare(password, customer.password);
    } else {
      isPasswordCorrect = password === customer.password;
    }
    console.log(`   Password match: ${isPasswordCorrect ? '✓' : '✗'}`);

    if (!isPasswordCorrect) {
      console.log(`   ❌ Password incorrect`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate token
    const token = generateToken(customer._id.toString());
    console.log(`   ✅ Login successful`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        customer: {
          _id: customer._id,
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
          phone: customer.phone,
          store: customer.store,
        },
      },
    });
  } catch (error) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error during login',
      error: error.message,
    });
  }
});

// @route   POST /api/auth/signup
// @desc    Customer signup
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

    console.log(`\n📝 SIGNUP ATTEMPT: ${email}`);

    const storeName = req.storeName || 'plantsingarden';

    // Check if customer already exists for this store
    const existingCustomer = await Customer.findOne({ email: email.toLowerCase(), store: storeName });
    if (existingCustomer) {
      console.log(`   ❌ Customer already exists`);
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Create new customer with plain text password
    const newCustomer = new Customer({
      email: email.toLowerCase(),
      password, // Plain text - no hashing
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      store: storeName,
    });

    await newCustomer.save();
    console.log(`   ✅ Customer created`);

    // Send Welcome Email
    emailService.sendWelcomeEmail(newCustomer).catch(err => console.error("Welcome email failed:", err));

    // Generate token
    const token = generateToken(newCustomer._id.toString());

    res.status(201).json({
      success: true,
      message: 'Signup successful',
      data: {
        token,
        customer: {
          _id: newCustomer._id,
          email: newCustomer.email,
          firstName: newCustomer.firstName,
          lastName: newCustomer.lastName,
          phone: newCustomer.phone,
          store: newCustomer.store,
        },
      },
    });
  } catch (error) {
    console.error('❌ Signup error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error during signup',
      error: error.message,
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset email
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });
    
    const storeName = req.storeName || 'plantsingarden';
    const customer = await Customer.findOne({ email: email.toLowerCase(), store: storeName });
    
    if (!customer) {
      return res.status(200).json({ success: true, message: 'If an account exists, a reset link was sent.' });
    }
    
    const resetToken = jwt.sign(
      { id: customer._id },
      process.env.JWT_SECRET || 'your-super-secret-key-change-in-production',
      { expiresIn: '1h' }
    );
    
    let baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const store = await Store.findOne({ storeName: storeName });
    if (store && store.domain) {
      baseUrl = store.domain.startsWith('http') ? store.domain : `https://${store.domain}`;
    }
    
    // Ensure no trailing slash
    baseUrl = baseUrl.replace(/\/$/, '');
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
    
    await emailService.sendPasswordResetEmail(customer.email, resetUrl);
    
    res.status(200).json({ success: true, message: 'If an account exists, a reset link was sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password using token
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ success: false, message: 'Token and new password required' });
    
    let decoded;
    try {
       decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-key-change-in-production');
    } catch (err) {
       return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }
    
    const customer = await Customer.findById(decoded.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    
    customer.password = newPassword;
    await customer.save();
    
    res.status(200).json({ success: true, message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
