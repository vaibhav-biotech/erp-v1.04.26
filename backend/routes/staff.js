const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const StaffMember = require('../models/StaffMember');
const { ensureStaffDemoUsersOnce } = require('../services/staffSeed');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';

const STAFF_JOB_ROLES = [
  'social_media_manager',
  'whatsapp_manager',
  'sales',
  'operations',
  'packaging',
  'customer_support',
];

function initialsFromName(name) {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function generateStaffToken(member) {
  return jwt.sign(
    { id: member.id, role: member.role, type: 'staff_folder' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function verifyStaffToken(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'staff_folder') {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    req.staffId = decoded.id;
    req.staffRole = decoded.role;
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

function requireStaffAdmin(req, res, next) {
  if (req.staffRole !== 'staff_admin') {
    return res.status(403).json({ success: false, error: 'Only admin can do this' });
  }
  next();
}

// POST /api/staff/login
router.post('/login', async (req, res) => {
  try {
    const loginId = String(req.body.loginId || req.body.email || req.body.username || '')
      .trim()
      .toLowerCase();
    const password = String(req.body.password || '').trim();

    if (!loginId || !password) {
      return res.status(400).json({ success: false, error: 'Username/email and password required' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        error: 'Staff login is temporarily unavailable (database not connected)',
      });
    }

    await ensureStaffDemoUsersOnce();

    const member = await StaffMember.findOne({
      $or: [{ username: loginId }, { email: loginId }],
    }).select('+password');

    if (!member) {
      return res.status(401).json({ success: false, error: 'Invalid username/email or password' });
    }

    const valid = await member.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid username/email or password' });
    }

    if (member.role === 'staff' && !member.active) {
      return res.status(403).json({ success: false, error: 'Account is inactive' });
    }

    const token = generateStaffToken(member);

    return res.status(200).json({
      success: true,
      data: {
        token,
        user: member.toSafeJSON(),
      },
    });
  } catch (error) {
    console.error('[staff/login]', error);
    return res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// GET /api/staff/users
router.get('/users', verifyStaffToken, async (req, res) => {
  try {
    const members = await StaffMember.find().sort({ name: 1 });
    return res.status(200).json({
      success: true,
      data: members.map((m) => m.toSafeJSON()),
    });
  } catch (error) {
    console.error('[staff/users GET]', error);
    return res.status(500).json({ success: false, error: 'Failed to load staff' });
  }
});

// POST /api/staff/users
router.post('/users', verifyStaffToken, requireStaffAdmin, async (req, res) => {
  try {
    const username = String(req.body.username || '')
      .trim()
      .toLowerCase();
    const password = String(req.body.password || '').trim();
    const name = String(req.body.name || '').trim();
    const jobRoles = Array.isArray(req.body.jobRoles) ? req.body.jobRoles : [];

    if (!username) {
      return res.status(400).json({ success: false, error: 'Username is required' });
    }
    if (!password || password.length < 4) {
      return res.status(400).json({ success: false, error: 'Password must be at least 4 characters' });
    }
    if (!name) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }
    if (!jobRoles.length) {
      return res.status(400).json({ success: false, error: 'Select at least one role' });
    }

    const invalidRole = jobRoles.find((r) => !STAFF_JOB_ROLES.includes(r));
    if (invalidRole) {
      return res.status(400).json({ success: false, error: 'Invalid job role' });
    }

    const exists = await StaffMember.findOne({ username });
    if (exists) {
      return res.status(400).json({ success: false, error: 'Username already exists' });
    }

    const email =
      String(req.body.email || '').trim() || `${username}@plantsingarden.com`;
    const emailTaken = await StaffMember.findOne({ email: email.toLowerCase() });
    if (emailTaken) {
      return res.status(400).json({ success: false, error: 'Email already in use' });
    }

    const member = await StaffMember.create({
      id: `staff-${Date.now()}`,
      username,
      email: email.toLowerCase(),
      password,
      name,
      role: 'staff',
      jobRoles,
      avatarInitials: initialsFromName(name),
      phone: String(req.body.phone || '').trim(),
      active: true,
    });

    return res.status(201).json({
      success: true,
      data: member.toSafeJSON(),
    });
  } catch (error) {
    console.error('[staff/users POST]', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Username or email already exists' });
    }
    return res.status(500).json({ success: false, error: 'Failed to create staff' });
  }
});

// PATCH /api/staff/users/:id
router.patch('/users/:id', verifyStaffToken, requireStaffAdmin, async (req, res) => {
  try {
    const member = await StaffMember.findOne({ id: req.params.id });
    if (!member) {
      return res.status(404).json({ success: false, error: 'Staff not found' });
    }
    if (member.role !== 'staff') {
      return res.status(400).json({ success: false, error: 'Cannot edit admin account' });
    }

    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();
      if (!name) {
        return res.status(400).json({ success: false, error: 'Name is required' });
      }
      member.name = name;
      member.avatarInitials = initialsFromName(name);
    }

    if (req.body.username !== undefined) {
      const username = String(req.body.username).trim().toLowerCase();
      if (!username) {
        return res.status(400).json({ success: false, error: 'Username is required' });
      }
      const taken = await StaffMember.findOne({ username, id: { $ne: member.id } });
      if (taken) {
        return res.status(400).json({ success: false, error: 'Username already taken' });
      }
      member.username = username;
    }

    if (req.body.email !== undefined) {
      const email =
        String(req.body.email).trim() || `${member.username}@plantsingarden.com`;
      member.email = email.toLowerCase();
    }

    if (req.body.phone !== undefined) {
      member.phone = String(req.body.phone).trim();
    }

    if (req.body.active !== undefined) {
      member.active = Boolean(req.body.active);
    }

    if (req.body.jobRoles !== undefined) {
      const jobRoles = Array.isArray(req.body.jobRoles) ? req.body.jobRoles : [];
      if (!jobRoles.length) {
        return res.status(400).json({ success: false, error: 'Select at least one role' });
      }
      member.jobRoles = jobRoles;
    }

    await member.save();

    return res.status(200).json({
      success: true,
      data: member.toSafeJSON(),
    });
  } catch (error) {
    console.error('[staff/users PATCH]', error);
    return res.status(500).json({ success: false, error: 'Failed to update staff' });
  }
});

// POST /api/staff/users/:id/password
router.post('/users/:id/password', verifyStaffToken, requireStaffAdmin, async (req, res) => {
  try {
    const newPassword = String(req.body.newPassword || req.body.password || '').trim();
    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ success: false, error: 'Password must be at least 4 characters' });
    }

    const member = await StaffMember.findOne({ id: req.params.id }).select('+password');
    if (!member) {
      return res.status(404).json({ success: false, error: 'Staff not found' });
    }
    if (member.role !== 'staff') {
      return res.status(400).json({ success: false, error: 'Cannot reset admin password here' });
    }

    member.password = newPassword;
    await member.save();

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[staff/users password]', error);
    return res.status(500).json({ success: false, error: 'Failed to reset password' });
  }
});

module.exports = router;
