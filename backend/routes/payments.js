const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Store = require('../models/Store');
const PaymentGateway = require('../models/PaymentGateway');
const Notification = require('../models/Notification');

// Initialize Razorpay instance dynamically based on gateway
const getRazorpayInstance = (gateway) => {
  if (!gateway || gateway.provider !== 'razorpay' || !gateway.isActive) {
    throw new Error('Razorpay gateway is not configured or is inactive for this store');
  }
  return new Razorpay({
    key_id: gateway.keyId,
    key_secret: gateway.keySecret
  });
};

// Create a Razorpay Order
router.post('/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR' } = req.body;
    const storeName = req.storeName;

    if (!storeName || !amount) {
      return res.status(400).json({ success: false, error: 'Store name and amount are required' });
    }

    const store = await Store.findOne({ storeName }).populate('paymentGateway');
    if (!store) {
      return res.status(404).json({ success: false, error: 'Store not found' });
    }

    let gateway = store.paymentGateway;

    // Fallback to global gateway if store doesn't have one
    if (!gateway) {
      gateway = await PaymentGateway.findOne({ isActive: true, provider: 'razorpay' });
    }

    if (!gateway) {
      return res.status(400).json({ success: false, error: 'No active payment gateway found for this store' });
    }

    const razorpay = getRazorpayInstance(gateway);

    const options = {
      amount: Math.round(amount * 100), // amount in the smallest currency unit
      currency,
      receipt: `rcpt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      data: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: gateway.keyId // frontend needs this to initialize checkout
      }
    });
  } catch (error) {
    console.error('Create Razorpay Order Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verify Payment
router.post('/verify', async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      dbOrderId // our internal order _id
    } = req.body;
    const storeName = req.storeName;

    const store = await Store.findOne({ storeName }).populate('paymentGateway');
    let gateway = store.paymentGateway;
    if (!gateway) {
      gateway = await PaymentGateway.findOne({ isActive: true, provider: 'razorpay' });
    }
    
    if (!gateway) throw new Error('Gateway not found');

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', gateway.keySecret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      // Payment is authentic
      
      // Update the order
      if (dbOrderId) {
        await Order.findByIdAndUpdate(dbOrderId, {
          paymentStatus: 'Paid',
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          paymentDate: new Date()
        });

        // Trigger Notification
        await Notification.create({
          title: 'New Online Payment',
          message: `Payment of success for Order ID: ${dbOrderId}`,
          type: 'payment_success',
          targetRoles: ['superadmin', 'accountant'],
          targetStore: store._id,
          metadata: { dbOrderId, razorpayPaymentId: razorpay_payment_id }
        });
        
        // TODO: Email trigger goes here if Settings allow
      }

      res.json({ success: true, message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ success: false, error: 'Invalid signature' });
    }
  } catch (error) {
    console.error('Verify Payment Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
