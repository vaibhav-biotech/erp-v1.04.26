const express = require('express');
const router = express.Router();
const verifyAdminToken = require('../middleware/verifyAdminToken');
const PaymentGateway = require('../models/PaymentGateway');
const Settings = require('../models/Settings');

// Middleware to check for superadmin
const requireSuperadmin = (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ success: false, error: 'Forbidden. Superadmin access required.' });
  }
  next();
};

// ================= GLOBAL SETTINGS =================

// Get global settings (accessible to any authenticated admin/accountant to check if emails are enabled, etc.)
router.get('/global', verifyAdminToken, async (req, res) => {
  try {
    let settings = await Settings.findOne({ type: 'global' });
    if (!settings) {
      settings = await Settings.create({ type: 'global' });
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update global settings (superadmin only)
router.put('/global', verifyAdminToken, requireSuperadmin, async (req, res) => {
  try {
    let settings = await Settings.findOne({ type: 'global' });
    if (!settings) {
      settings = await Settings.create({ type: 'global' });
    }
    
    if (req.body.emails) settings.emails = { ...settings.emails, ...req.body.emails };
    if (req.body.paymentGateway) settings.paymentGateway = { ...settings.paymentGateway, ...req.body.paymentGateway };
    
    await settings.save();
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================= PAYMENT GATEWAYS =================

// Get all gateways (admin can read, superadmin can manage)
router.get('/gateways', verifyAdminToken, async (req, res) => {
  try {
    const gateways = await PaymentGateway.find().populate('assignedStores', 'name storeName domain');
    // If not superadmin, maybe omit keySecret for safety?
    if (req.user.role !== 'superadmin') {
      gateways.forEach(gw => gw.keySecret = '***');
    }
    res.json({ success: true, data: gateways });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create a new gateway
router.post('/gateways', verifyAdminToken, requireSuperadmin, async (req, res) => {
  try {
    const { name, provider, keyId, keySecret, isActive, assignedStores } = req.body;
    const gateway = new PaymentGateway({ name, provider, keyId, keySecret, isActive, assignedStores });
    await gateway.save();
    res.status(201).json({ success: true, data: gateway });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update an existing gateway
router.put('/gateways/:id', verifyAdminToken, requireSuperadmin, async (req, res) => {
  try {
    const gateway = await PaymentGateway.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!gateway) return res.status(404).json({ success: false, error: 'Gateway not found' });
    res.json({ success: true, data: gateway });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete a gateway
router.delete('/gateways/:id', verifyAdminToken, requireSuperadmin, async (req, res) => {
  try {
    const gateway = await PaymentGateway.findByIdAndDelete(req.params.id);
    if (!gateway) return res.status(404).json({ success: false, error: 'Gateway not found' });
    res.json({ success: true, message: 'Gateway deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
