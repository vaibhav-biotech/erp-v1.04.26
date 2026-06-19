const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const StaffMember = require('../models/StaffMember');
const StaffAttendanceRecord = require('../models/StaffAttendanceRecord');
const StaffTaskRecord = require('../models/StaffTaskRecord');
const StaffContactRecord = require('../models/StaffContactRecord');
const StaffCallLogRecord = require('../models/StaffCallLogRecord');
const { ensureStaffDemoUsersOnce } = require('../services/staffSeed');
const { ensureStaffDataOnce } = require('../services/staffDataSeed');

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
    { id: member.id, role: member.role, type: 'staff_folder', storeName: member.storeName },
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
    req.staffStoreName = decoded.storeName;
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
    await ensureStaffDataOnce();

    const storeName = req.storeName || 'plantsingarden';
    const member = await StaffMember.findOne({
      $or: [{ username: loginId }, { email: loginId }],
      storeName,
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
    const storeName = req.staffStoreName || 'plantsingarden';
    const members = await StaffMember.find({ storeName }).sort({ name: 1 });
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

    const storeName = req.staffStoreName || 'plantsingarden';
    const exists = await StaffMember.findOne({ username, storeName });
    if (exists) {
      return res.status(400).json({ success: false, error: 'Username already exists' });
    }

    const email =
      String(req.body.email || '').trim() || `${username}@plantsingarden.com`;
    const emailTaken = await StaffMember.findOne({ email: email.toLowerCase(), storeName });
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
      storeName,
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
    const storeName = req.staffStoreName || 'plantsingarden';
    const member = await StaffMember.findOne({ id: req.params.id, storeName });
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
      const taken = await StaffMember.findOne({ username, id: { $ne: member.id }, storeName });
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

    const storeName = req.staffStoreName || 'plantsingarden';
    const member = await StaffMember.findOne({ id: req.params.id, storeName }).select('+password');
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

const ATTENDANCE_STATUSES = ['present', 'absent', 'holiday', 'leave', 'half_day'];
const TASK_STATUSES = ['pending', 'in_progress', 'done'];
const WORK_TYPES = ['social_media', 'whatsapp', 'sales', 'operations'];

// GET /api/staff/attendance
router.get('/attendance', verifyStaffToken, async (req, res) => {
  try {
    await ensureStaffDataOnce();
    const storeName = req.staffStoreName || 'plantsingarden';
    const records = await StaffAttendanceRecord.find({ storeName }).sort({ date: 1 });
    return res.status(200).json({
      success: true,
      data: records.map((r) => ({
        staffId: r.staffId,
        date: r.date,
        status: r.status,
      })),
    });
  } catch (error) {
    console.error('[staff/attendance GET]', error);
    return res.status(500).json({ success: false, error: 'Failed to load attendance' });
  }
});

// PUT /api/staff/attendance
router.put('/attendance', verifyStaffToken, requireStaffAdmin, async (req, res) => {
  try {
    const staffId = String(req.body.staffId || '').trim();
    const date = String(req.body.date || '').trim();
    const status = String(req.body.status || '').trim();

    if (!staffId || !date || !status) {
      return res.status(400).json({ success: false, error: 'staffId, date, and status are required' });
    }
    if (!ATTENDANCE_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid attendance status' });
    }

    const storeName = req.staffStoreName || 'plantsingarden';
    const member = await StaffMember.findOne({ id: staffId, storeName });
    if (!member) {
      return res.status(404).json({ success: false, error: 'Staff member not found' });
    }

    const record = await StaffAttendanceRecord.findOneAndUpdate(
      { staffId, date, storeName },
      { staffId, date, status, storeName },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      data: { staffId: record.staffId, date: record.date, status: record.status },
    });
  } catch (error) {
    console.error('[staff/attendance PUT]', error);
    return res.status(500).json({ success: false, error: 'Failed to save attendance' });
  }
});

// GET /api/staff/tasks
router.get('/tasks', verifyStaffToken, async (req, res) => {
  try {
    await ensureStaffDataOnce();
    const storeName = req.staffStoreName || 'plantsingarden';
    const tasks = await StaffTaskRecord.find({ storeName }).sort({ scheduledDate: -1, createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: tasks.map((t) => t.toClientJSON()),
    });
  } catch (error) {
    console.error('[staff/tasks GET]', error);
    return res.status(500).json({ success: false, error: 'Failed to load tasks' });
  }
});

// POST /api/staff/tasks
router.post('/tasks', verifyStaffToken, async (req, res) => {
  try {
    const title = String(req.body.title || '').trim();
    const assigneeId = String(req.body.assigneeId || '').trim();
    const workType = String(req.body.workType || '').trim();
    const scheduledDate = String(req.body.scheduledDate || '').trim();
    const createdById = String(req.body.createdById || req.staffId).trim();

    if (!title) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }
    if (!assigneeId || !scheduledDate) {
      return res.status(400).json({ success: false, error: 'Assignee and date are required' });
    }
    if (!WORK_TYPES.includes(workType)) {
      return res.status(400).json({ success: false, error: 'Invalid work type' });
    }

    const isAdmin = req.staffRole === 'staff_admin';
    if (!isAdmin && assigneeId !== req.staffId) {
      return res.status(403).json({ success: false, error: 'Can only create tasks for yourself' });
    }

    const storeName = req.staffStoreName || 'plantsingarden';
    const assignee = await StaffMember.findOne({ id: assigneeId, storeName });
    if (!assignee || assignee.role !== 'staff' || !assignee.active) {
      return res.status(400).json({ success: false, error: 'Invalid assignee' });
    }

    const id = String(req.body.id || `t-${Date.now()}`).trim();
    const status = TASK_STATUSES.includes(req.body.status) ? req.body.status : 'pending';

    const task = await StaffTaskRecord.create({
      id,
      title,
      description: String(req.body.description || '').trim(),
      assigneeId,
      workType,
      scheduledDate,
      scheduledTime: String(req.body.scheduledTime || '').trim(),
      status,
      createdById,
      storeName,
    });

    return res.status(201).json({
      success: true,
      data: task.toClientJSON(),
    });
  } catch (error) {
    console.error('[staff/tasks POST]', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Task id already exists' });
    }
    return res.status(500).json({ success: false, error: 'Failed to create task' });
  }
});

// PATCH /api/staff/tasks/:id
router.patch('/tasks/:id', verifyStaffToken, async (req, res) => {
  try {
    const storeName = req.staffStoreName || 'plantsingarden';
    const task = await StaffTaskRecord.findOne({ id: req.params.id, storeName });
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const isAdmin = req.staffRole === 'staff_admin';
    if (!isAdmin && task.assigneeId !== req.staffId) {
      return res.status(403).json({ success: false, error: 'Not allowed to edit this task' });
    }

    if (req.body.status !== undefined) {
      const status = String(req.body.status).trim();
      if (!TASK_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid status' });
      }
      task.status = status;
    }

    if (req.body.assigneeId !== undefined) {
      if (!isAdmin) {
        return res.status(403).json({ success: false, error: 'Only admin can reassign tasks' });
      }
      const assigneeId = String(req.body.assigneeId).trim();
      const assignee = await StaffMember.findOne({ id: assigneeId, storeName });
      if (!assignee || assignee.role !== 'staff' || !assignee.active) {
        return res.status(400).json({ success: false, error: 'Invalid assignee' });
      }
      task.assigneeId = assigneeId;
    }

    await task.save();

    return res.status(200).json({
      success: true,
      data: task.toClientJSON(),
    });
  } catch (error) {
    console.error('[staff/tasks PATCH]', error);
    return res.status(500).json({ success: false, error: 'Failed to update task' });
  }
});

const CONTACT_STATUSES = ['new', 'contacted', 'callback', 'interested', 'not_interested'];
const CALL_OUTCOMES = ['answered', 'no_answer', 'busy', 'wrong_number', 'callback', 'converted', 'create_order'];

// GET /api/staff/contacts
router.get('/contacts', verifyStaffToken, async (req, res) => {
  try {
    await ensureStaffDataOnce();
    const storeName = req.staffStoreName || 'plantsingarden';
    const contacts = await StaffContactRecord.find({ storeName }).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: contacts.map((c) => c.toClientJSON()),
    });
  } catch (error) {
    console.error('[staff/contacts GET]', error);
    return res.status(500).json({ success: false, error: 'Failed to load contacts' });
  }
});

// POST /api/staff/contacts
router.post('/contacts', verifyStaffToken, async (req, res) => {
  try {
    const storeName = req.staffStoreName || 'plantsingarden';
    const isAdmin = req.staffRole === 'staff_admin';
    const assignedToId = String(req.body.assignedToId || req.staffId).trim();

    if (!isAdmin && assignedToId !== req.staffId) {
      return res.status(403).json({ success: false, error: 'Can only assign contacts to yourself' });
    }

    const assignee = await StaffMember.findOne({ id: assignedToId, storeName });
    if (!assignee || assignee.role !== 'staff' || !assignee.active) {
      return res.status(400).json({ success: false, error: 'Invalid assignee' });
    }

    const contact = await StaffContactRecord.create({
      id: String(req.body.id || `c-${Date.now()}`).trim(),
      name: String(req.body.name || '').trim(),
      phone: String(req.body.phone || '').trim(),
      email: String(req.body.email || '').trim(),
      city: String(req.body.city || '').trim(),
      notes: String(req.body.notes || '').trim(),
      status: CONTACT_STATUSES.includes(req.body.status) ? req.body.status : 'new',
      assignedToId,
      createdAtDate: String(req.body.createdAt || new Date().toISOString().slice(0, 10)).trim(),
      source: req.body.source === 'bulk_upload' ? 'bulk_upload' : 'manual',
      storeName,
    });

    return res.status(201).json({
      success: true,
      data: contact.toClientJSON(),
    });
  } catch (error) {
    console.error('[staff/contacts POST]', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Contact ID already exists' });
    }
    return res.status(500).json({ success: false, error: 'Failed to create contact' });
  }
});

// PATCH /api/staff/contacts/:id
router.patch('/contacts/:id', verifyStaffToken, async (req, res) => {
  try {
    const storeName = req.staffStoreName || 'plantsingarden';
    const contact = await StaffContactRecord.findOne({ id: req.params.id, storeName });
    if (!contact) {
      return res.status(404).json({ success: false, error: 'Contact not found' });
    }

    const isAdmin = req.staffRole === 'staff_admin';
    if (!isAdmin && contact.assignedToId !== req.staffId) {
      return res.status(403).json({ success: false, error: 'Not allowed to edit this contact' });
    }

    if (req.body.status !== undefined) {
      const status = String(req.body.status).trim();
      if (!CONTACT_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid status' });
      }
      contact.status = status;
    }

    if (req.body.assignedToId !== undefined) {
      if (!isAdmin) {
        return res.status(403).json({ success: false, error: 'Only admin can reassign contacts' });
      }
      const assignedToId = String(req.body.assignedToId).trim();
      const assignee = await StaffMember.findOne({ id: assignedToId, storeName });
      if (!assignee || assignee.role !== 'staff' || !assignee.active) {
        return res.status(400).json({ success: false, error: 'Invalid assignee' });
      }
      contact.assignedToId = assignedToId;
    }

    if (req.body.name !== undefined) contact.name = String(req.body.name).trim();
    if (req.body.phone !== undefined) contact.phone = String(req.body.phone).trim();
    if (req.body.email !== undefined) contact.email = String(req.body.email).trim();
    if (req.body.city !== undefined) contact.city = String(req.body.city).trim();
    if (req.body.notes !== undefined) contact.notes = String(req.body.notes).trim();

    await contact.save();

    return res.status(200).json({
      success: true,
      data: contact.toClientJSON(),
    });
  } catch (error) {
    console.error('[staff/contacts PATCH]', error);
    return res.status(500).json({ success: false, error: 'Failed to update contact' });
  }
});

// POST /api/staff/contacts/bulk
router.post('/contacts/bulk', verifyStaffToken, async (req, res) => {
  try {
    const storeName = req.staffStoreName || 'plantsingarden';
    const isAdmin = req.staffRole === 'staff_admin';
    const contactsInput = Array.isArray(req.body.contacts) ? req.body.contacts : [];

    if (!contactsInput.length) {
      return res.status(400).json({ success: false, error: 'No contacts provided' });
    }

    const contactsToInsert = [];
    for (const c of contactsInput) {
      const assignedToId = String(c.assignedToId || req.staffId).trim();
      
      // Basic validation
      if (!isAdmin && assignedToId !== req.staffId) {
        continue; // skip unauthorized assignment
      }

      contactsToInsert.push({
        id: String(c.id || `c-${Date.now()}-${Math.random()}`).trim(),
        name: String(c.name || '').trim(),
        phone: String(c.phone || '').trim(),
        email: String(c.email || '').trim(),
        city: String(c.city || '').trim(),
        notes: String(c.notes || '').trim(),
        status: CONTACT_STATUSES.includes(c.status) ? c.status : 'new',
        assignedToId,
        createdAtDate: String(c.createdAt || new Date().toISOString().slice(0, 10)).trim(),
        source: c.source === 'bulk_upload' ? 'bulk_upload' : 'manual',
        storeName,
      });
    }

    if (!contactsToInsert.length) {
      return res.status(400).json({ success: false, error: 'No valid contacts to insert' });
    }

    const inserted = await StaffContactRecord.insertMany(contactsToInsert, { ordered: false });

    return res.status(201).json({
      success: true,
      data: inserted.map(c => c.toClientJSON()),
    });
  } catch (error) {
    console.error('[staff/contacts/bulk POST]', error);
    // Ignore duplicate key errors for bulk
    if (error.code === 11000) {
      return res.status(201).json({ success: true, warning: 'Some duplicates ignored' });
    }
    return res.status(500).json({ success: false, error: 'Failed to bulk import contacts' });
  }
});

// POST /api/staff/contacts/bulk-assign
router.post('/contacts/bulk-assign', verifyStaffToken, requireStaffAdmin, async (req, res) => {
  try {
    const storeName = req.staffStoreName || 'plantsingarden';
    const contactIds = Array.isArray(req.body.contactIds) ? req.body.contactIds : [];
    const assignedToId = String(req.body.assignedToId || '').trim();

    if (!contactIds.length || !assignedToId) {
      return res.status(400).json({ success: false, error: 'Contact IDs and Assignee ID required' });
    }

    const assignee = await StaffMember.findOne({ id: assignedToId, storeName });
    if (!assignee || assignee.role !== 'staff' || !assignee.active) {
      return res.status(400).json({ success: false, error: 'Invalid assignee' });
    }

    await StaffContactRecord.updateMany(
      { id: { $in: contactIds }, storeName },
      { $set: { assignedToId } }
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[staff/contacts/bulk-assign POST]', error);
    return res.status(500).json({ success: false, error: 'Failed to bulk assign contacts' });
  }
});

// GET /api/staff/call-logs
router.get('/call-logs', verifyStaffToken, async (req, res) => {
  try {
    await ensureStaffDataOnce();
    const storeName = req.staffStoreName || 'plantsingarden';
    const logs = await StaffCallLogRecord.find({ storeName }).sort({ calledAt: -1 });
    return res.status(200).json({
      success: true,
      data: logs.map((l) => l.toClientJSON()),
    });
  } catch (error) {
    console.error('[staff/call-logs GET]', error);
    return res.status(500).json({ success: false, error: 'Failed to load call logs' });
  }
});

// POST /api/staff/call-logs
router.post('/call-logs', verifyStaffToken, async (req, res) => {
  try {
    const storeName = req.staffStoreName || 'plantsingarden';
    const contactId = String(req.body.contactId || '').trim();
    const staffId = String(req.body.staffId || '').trim();

    if (!contactId || !staffId) {
      return res.status(400).json({ success: false, error: 'Contact ID and Staff ID are required' });
    }

    const log = await StaffCallLogRecord.create({
      id: String(req.body.id || `cl-${Date.now()}`).trim(),
      contactId,
      staffId,
      calledAt: String(req.body.calledAt || new Date().toISOString()).trim(),
      outcome: CALL_OUTCOMES.includes(req.body.outcome) ? req.body.outcome : 'no_answer',
      orderStoreId: req.body.orderStoreId ? String(req.body.orderStoreId).trim() : undefined,
      durationMinutes: req.body.durationMinutes ? Number(req.body.durationMinutes) : undefined,
      notes: String(req.body.notes || '').trim(),
      storeName,
    });

    return res.status(201).json({
      success: true,
      data: log.toClientJSON(),
    });
  } catch (error) {
    console.error('[staff/call-logs POST]', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Call log already exists' });
    }
    return res.status(500).json({ success: false, error: 'Failed to create call log' });
  }
});

module.exports = router;
