const express = require('express');
const router = express.Router();
const verifyAdminToken = require('../middleware/verifyAdminToken');
const Notification = require('../models/Notification');

// Get notifications for the logged in user
router.get('/', verifyAdminToken, async (req, res) => {
  try {
    const { role, id, storeName } = req.user;
    
    let filter = {};
    
    // If superadmin, see everything directed at superadmin
    if (role === 'superadmin') {
      filter = { targetRoles: 'superadmin' };
    } else if (role === 'accountant') {
      filter = { targetRoles: 'accountant' };
    } else if (role === 'store_admin') {
      // Need to find the store's ID if we want strict matching, or just match role
      // For now, match store_admin
      filter = { targetRoles: 'store_admin' };
    } else {
      // Default empty
      return res.json({ success: true, data: [] });
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(50);
      
    // Map to include 'isRead' for this specific user
    const data = notifications.map(n => {
      const isRead = n.readBy && n.readBy.includes(id);
      return { ...n.toObject(), isRead };
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark notification as read
router.put('/:id/read', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.user;
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ success: false, error: 'Notification not found' });
    
    if (!notification.readBy.includes(id)) {
      notification.readBy.push(id);
      await notification.save();
    }
    
    res.json({ success: true, message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark all as read
router.put('/read-all', verifyAdminToken, async (req, res) => {
  try {
    const { role, id } = req.user;
    let filter = { targetRoles: role };
    
    // We can't do a bulk update to push to an array easily in older mongo without updateMany $addToSet
    await Notification.updateMany(
      filter,
      { $addToSet: { readBy: id } }
    );
    
    res.json({ success: true, message: 'All marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
