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
    
    const customers = await Customer.find({})
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

// @route   PUT /api/customers/:id
// @desc    Update customer profile
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, phone, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).select('-password');

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.json({ success: true, message: 'Profile updated', data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating profile', error: error.message });
  }
});

// @route   POST /api/customers/:id/addresses
// @desc    Add a new address
// @access  Private
router.post('/:id/addresses', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    const newAddress = req.body;
    
    if (newAddress.isDefault) {
      // Unset previous defaults
      customer.addresses.forEach(addr => addr.isDefault = false);
    } else if (customer.addresses.length === 0) {
      // First address is always default
      newAddress.isDefault = true;
    }

    customer.addresses.push(newAddress);
    customer.updatedAt = Date.now();
    await customer.save();

    res.json({ success: true, message: 'Address added', data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error adding address', error: error.message });
  }
});

// @route   PUT /api/customers/:id/addresses/:addressId
// @desc    Update an address
// @access  Private
router.put('/:id/addresses/:addressId', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    const address = customer.addresses.id(req.params.addressId);
    if (!address) return res.status(404).json({ success: false, message: 'Address not found' });

    const updates = req.body;
    if (updates.isDefault && !address.isDefault) {
      customer.addresses.forEach(addr => addr.isDefault = false);
    }

    Object.assign(address, updates);
    customer.updatedAt = Date.now();
    await customer.save();

    res.json({ success: true, message: 'Address updated', data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating address', error: error.message });
  }
});

// @route   DELETE /api/customers/:id/addresses/:addressId
// @desc    Delete an address
// @access  Private
router.delete('/:id/addresses/:addressId', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    customer.addresses.pull(req.params.addressId);
    customer.updatedAt = Date.now();
    await customer.save();

    res.json({ success: true, message: 'Address deleted', data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting address', error: error.message });
  }
});

// @route   POST /api/customers/:id/payments
// @desc    Add a saved payment method
// @access  Private
router.post('/:id/payments', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    const newPayment = req.body;
    
    if (newPayment.isDefault) {
      customer.paymentMethods.forEach(pm => pm.isDefault = false);
    } else if (customer.paymentMethods.length === 0) {
      newPayment.isDefault = true;
    }

    customer.paymentMethods.push(newPayment);
    customer.updatedAt = Date.now();
    await customer.save();

    res.json({ success: true, message: 'Payment method added', data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error adding payment method', error: error.message });
  }
});

// @route   DELETE /api/customers/:id/payments/:paymentId
// @desc    Delete a saved payment method
// @access  Private
router.delete('/:id/payments/:paymentId', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    customer.paymentMethods.pull(req.params.paymentId);
    customer.updatedAt = Date.now();
    await customer.save();

    res.json({ success: true, message: 'Payment method deleted', data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting payment method', error: error.message });
  }
});

module.exports = router;
