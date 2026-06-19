const express = require('express');
const router = express.Router();
const verifyAdminToken = require('../middleware/verifyAdminToken');
const Store = require('../models/Store');
const StaffAttendanceRecord = require('../models/StaffAttendanceRecord');
const StaffTaskRecord = require('../models/StaffTaskRecord');
const StaffCallLogRecord = require('../models/StaffCallLogRecord');
const crypto = require('crypto');
const Customer = require('../models/Customer');
const mongoose = require('mongoose');

// Middleware to ensure user is super_admin
const requireSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'super_admin') {
    next();
  } else {
    return res.status(403).json({ success: false, error: 'Access denied: Super Admin only' });
  }
};

// Apply middlewares to all routes in this file
router.use(verifyAdminToken);
router.use(requireSuperAdmin);

// ==========================================
// 1. DASHBOARD ANALYTICS
// ==========================================
router.get('/dashboard-stats', async (req, res) => {
  try {
    const totalStores = await Store.countDocuments();
    const totalCustomers = await Customer.countDocuments();
    
    const db = mongoose.connection.db;
    const orders = await db.collection('orders').find({ paymentStatus: 'paid' }).toArray();
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || order.total || 0), 0);

    return res.status(200).json({
      success: true,
      data: {
        totalStores,
        totalCustomers,
        totalOrders,
        totalRevenue
      }
    });
  } catch (error) {
    console.error('[Superadmin Dashboard Stats Error]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 2. STORES CRUD
// ==========================================

// Get all stores
router.get('/stores', async (req, res) => {
  try {
    const stores = await Store.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: stores });
  } catch (error) {
    console.error('[Superadmin Get Stores Error]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Create a new store
router.post('/stores', async (req, res) => {
  try {
    const { name, storeName, domain } = req.body;
    
    if (!name || !storeName) {
      return res.status(400).json({ success: false, error: 'Name and unique storeName are required' });
    }

    const normalizedStoreName = storeName.toLowerCase().trim().replace(/\s+/g, '');

    const existing = await Store.findOne({ storeName: normalizedStoreName });
    if (existing) {
      return res.status(400).json({ success: false, error: 'A store with this identifier already exists' });
    }

    const newStore = new Store({
      name,
      storeName: normalizedStoreName,
      domain,
      taxSettings: { enabled: false, rate: 18 },
      giftWrapOptions: [],
      status: 'active'
    });

    await newStore.save();
    return res.status(201).json({ success: true, data: newStore });
  } catch (error) {
    console.error('[Superadmin Create Store Error]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 3. ADMINS CRUD
// ==========================================

// Get all admins
router.get('/admins', async (req, res) => {
  try {
    const Admin = require('../models/Admin');
    const admins = await Admin.find().select('-password').sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: admins });
  } catch (error) {
    console.error('[Superadmin Get Admins Error]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Create a new store admin
router.post('/admins', async (req, res) => {
  try {
    const Admin = require('../models/Admin');
    const { firstName, lastName, email, password, storeName, role } = req.body;
    
    if (!firstName || !lastName || !email || !password || !storeName) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ success: false, error: 'An admin with this email already exists' });
    }

    const newAdmin = new Admin({
      firstName,
      lastName,
      email,
      password,
      storeName: storeName.toLowerCase().trim().replace(/\s+/g, ''),
      role: role || 'store_admin',
      isActive: true
    });

    await newAdmin.save();
    
    const adminObj = newAdmin.toObject();
    delete adminObj.password;
    
    return res.status(201).json({ success: true, data: adminObj });
  } catch (error) {
    console.error('[Superadmin Create Admin Error]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 4. STAFF CRUD
// ==========================================

// Get all staff across all stores
router.get('/staff', async (req, res) => {
  try {
    const StaffMember = require('../models/StaffMember');
    const staff = await StaffMember.find().select('-password').sort({ storeName: 1, createdAt: -1 });
    return res.status(200).json({ success: true, data: staff });
  } catch (error) {
    console.error('[Superadmin Get Staff Error]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});


// Create a new staff member
router.post('/staff', async (req, res) => {
  try {
    const StaffMember = require('../models/StaffMember');
    const { name, username, password, role, storeName } = req.body;
    
    if (!name || !username || !password || !role || !storeName) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    const existingStaff = await StaffMember.findOne({ username });
    if (existingStaff) {
      return res.status(400).json({ success: false, error: 'A staff member with this username already exists' });
    }

    const newStaff = new StaffMember({
      id: crypto.randomUUID(),
      name,
      username,
      email: `${username}@${storeName.toLowerCase().trim().replace(/\s+/g, '')}.com`, // Mock email since frontend doesn't send it
      password,
      role: 'staff', // Schema restricts to staff or staff_admin
      jobRoles: [role], // Use jobRoles for frontend's role
      storeName: storeName.toLowerCase().trim().replace(/\s+/g, ''),
      active: true
    });

    await newStaff.save();
    
    const staffObj = newStaff.toObject();
    delete staffObj.password;
    
    return res.status(201).json({ success: true, data: staffObj });
  } catch (error) {
    console.error('[Superadmin Create Staff Error]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Update a staff member
router.put('/staff/:id', async (req, res) => {
  try {
    const StaffMember = require('../models/StaffMember');
    const { name, username, role, storeName, status, password } = req.body;
    
    const staff = await StaffMember.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, error: 'Staff member not found' });
    }

    if (name) staff.name = name;
    if (username) staff.username = username;
    if (role) staff.jobRoles = [role];
    if (storeName) staff.storeName = storeName.toLowerCase().trim().replace(/\s+/g, '');
    if (status) staff.active = (status === 'active');
    if (password) staff.password = password;

    await staff.save();
    
    const staffObj = staff.toObject();
    delete staffObj.password;
    
    return res.status(200).json({ success: true, data: staffObj });
  } catch (error) {
    console.error('[Superadmin Update Staff Error]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Delete a staff member
router.delete('/staff/:id', async (req, res) => {
  try {
    const StaffMember = require('../models/StaffMember');
    const staff = await StaffMember.findByIdAndDelete(req.params.id);
    
    if (!staff) {
      return res.status(404).json({ success: false, error: 'Staff member not found' });
    }
    
    return res.status(200).json({ success: true, data: { _id: req.params.id } });
  } catch (error) {
    console.error('[Superadmin Delete Staff Error]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});


// Get staff attendance
router.get('/staff/:id/attendance', async (req, res) => {
  try {
    const StaffMember = require('../models/StaffMember');
    const staff = await StaffMember.findById(req.params.id);
    if (!staff) return res.status(404).json({ success: false, error: 'Staff member not found' });

    const attendance = await StaffAttendanceRecord.find({ staffId: staff.id }).sort({ date: -1 }).limit(30);
    return res.status(200).json({ success: true, data: attendance });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Get staff tasks
router.get('/staff/:id/tasks', async (req, res) => {
  try {
    const StaffMember = require('../models/StaffMember');
    const staff = await StaffMember.findById(req.params.id);
    if (!staff) return res.status(404).json({ success: false, error: 'Staff member not found' });

    const tasks = await StaffTaskRecord.find({ assigneeId: staff.id }).sort({ createdAt: -1 }).limit(50);
    const mappedTasks = tasks.map(t => t.toClientJSON());
    return res.status(200).json({ success: true, data: mappedTasks });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Get staff analytics (across all stores)
router.get('/staff-analytics', async (req, res) => {
  try {
    const StaffMember = require('../models/StaffMember');
    const staffMembers = await StaffMember.find({ active: true });
    
    // Convert to map for easy grouping
    const staffMap = {};
    staffMembers.forEach(sm => {
      staffMap[sm.id] = {
        name: sm.name,
        username: sm.username,
        storeName: sm.storeName,
        totalTasks: 0,
        completedTasks: 0,
        totalCalls: 0,
        convertedCalls: 0,
      };
    });

    const tasks = await StaffTaskRecord.find({});
    tasks.forEach(t => {
      const assigneeId = t.assigneeId;
      if (staffMap[assigneeId]) {
        staffMap[assigneeId].totalTasks += 1;
        if (t.status === 'done') {
          staffMap[assigneeId].completedTasks += 1;
        }
      }
    });

    const calls = await StaffCallLogRecord.find({});
    calls.forEach(c => {
      const staffId = c.staffId;
      if (staffMap[staffId]) {
        staffMap[staffId].totalCalls += 1;
        if (c.outcome === 'create_order' || c.outcome === 'interested') {
          staffMap[staffId].convertedCalls += 1;
        }
      }
    });

    let globalTotalTasks = 0;
    let globalCompletedTasks = 0;
    let globalTotalCalls = 0;
    let globalConvertedCalls = 0;

    const staffLeaderboard = Object.values(staffMap);
    staffLeaderboard.forEach(s => {
      globalTotalTasks += s.totalTasks;
      globalCompletedTasks += s.completedTasks;
      globalTotalCalls += s.totalCalls;
      globalConvertedCalls += s.convertedCalls;
    });

    return res.status(200).json({
      success: true,
      data: {
        global: {
          totalTasks: globalTotalTasks,
          completedTasks: globalCompletedTasks,
          totalCalls: globalTotalCalls,
          convertedCalls: globalConvertedCalls,
        },
        leaderboard: staffLeaderboard.sort((a, b) => b.completedTasks - a.completedTasks)
      }
    });
  } catch (error) {
    console.error('[Superadmin Staff Analytics Error]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});


// ==========================================
// 5. ALL ORDERS
// ==========================================

// Get all orders across all stores
router.get('/orders', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const orders = await db
      .collection('orders')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error('[Superadmin Get Orders Error]', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});


// Get single order by ID
router.get('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require('mongoose');
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order id' });
    }

    const db = mongoose.connection.db;
    const order = await db.collection('orders').findOne({ _id: new mongoose.Types.ObjectId(id) });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('[Superadmin Get Single Order Error]', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order details',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

module.exports = router;




