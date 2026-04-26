const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const ORDER_STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];
const PAYMENT_STATUS_OPTIONS = ['pending', 'paid', 'failed', 'refunded', 'cod_pending'];

const toObjectId = (value) => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
};

const formatOrderStatusLabel = (status) =>
  String(status || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatPaymentStatusLabel = (status) =>
  String(status || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

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
    const storeName = req.storeName || 'plants in garden';

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = Math.round(subtotal * 0.18 * 100) / 100;
    const shipping = subtotal >= 60 ? 0 : 50;
    const total = subtotal + tax + shipping + (giftWrap ? 10 : 0);

    // Create order object
    const now = new Date();
    const initialPaymentStatus = String(paymentMethod || '').toLowerCase() === 'cod' ? 'cod_pending' : 'pending';

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
      paymentStatus: initialPaymentStatus,
      orderStatus: 'pending',
      subtotal,
      tax,
      shipping,
      total,
      notes,
      giftWrap,
      storeName,
      orderNumber: `ORDER-${Date.now()}`,
      statusHistory: [
        {
          _id: new mongoose.Types.ObjectId(),
          status: 'pending',
          note: 'Order placed by customer',
          createdAt: now,
          visibility: 'customer',
        },
      ],
      paymentHistory: [
        {
          _id: new mongoose.Types.ObjectId(),
          status: initialPaymentStatus,
          note: `Payment status set to ${formatPaymentStatusLabel(initialPaymentStatus)}`,
          createdAt: now,
        },
      ],
      trackingUpdates: [],
      fulfillment: {
        assignedTo: null,
        packedAt: null,
        shippedAt: null,
        deliveredAt: null,
      },
      tracking: {
        courierName: null,
        trackingNumber: null,
        trackingUrl: null,
        estimatedDelivery: null,
      },
      invoice: {
        generated: false,
        invoiceNumber: null,
        generatedAt: null,
      },
      createdAt: now,
      updatedAt: now,
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
        orderId: orderData.orderNumber,
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
    const storeName = req.storeName || 'plants in garden';

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

// Get Customer Orders
router.get('/customer/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const storeName = req.storeName || 'plants in garden';
    const customerObjectId = toObjectId(customerId);

    if (!customerObjectId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer id',
      });
    }

    const db = mongoose.connection.db;
    const orders = await db
      .collection('orders')
      .find({
        customerId: customerObjectId,
        storeName,
      })
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

// Get Single Order
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const storeName = req.storeName || 'plants in garden';
    const orderObjectId = toObjectId(orderId);

    if (!orderObjectId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order id',
      });
    }

    const db = mongoose.connection.db;
    const order = await db.collection('orders').findOne({
      _id: orderObjectId,
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

// Update Order Status (Admin only)
router.patch('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const {
      orderStatus,
      paymentStatus,
      statusNote,
      paymentNote,
      trackingNumber,
      courierName,
      trackingUrl,
      estimatedDelivery,
      customerUpdate,
      internalNote,
      actor,
      fulfillment,
    } = req.body || {};
    const storeName = req.storeName || 'plants in garden';
    const orderObjectId = toObjectId(orderId);

    if (!orderObjectId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order id',
      });
    }

    const normalizedOrderStatus = orderStatus ? String(orderStatus).toLowerCase() : null;
    const normalizedPaymentStatus = paymentStatus ? String(paymentStatus).toLowerCase() : null;

    if (normalizedOrderStatus && !ORDER_STATUS_OPTIONS.includes(normalizedOrderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid orderStatus. Allowed: ${ORDER_STATUS_OPTIONS.join(', ')}`,
      });
    }

    if (normalizedPaymentStatus && !PAYMENT_STATUS_OPTIONS.includes(normalizedPaymentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid paymentStatus. Allowed: ${PAYMENT_STATUS_OPTIONS.join(', ')}`,
      });
    }

    const db = mongoose.connection.db;
    const existingOrder = await db.collection('orders').findOne({
      _id: orderObjectId,
      storeName,
    });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const now = new Date();
    const setPayload = {
      updatedAt: now,
    };
    const pushPayload = {
      trackingUpdates: [],
    };

    if (normalizedOrderStatus && normalizedOrderStatus !== existingOrder.orderStatus) {
      setPayload.orderStatus = normalizedOrderStatus;
      pushPayload.statusHistory = {
        _id: new mongoose.Types.ObjectId(),
        status: normalizedOrderStatus,
        note:
          statusNote ||
          customerUpdate ||
          `Order status updated to ${formatOrderStatusLabel(normalizedOrderStatus)}`,
        createdAt: now,
        visibility: 'customer',
        actor: actor || 'store_admin',
      };

      if (normalizedOrderStatus === 'packed') {
        setPayload['fulfillment.packedAt'] = now;
      }
      if (normalizedOrderStatus === 'shipped') {
        setPayload['fulfillment.shippedAt'] = now;
      }
      if (normalizedOrderStatus === 'delivered') {
        setPayload['fulfillment.deliveredAt'] = now;
        if (!normalizedPaymentStatus && String(existingOrder.paymentMethod || '').toLowerCase() === 'cod') {
          setPayload.paymentStatus = 'paid';
          pushPayload.paymentHistory = {
            _id: new mongoose.Types.ObjectId(),
            status: 'paid',
            note: 'COD order marked as paid on delivery',
            createdAt: now,
          };
        }
      }
    }

    if (normalizedPaymentStatus && normalizedPaymentStatus !== existingOrder.paymentStatus) {
      setPayload.paymentStatus = normalizedPaymentStatus;
      pushPayload.paymentHistory = {
        _id: new mongoose.Types.ObjectId(),
        status: normalizedPaymentStatus,
        note:
          paymentNote ||
          `Payment status updated to ${formatPaymentStatusLabel(normalizedPaymentStatus)}`,
        createdAt: now,
      };
    }

    if (trackingNumber !== undefined) setPayload['tracking.trackingNumber'] = trackingNumber || null;
    if (courierName !== undefined) setPayload['tracking.courierName'] = courierName || null;
    if (trackingUrl !== undefined) setPayload['tracking.trackingUrl'] = trackingUrl || null;
    if (estimatedDelivery !== undefined) {
      setPayload['tracking.estimatedDelivery'] = estimatedDelivery ? new Date(estimatedDelivery) : null;
    }

    if (fulfillment && typeof fulfillment === 'object') {
      if (fulfillment.assignedTo !== undefined) setPayload['fulfillment.assignedTo'] = fulfillment.assignedTo || null;
    }

    if (customerUpdate) {
      pushPayload.trackingUpdates.push({
        _id: new mongoose.Types.ObjectId(),
        message: customerUpdate,
        location: courierName || existingOrder?.tracking?.courierName || null,
        createdAt: now,
        visibility: 'customer',
      });
    }

    if (internalNote) {
      pushPayload.trackingUpdates.push({
        _id: new mongoose.Types.ObjectId(),
        message: internalNote,
        location: null,
        createdAt: now,
        visibility: 'internal',
      });
    }

    const updateQuery = { $set: setPayload };
    if (Object.keys(pushPayload).length > 0) {
      updateQuery.$push = {};
      if (pushPayload.statusHistory) {
        updateQuery.$push.statusHistory = pushPayload.statusHistory;
      }
      if (pushPayload.paymentHistory) {
        updateQuery.$push.paymentHistory = pushPayload.paymentHistory;
      }
      if (pushPayload.trackingUpdates.length > 0) {
        updateQuery.$push.trackingUpdates = { $each: pushPayload.trackingUpdates };
      }
    }

    const result = await db.collection('orders').updateOne(
      {
        _id: orderObjectId,
        storeName,
      },
      updateQuery
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

// Generate Invoice (Admin)
router.post('/:orderId/invoice', async (req, res) => {
  try {
    const { orderId } = req.params;
    const storeName = req.storeName || 'plants in garden';
    const orderObjectId = toObjectId(orderId);

    if (!orderObjectId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order id',
      });
    }

    const db = mongoose.connection.db;
    const order = await db.collection('orders').findOne({ _id: orderObjectId, storeName });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const now = new Date();
    const invoiceNumber =
      order?.invoice?.invoiceNumber ||
      `INV-${String(storeName).replace(/\s+/g, '').toUpperCase()}-${Date.now()}`;

    const invoicePayload = {
      generated: true,
      invoiceNumber,
      generatedAt: now,
      currency: 'INR',
      lineItems: (order.items || []).map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: Number(item.price || 0),
        amount: Number(item.price || 0) * Number(item.quantity || 0),
      })),
      subtotal: Number(order.subtotal || 0),
      tax: Number(order.tax || 0),
      shipping: Number(order.shipping || 0),
      total: Number(order.total || 0),
    };

    await db.collection('orders').updateOne(
      { _id: orderObjectId, storeName },
      {
        $set: {
          invoice: invoicePayload,
          updatedAt: now,
        },
        $push: {
          trackingUpdates: {
            _id: new mongoose.Types.ObjectId(),
            message: `Invoice generated (${invoiceNumber})`,
            location: null,
            createdAt: now,
            visibility: 'customer',
          },
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Invoice generated successfully',
      data: invoicePayload,
    });
  } catch (error) {
    console.error('❌ Error generating invoice:', error);
    return res.status(500).json({
      success: false,
      message: 'Error generating invoice',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

module.exports = router;
