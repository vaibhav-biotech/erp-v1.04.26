const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Admin = require('../models/Admin');
const StaffMember = require('../models/StaffMember');
const multer = require('multer');

// Middleware to parse auth token and verify staff/admin roles
const verifyAdminToken = require('../middleware/verifyAdminToken');

// Get all conversations for a user
router.get('/conversations/:userId', verifyAdminToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find conversations where this user is a participant
    const conversations = await Conversation.find({
      'participants.userId': new mongoose.Types.ObjectId(userId)
    })
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

    res.json({ success: true, data: conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch conversations' });
  }
});

// Get messages for a specific conversation
router.get('/:conversationId/messages', verifyAdminToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.skip) || 0;

    const messages = await Message.find({ conversationId: new mongoose.Types.ObjectId(conversationId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ success: true, data: messages.reverse() });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
});

// Start a new conversation
router.post('/conversations', verifyAdminToken, async (req, res) => {
  try {
    const { senderId, senderModel, senderName, receiverId, receiverModel, receiverName } = req.body;

    if (!senderId || !receiverId) {
      return res.status(400).json({ success: false, error: 'Missing user IDs' });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      $and: [
        { 'participants.userId': new mongoose.Types.ObjectId(senderId) },
        { 'participants.userId': new mongoose.Types.ObjectId(receiverId) }
      ]
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [
          { userId: new mongoose.Types.ObjectId(senderId), userModel: senderModel, name: senderName },
          { userId: new mongoose.Types.ObjectId(receiverId), userModel: receiverModel, name: receiverName }
        ]
      });
      await conversation.save();
    }

    res.json({ success: true, data: conversation });
  } catch (error) {
    console.error('Error starting conversation:', error);
    res.status(500).json({ success: false, error: 'Failed to start conversation' });
  }
});

// Search contacts (Admin + Staff)
router.get('/contacts', verifyAdminToken, async (req, res) => {
  try {
    const query = req.query.q ? String(req.query.q).toLowerCase() : '';
    
    // Build Admin Query
    const adminConditions = [{ isActive: true }];
    if (req.storeName) {
      adminConditions.push({
        $or: [
          { storeName: req.storeName },
          { 'permissions.canAccessAllStores': true },
          { role: 'super_admin' },
          { storeName: '' },
          { storeName: null }
        ]
      });
    }
    if (query) {
      adminConditions.push({
        $or: [
          { firstName: new RegExp(query, 'i') },
          { lastName: new RegExp(query, 'i') },
          { email: new RegExp(query, 'i') }
        ]
      });
    }

    const admins = await Admin.find({ $and: adminConditions }).select('_id firstName lastName email role');

    // Build Staff Query
    const staffConditions = [{ active: true }];
    if (req.storeName) {
      staffConditions.push({
        $or: [
          { storeName: req.storeName },
          { storeName: '' },
          { storeName: null },
          { storeName: { $exists: false } }
        ]
      });
    }
    if (query) {
      staffConditions.push({
        $or: [
          { name: new RegExp(query, 'i') },
          { email: new RegExp(query, 'i') }
        ]
      });
    }

    const staff = await StaffMember.find({ $and: staffConditions }).select('_id name email role');

    const mappedAdmins = admins.map(a => ({
      _id: a._id,
      name: `${a.firstName} ${a.lastName}`.trim(),
      email: a.email,
      role: a.role,
      userModel: 'Admin'
    }));

    const mappedStaff = staff.map(s => ({
      _id: s._id,
      name: s.name,
      email: s.email,
      role: s.role,
      userModel: 'StaffMember'
    }));

    res.json({ success: true, data: [...mappedAdmins, ...mappedStaff] });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch contacts' });
  }
});

module.exports = router;
