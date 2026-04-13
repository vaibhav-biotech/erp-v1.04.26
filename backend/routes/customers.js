const express = require('express');
const Customer = require('../models/Customer.js');

const router = express.Router();

// @route   GET /api/customers
// @desc    Get all customers (Admin only)
// @access  Private
router.get('/', async (req, res) => {
  try {
    const customers = await Customer.find()
      .select('-password') // Don't return passwords
      .sort({ createdAt: -1 }); // Most recent first

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
