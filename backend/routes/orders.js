const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Create Order
router.post('/', async (req, res) => {
  try {
    const {
      customerId,
      items,
      address,
      paymentMethod,
      notes,
      giftWrap,
    } = req.body;

    // Validation
    if (!customerId || !items || items.length === 0 || !address || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Get store name from middleware
    const storeName = req.storeName || 'test';

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = Math.round(subtotal * 0.18 * 100) / 100;
    const shipping = subtotal >= 60 ? 0 : 50;
    const total = subtotal + tax + shipping + (giftWrap ? 10 : 0);

    // Create order object
    const orderData = {
      _id: new mongoose.Types.ObjectId(),
      customerId: new mongoose.Types.ObjectId(customerId),
      items: items.map(item => ({
        _id: new mongoose.Types.ObjectId(),
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        sizeVariant: item.sizeVariant,
        potVariant: item.potVariant,
      })),
      address,
      shippingAddress: address,
      paymentMethod,
      paymentStatus: 'pending', // COD is pending until delivered
      orderStatus: 'pending',
      subtotal,
      tax,
      shipping,
      total,
      notes,
      giftWrap,
      storeName,
      orderNumber: `ORDER-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert directly into MongoDB (no model needed for now)
    const db = mongoose.connection.db;
    const result = await db.collection('orders').insertOne(orderData);

    console.log('✅ Order created:', orderData.orderNumber);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: {
        _id: orderData._id,
        orderNumber: orderData.orderNumber,
        total: orderData.total,
        status: orderData.orderStatus,
      },
    });
  } catch (error) {
    console.error('❌ Order creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get Orders for Store (Admin)
router.get('/', async (req, res) => {
  try {
    const storeName = req.storeName || 'test';

    const db = mongoose.connection.db;
    const orders = await db
      .collection('orders')
      .find({ storeName })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error('❌ Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get Single Order
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const storeName = req.storeName || 'test';

    const db = mongoose.connection.db;
    const order = await db.collection('orders').findOne({
      _id: new mongoose.Types.ObjectId(orderId),
      storeName,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('❌ Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get Customer Orders
router.get('/customer/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;

    const db = mongoose.connection.db;
    const orders = await db
      .collection('orders')
      .find({ customerId: new mongoose.Types.ObjectId(customerId) })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error('❌ Error fetching customer orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Update Order Status (Admin only)
router.patch('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus, paymentStatus } = req.body;
    const storeName = req.storeName || 'test';

    const db = mongoose.connection.db;
    const result = await db.collection('orders').updateOne(
      {
        _id: new mongoose.Types.ObjectId(orderId),
        storeName,
      },
      {
        $set: {
          ...(orderStatus && { orderStatus }),
          ...(paymentStatus && { paymentStatus }),
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.json({
      success: true,
      message: 'Order updated',
    });
  } catch (error) {
    console.error('❌ Error updating order:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

module.exports = router;
