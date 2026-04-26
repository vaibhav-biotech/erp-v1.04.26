const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

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

module.exports = router;
