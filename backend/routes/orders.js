const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Store = require('../models/Store');

const ORDER_STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];
const PAYMENT_STATUS_OPTIONS = ['pending', 'paid', 'failed', 'refunded', 'cod_pending'];

const normalizeStoreName = (value) => {
  const normalized = String(value || '').toLowerCase().trim();
  if (!normalized) return 'plantsingarden';

  if (normalized === 'plants in garden' || normalized === 'plants-in-garden' || normalized === 'plantingarden') {
    return 'plantsingarden';
  }

  return normalized.replace(/\s+/g, '');
};

const getStoreAliases = (value) => {
  const base = String(value || '').toLowerCase().trim();
  const compact = base.replace(/\s+/g, '');
  const aliases = new Set([base, compact, normalizeStoreName(base)]);

  if (aliases.has('plantsingarden') || aliases.has('plants in garden') || aliases.has('plants-in-garden') || aliases.has('plantingarden')) {
    aliases.add('plantsingarden');
    aliases.add('plants in garden');
    aliases.add('plants-in-garden');
    aliases.add('plantingarden');
  }

  return Array.from(aliases).filter(Boolean);
};

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

const getStoreTaxSettings = async (storeName) => {
  const safeStoreName = normalizeStoreName(storeName || 'plantsingarden');
  const store = await Store.findOne({ storeName: safeStoreName });

  const enabled = Boolean(store?.taxSettings?.enabled);
  const rateRaw = Number(store?.taxSettings?.rate);
  const rate = Number.isFinite(rateRaw) ? Math.max(0, Math.min(100, rateRaw)) : 18;

  return {
    enabled,
    rate,
  };
};

// Manual Order Creation (Admin)
router.post('/manual', async (req, res) => {
  try {
    const {
      customerId,
      items,
      paymentMethod,
      notes,
      customDiscount = 0,
      orderDate, // Optional backdated date
    } = req.body;

    if (!items || items.length === 0 || !paymentMethod) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    let customerInfo = req.body.customerInfo;
    let finalCustomerId = customerId;
    let orderAddress = { 
      firstName: '', lastName: '', street: '', city: '', state: '', zipCode: '', country: '', phone: '' 
    };

    // If no customerId provided, attempt to create a new customer
    if (!finalCustomerId && customerInfo && customerInfo.email) {
      const Customer = require('../models/Customer');
      const bcrypt = require('bcryptjs');
      
      let existingCustomer = await Customer.findOne({ email: customerInfo.email });
      if (existingCustomer) {
        finalCustomerId = existingCustomer._id;
      } else {
        const hashedPassword = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);
        const newCustomer = new Customer({
          firstName: customerInfo.firstName,
          lastName: customerInfo.lastName,
          email: customerInfo.email,
          phone: customerInfo.phone || '0000000000',
          password: hashedPassword,
        });
        await newCustomer.save();
        finalCustomerId = newCustomer._id;
      }
      
      if (customerInfo.address) {
        orderAddress = { ...orderAddress, ...customerInfo.address };
      }
    } else if (finalCustomerId) {
      const Customer = require('../models/Customer');
      const existingCustomer = await Customer.findById(finalCustomerId);
      if (existingCustomer) {
        customerInfo = {
          firstName: existingCustomer.firstName,
          lastName: existingCustomer.lastName,
          email: existingCustomer.email,
          phone: existingCustomer.phone,
        };
        orderAddress = {
          firstName: existingCustomer.firstName,
          lastName: existingCustomer.lastName,
          phone: existingCustomer.phone,
          street: '', city: '', state: '', zipCode: '', country: ''
        };
      }
    } else if (!finalCustomerId) {
       return res.status(400).json({ success: false, message: 'Customer ID or Customer Info required' });
    }

    const storeName = normalizeStoreName(req.storeName || 'plantsingarden');
    const taxSettings = await getStoreTaxSettings(storeName);
    const effectiveTaxRate = taxSettings.enabled ? taxSettings.rate : 0;

    const subtotal = items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
    const afterDiscount = Math.max(0, subtotal - Number(customDiscount));
    const tax = Math.round(afterDiscount * (effectiveTaxRate / 100) * 100) / 100;
    const shipping = afterDiscount >= 60 ? 0 : 50;
    const total = afterDiscount + tax + shipping;

    const now = orderDate ? new Date(orderDate) : new Date();
    const initialPaymentStatus = String(paymentMethod || '').toLowerCase() === 'cod' ? 'cod_pending' : 'paid';

    const orderData = {
      _id: new mongoose.Types.ObjectId(),
      customerId: toObjectId(finalCustomerId),
      customerInfo: customerInfo ? { firstName: customerInfo.firstName, lastName: customerInfo.lastName, phone: customerInfo.phone, email: customerInfo.email } : undefined,
      items: items.map(item => ({
        _id: new mongoose.Types.ObjectId(),
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      address: orderAddress,
      shippingAddress: orderAddress,
      paymentMethod,
      paymentStatus: initialPaymentStatus,
      orderStatus: 'confirmed', // Auto-confirm manual orders
      subtotal,
      discount: Number(customDiscount),
      tax,
      taxRate: effectiveTaxRate,
      shipping,
      total,
      notes: notes || 'Manual order created by admin',
      storeName,
      orderNumber: `ORDER-${Date.now()}`,
      statusHistory: [
        {
          _id: new mongoose.Types.ObjectId(),
          status: 'confirmed',
          note: 'Manual order created by store admin',
          createdAt: now,
          visibility: 'admin',
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
      createdAt: now,
      updatedAt: now,
    };

    const db = mongoose.connection.db;
    await db.collection('orders').insertOne(orderData);

    const Product = require('../models/Product');
    const StockMovement = require('../models/StockMovement');
    
    for (const item of items) {
      if (item.productId) {
        try {
          await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
          await StockMovement.create({
            productId: item.productId,
            delta: -item.quantity,
            reason: 'Order',
            referenceId: orderData.orderNumber,
            notes: 'Manual admin order placed'
          });
        } catch (err) {
          console.error(`Failed to deduct stock for product ${item.productId}:`, err);
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Manual Order created successfully',
      data: orderData
    });
  } catch (error) {
    console.error('Create manual order error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

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
    const storeName = normalizeStoreName(req.storeName || 'plantsingarden');
    const taxSettings = await getStoreTaxSettings(storeName);
    const effectiveTaxRate = taxSettings.enabled ? taxSettings.rate : 0;

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = Math.round(subtotal * (effectiveTaxRate / 100) * 100) / 100;
    const shipping = subtotal >= 60 ? 0 : 50;
    const total = subtotal + tax + shipping;

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
      taxRate: effectiveTaxRate,
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

    // Deduct stock and log stock movement
    const Product = require('../models/Product');
    const StockMovement = require('../models/StockMovement');
    
    for (const item of items) {
      if (item.productId) {
        try {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { stock: -item.quantity }
          });
          
          await StockMovement.create({
            productId: item.productId,
            delta: -item.quantity,
            reason: 'Order',
            referenceId: orderData.orderNumber,
            notes: 'Customer order placed'
          });
        } catch (err) {
          console.error(`Failed to deduct stock for product ${item.productId}:`, err);
        }
      }
    }

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
    const storeName = req.storeName || 'plantsingarden';

    const db = mongoose.connection.db;
    const orders = await db
      .collection('orders')
      .find({ storeName: { $in: getStoreAliases(storeName) } })
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
    const storeName = req.storeName || 'plantsingarden';
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
        storeName: { $in: getStoreAliases(storeName) },
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
    const storeName = req.storeName || 'plantsingarden';
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
      storeName: { $in: getStoreAliases(storeName) },
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
    const storeName = req.storeName || 'plantsingarden';
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
      storeName: { $in: getStoreAliases(storeName) },
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
        storeName: { $in: getStoreAliases(storeName) },
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
    const { invoiceDate } = req.body || {};
    const storeName = req.storeName || 'plantsingarden';
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
      storeName: { $in: getStoreAliases(storeName) },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const now = invoiceDate ? new Date(invoiceDate) : new Date();
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
      {
        _id: orderObjectId,
        storeName: { $in: getStoreAliases(storeName) },
      },
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
