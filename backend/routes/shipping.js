const express = require('express');
const router = express.Router();
const ShippingSettings = require('../models/ShippingSettings');
const ShippingPartner = require('../models/ShippingPartner');

// --- SHIPPING SETTINGS ---

const normalizeStoreName = (value) => {
  if (!value) return 'plantsingarden';
  let base = value.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '');
  base = base.split(':')[0];
  base = base.split('/')[0];
  const compact = base.replace(/[^a-z0-9]/g, '');
  if (compact.includes('plantsingarden') || compact.includes('plantingarden')) return 'plantsingarden';
  return compact;
};

// Get specific store's shipping config (Public facing)
router.get('/store-config', async (req, res) => {
  try {
    const storeName = normalizeStoreName(req.storeName || 'plantsingarden');
    
    let settings = await ShippingSettings.findOne({ type: 'global' });
    let config = {
      shippingCost: 50,
      freeShippingThreshold: 60
    };

    if (settings) {
      config.shippingCost = settings.defaultCost;
      config.freeShippingThreshold = settings.freeShippingThreshold !== undefined ? settings.freeShippingThreshold : 60;
      
      const storeCostObj = settings.storeCosts.find(c => normalizeStoreName(c.storeName) === storeName);
      if (storeCostObj) {
        config.shippingCost = storeCostObj.cost;
        if (storeCostObj.freeShippingThreshold !== undefined) {
          config.freeShippingThreshold = storeCostObj.freeShippingThreshold;
        }
      }
    }
    res.json({ success: true, data: config });
  } catch (error) {
    console.error('Fetch store config error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch store shipping config' });
  }
});

// Get current shipping settings
router.get('/settings', async (req, res) => {
  try {
    let settings = await ShippingSettings.findOne({ type: 'global' });
    if (!settings) {
      settings = await ShippingSettings.create({ type: 'global', storeCosts: [], defaultCost: 0, freeShippingThreshold: 60 });
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Fetch settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch shipping settings' });
  }
});

// Update shipping settings
router.put('/settings', async (req, res) => {
  try {
    const { storeCosts, defaultCost, freeShippingThreshold } = req.body;
    let settings = await ShippingSettings.findOne({ type: 'global' });
    if (!settings) {
      settings = new ShippingSettings({ type: 'global' });
    }
    
    if (storeCosts !== undefined) settings.storeCosts = storeCosts;
    if (defaultCost !== undefined) settings.defaultCost = defaultCost;
    if (freeShippingThreshold !== undefined) settings.freeShippingThreshold = freeShippingThreshold;

    await settings.save();
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to update shipping settings' });
  }
});

// --- SHIPPING PARTNERS ---

// Get all shipping partners
router.get('/partners', async (req, res) => {
  try {
    const partners = await ShippingPartner.find().sort({ createdAt: -1 });
    res.json({ success: true, data: partners });
  } catch (error) {
    console.error('Fetch partners error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch shipping partners' });
  }
});

// Create a new shipping partner
router.post('/partners', async (req, res) => {
  try {
    const { name, trackingUrlPrefix, isActive, contactInfo } = req.body;
    
    // Check if name already exists
    const existing = await ShippingPartner.findOne({ name });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Shipping partner with this name already exists' });
    }

    const partner = new ShippingPartner({ name, trackingUrlPrefix, isActive, contactInfo });
    await partner.save();
    res.status(201).json({ success: true, data: partner });
  } catch (error) {
    console.error('Create partner error:', error);
    res.status(500).json({ success: false, message: 'Failed to create shipping partner' });
  }
});

// Update a shipping partner
router.put('/partners/:id', async (req, res) => {
  try {
    const { name, trackingUrlPrefix, isActive, contactInfo } = req.body;
    const partner = await ShippingPartner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }

    if (name !== undefined) partner.name = name;
    if (trackingUrlPrefix !== undefined) partner.trackingUrlPrefix = trackingUrlPrefix;
    if (isActive !== undefined) partner.isActive = isActive;
    if (contactInfo !== undefined) partner.contactInfo = contactInfo;

    await partner.save();
    res.json({ success: true, data: partner });
  } catch (error) {
    console.error('Update partner error:', error);
    res.status(500).json({ success: false, message: 'Failed to update shipping partner' });
  }
});

// Delete a shipping partner
router.delete('/partners/:id', async (req, res) => {
  try {
    const partner = await ShippingPartner.findByIdAndDelete(req.params.id);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }
    res.json({ success: true, message: 'Partner deleted successfully' });
  } catch (error) {
    console.error('Delete partner error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete shipping partner' });
  }
});

module.exports = router;
