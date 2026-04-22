const express = require('express');
const Customer = require('../models/Customer.js');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Middleware to extract admin from JWT token
const getAdminFromToken = (req) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return null;
    
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-super-secret-key-change-in-production'
    );
    return decoded;
  } catch (error) {
    return null;
  }
};

// @route   GET /api/customers
// @desc    Get customers for logged-in store admin
// @access  Private
router.get('/', async (req, res) => {
  try {
    const admin = getAdminFromToken(req);
    
    // Get the store from request (set by storeRouter middleware) or admin token
    const storeName = admin?.storeName || req.storeName || 'test';
    
    const customers = await Customer.find({ store: storeName })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customers',
      error: error.message,
    });
  }
});

// @route   GET /api/customers/all
// @desc    Get all customers across all stores (Super Admin only)
// @access  Private
router.get('/all', async (req, res) => {
  try {
    const admin = getAdminFromToken(req);
    
    // Only super_admin can access this
    if (admin?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can access all customers',
      });
    }

    const customers = await Customer.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    console.error('Error fetching all customers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching all customers',
      error: error.message,
    });
  }
});

// @route   GET /api/customers/:id
// @desc    Get single customer by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).select('-password');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer',
      error: error.message,
    });
  }
});

// @route   DELETE /api/customers/:id
// @desc    Delete customer (Admin only)
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    res.json({
      success: true,
      message: 'Customer deleted successfully',
      data: customer,
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting customer',
      error: error.message,
    });
  }
});

module.exports = router;
