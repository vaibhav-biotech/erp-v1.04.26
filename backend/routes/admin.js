const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Store = require('../models/Store');
const ActivityLog = require('../models/ActivityLog');

const getDefaultTaxSettings = () => ({
  enabled: false,
  rate: 18,
});

const sanitizeTaxSettings = (settings = {}) => {
  const enabled = Boolean(settings.enabled);
  const parsedRate = Number(settings.rate);
  const safeRate = Number.isFinite(parsedRate)
    ? Math.min(100, Math.max(0, parsedRate))
    : 18;

  return {
    enabled,
    rate: safeRate,
  };
};

const generateAdminToken = (adminId, role, storeName) => {
  return jwt.sign(
    { id: adminId, role, storeName: storeName ? storeName.toLowerCase() : null },
    process.env.JWT_SECRET || 'your-super-secret-key-change-in-production',
    { expiresIn: '24h' }
  );
};

// Middleware to verify admin token
const verifyAdminToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-key-change-in-production');
    req.adminId = decoded.id;
    req.adminRole = decoded.role;
    
    // Enforce store isolation for store_admin
    // For super_admin, we keep the storeName set by storeRouter middleware (from headers)
    if (decoded.role === 'store_admin' && decoded.storeName) {
      req.storeName = decoded.storeName;
    }
    
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin || !admin.isActive) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const isPasswordCorrect = await admin.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    admin.lastLogin = new Date();
    await admin.save();

    // Log Activity for inventory_admin
    if (admin.role === 'inventory_admin') {
      try {
        await ActivityLog.create({
          adminId: admin._id,
          adminEmail: admin.email,
          role: admin.role,
          action: 'LOGIN',
          details: 'Admin logged into the Inventory Dashboard',
        });
      } catch (logErr) {
        console.error('Failed to log login activity:', logErr);
      }
    }

    const token = generateAdminToken(admin._id, admin.role, admin.storeName);

    res.status(200).json({
      success: true,
      data: {
        token,
        admin: {
          _id: admin._id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: admin.role,
          storeName: admin.storeName ? admin.storeName.toLowerCase() : null,
          canAccessAllStores: admin.role === 'super_admin'
        }
      }
    });
  } catch (error) {
    console.error('[Admin Login]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/logout', verifyAdminToken, async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId);
    if (admin && admin.role === 'inventory_admin') {
      await ActivityLog.create({
        adminId: admin._id,
        adminEmail: admin.email,
        role: admin.role,
        action: 'LOGOUT',
        details: 'Admin logged out of the Inventory Dashboard',
      });
    }
    
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, error: 'Failed to log out' });
  }
});

router.get('/profile', verifyAdminToken, async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId);
    if (!admin) {
      return res.status(404).json({ success: false, error: 'Admin not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: admin._id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        phone: admin.phone,
        role: admin.role,
        storeName: admin.storeName || null,
        permissions: admin.permissions,
        isActive: admin.isActive,
        lastLogin: admin.lastLogin
      }
    });
  } catch (error) {
    console.error('[Admin Profile]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin: Get Dashboard Stats for Current Store
router.get('/dashboard-stats', verifyAdminToken, async (req, res) => {
  try {
    const storeName = req.storeName;
    if (!storeName) {
      return res.status(400).json({ success: false, error: 'Store name required' });
    }

    const Customer = require('../models/Customer');
    const Product = require('../models/Product');
    const mongoose = require('mongoose');

    const totalCustomers = await Customer.countDocuments({ storeName });
    const totalProducts = await Product.countDocuments({ storeName });
    
    // Inventory Calculations
    const allProducts = await Product.find({ storeName });
    const lowStock = allProducts.filter(p => p.stock < 10).length;
    const totalInventoryValue = allProducts.reduce((sum, p) => sum + ((p.costPrice || 0) * (p.stock || 0)), 0);
    const totalCategories = await mongoose.connection.db.collection('categories').countDocuments({});
    
    const db = mongoose.connection.db;
    const orders = await db.collection('orders').find({ storeName, paymentStatus: 'paid' }).toArray();
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || order.total || 0), 0);

    return res.status(200).json({
      success: true,
      data: {
        totalCustomers,
        totalProducts,
        totalOrders,
        totalRevenue,
        lowStock,
        totalInventoryValue,
        totalCategories
      }
    });
  } catch (error) {
    console.error('[Store Admin Dashboard Stats Error]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Public: Get tax settings for current store (used by checkout)
router.get('/tax-settings', async (req, res) => {
  try {
    const storeName = String(req.storeName || '').toLowerCase().trim();

    if (!storeName) {
      return res.status(200).json({
        success: true,
        data: getDefaultTaxSettings(),
      });
    }

    const store = await Store.findOne({ storeName });
    if (!store) {
      return res.status(200).json({
        success: true,
        data: getDefaultTaxSettings(),
      });
    }

    return res.status(200).json({
      success: true,
      data: sanitizeTaxSettings(store.taxSettings || getDefaultTaxSettings()),
    });
  } catch (error) {
    console.error('[Get Tax Settings]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Admin: Get tax settings for current store
router.get('/tax-settings/admin', verifyAdminToken, async (req, res) => {
  try {
    const storeName = String(req.storeName || '').toLowerCase().trim();
    if (!storeName) {
      return res.status(400).json({ success: false, error: 'Store name required' });
    }

    const store = await Store.findOne({ storeName });
    if (!store) {
      return res.status(404).json({ success: false, error: 'Store not found' });
    }

    return res.status(200).json({
      success: true,
      data: sanitizeTaxSettings(store.taxSettings || getDefaultTaxSettings()),
    });
  } catch (error) {
    console.error('[Get Admin Tax Settings]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Admin: Update tax settings for current store
router.put('/tax-settings/admin', verifyAdminToken, async (req, res) => {
  try {
    const storeName = String(req.storeName || '').toLowerCase().trim();
    if (!storeName) {
      return res.status(400).json({ success: false, error: 'Store name required' });
    }

    const { enabled, rate } = req.body || {};
    const nextSettings = sanitizeTaxSettings({ enabled, rate });

    const store = await Store.findOne({ storeName });
    if (!store) {
      return res.status(404).json({ success: false, error: 'Store not found' });
    }

    store.taxSettings = nextSettings;
    await store.save();

    return res.status(200).json({
      success: true,
      message: 'Tax settings updated',
      data: nextSettings,
    });
  } catch (error) {
    console.error('[Update Tax Settings]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Get gift wrap options for store
router.get('/gift-wrap-options', async (req, res) => {
  try {
    const storeName = req.storeName;

    if (!storeName) {
      return res.status(400).json({ success: false, error: 'Store name required' });
    }

    const store = await Store.findOne({ storeName: storeName.toLowerCase() });
    if (!store) {
      return res.status(404).json({ success: false, error: 'Store not found' });
    }

    const options = (store.giftWrapOptions || []).sort((a, b) => a.displayOrder - b.displayOrder);
    
    res.json({
      success: true,
      data: options
    });
  } catch (error) {
    console.error('[Get Gift Wrap Options]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add gift wrap option
router.post('/gift-wrap-options', verifyAdminToken, async (req, res) => {
  try {
    const Store = require('../models/Store');
    const { name, price } = req.body;
    const storeName = req.storeName;

    if (!storeName || !name || price === undefined) {
      return res.status(400).json({ success: false, error: 'Store name, name, and price required' });
    }

    const store = await Store.findOne({ storeName: storeName.toLowerCase() });
    if (!store) {
      return res.status(404).json({ success: false, error: 'Store not found' });
    }

    console.log('📦 Store found:', { storeName, hasName: !!store.name, giftOptionsCount: store.giftWrapOptions?.length || 0 });

    // Ensure store.name exists
    if (!store.name) {
      console.warn('⚠️ Store missing name field, using storeName:', storeName);
      store.name = storeName;
    }

    const maxOrder = Math.max(...(store.giftWrapOptions || []).map(o => o.displayOrder || 0), -1);
    const newOption = {
      _id: new (require('mongoose')).Types.ObjectId(),
      name,
      price: Number(price),
      displayOrder: maxOrder + 1
    };

    store.giftWrapOptions = store.giftWrapOptions || [];
    store.giftWrapOptions.push(newOption);
    store.markModified('giftWrapOptions');
    
    console.log('💾 Saving store with new option:', newOption);
    await store.save();

    console.log('✅ Gift wrap option added successfully');
    res.json({
      success: true,
      data: newOption,
      message: 'Gift wrap option added'
    });
  } catch (error) {
    console.error('[Add Gift Wrap Option] ERROR:', error.message, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update gift wrap option
router.put('/gift-wrap-options/:optionId', verifyAdminToken, async (req, res) => {
  try {
    const Store = require('../models/Store');
    const { name, price, displayOrder } = req.body;
    const { optionId } = req.params;
    const storeName = req.storeName;

    if (!storeName) {
      return res.status(400).json({ success: false, error: 'Store name required' });
    }

    const store = await Store.findOne({ storeName: storeName.toLowerCase() });
    if (!store) {
      return res.status(404).json({ success: false, error: 'Store not found' });
    }

    // Ensure store.name exists
    if (!store.name) {
      console.warn('⚠️ Store missing name field, using storeName:', storeName);
      store.name = storeName;
    }

    const option = store.giftWrapOptions?.find(o => o._id.toString() === optionId);
    if (!option) {
      return res.status(404).json({ success: false, error: 'Gift wrap option not found' });
    }

    console.log('📦 Updating gift wrap option:', optionId, 'with:', { name, price, displayOrder });

    if (name) option.name = name;
    if (price !== undefined) option.price = Number(price);
    if (displayOrder !== undefined) option.displayOrder = displayOrder;

    store.markModified('giftWrapOptions');
    
    console.log('💾 Saving updated store');
    await store.save();

    console.log('✅ Gift wrap option updated successfully');
    res.json({
      success: true,
      data: option,
      message: 'Gift wrap option updated'
    });
  } catch (error) {
    console.error('[Update Gift Wrap Option] ERROR:', error.message, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete gift wrap option
router.delete('/gift-wrap-options/:optionId', verifyAdminToken, async (req, res) => {
  try {
    const Store = require('../models/Store');
    const { optionId } = req.params;
    const storeName = req.storeName;

    if (!storeName) {
      return res.status(400).json({ success: false, error: 'Store name required' });
    }

    const store = await Store.findOne({ storeName: storeName.toLowerCase() });
    if (!store) {
      return res.status(404).json({ success: false, error: 'Store not found' });
    }

    // Ensure store.name exists
    if (!store.name) {
      console.warn('⚠️ Store missing name field, using storeName:', storeName);
      store.name = storeName;
    }

    console.log('📦 Deleting gift wrap option:', optionId);

    store.giftWrapOptions = (store.giftWrapOptions || []).filter(o => o._id.toString() !== optionId);
    store.markModified('giftWrapOptions');
    
    console.log('💾 Saving store after deletion');
    await store.save();

    console.log('✅ Gift wrap option deleted successfully');
    res.json({
      success: true,
      message: 'Gift wrap option deleted'
    });
  } catch (error) {
    console.error('[Delete Gift Wrap Option] ERROR:', error.message, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
