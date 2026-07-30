const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const auth = require('../middleware/auth'); // assuming this verifies customer token

// Get user's cart
router.get('/', auth, async (req, res) => {
  try {
    const customerId = req.user.id || req.user._id;
    let cart = await Cart.findOne({ customerId });
    
    if (!cart) {
      cart = new Cart({ customerId, items: [] });
      await cart.save();
    }
    
    res.json({ success: true, data: cart });
  } catch (error) {
    console.error('Fetch cart error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch cart' });
  }
});

// Sync cart (overwrite items)
router.post('/', auth, async (req, res) => {
  try {
    const customerId = req.user.id || req.user._id;
    const { items, storeName } = req.body;
    
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Invalid items format' });
    }

    // Reset recoveryEmailSent if items change
    const updateData = {
      items,
      lastUpdatedAt: Date.now(),
      recoveryEmailSent: false
    };

    if (storeName) {
      updateData.storeName = storeName;
    }

    const cart = await Cart.findOneAndUpdate(
      { customerId },
      { $set: updateData },
      { new: true, upsert: true }
    );
    
    res.json({ success: true, data: cart });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ success: false, message: 'Failed to sync cart' });
  }
});

// Sync cart endpoint for empty cart (clear)
router.delete('/', auth, async (req, res) => {
  try {
    const customerId = req.user.id || req.user._id;
    await Cart.findOneAndUpdate(
      { customerId },
      { $set: { items: [], lastUpdatedAt: Date.now(), recoveryEmailSent: false } }
    );
    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ success: false, message: 'Failed to clear cart' });
  }
});

module.exports = router;
