const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Order = require('../models/Order');
const Invoice = require('../models/Invoice');
const Store = require('../models/Store');
const InvoiceCounter = require('../models/InvoiceCounter');

async function generateInvoiceNumber(storeName) {
  let storeCode = '01';
  let storeId = null;

  if (storeName) {
    const store = await Store.findOne({ storeName: storeName.toLowerCase() });
    if (store) {
      storeCode = store.invoiceCode || '01';
      storeId = store._id;
    }
  }

  // If no storeId found, use a fallback
  if (!storeId) {
    storeId = new mongoose.Types.ObjectId(); 
  }

  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear()).slice(-2);
  const monthYear = `${month}${year}`;

  const counter = await InvoiceCounter.findOneAndUpdate(
    { storeId, monthYear },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true }
  );

  const sequenceStr = String(counter.sequence).padStart(4, '0');
  return `${storeCode}${monthYear}${sequenceStr}`;
}

// --- Dashboard Stats ---
router.get('/dashboard', async (req, res) => {
  try {
    const db = mongoose.connection.db;

    // 1. Order stats
    const orders = await db.collection('orders').find({}).toArray();
    const totalOrders = orders.length;
    const paidOrders = orders.filter(o => o.paymentStatus === 'paid').length;
    const pendingOrders = orders.filter(o => o.paymentStatus === 'pending').length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.paymentStatus === 'paid' ? (Number(o.total) || 0) : 0), 0);
    const pendingRevenue = orders.reduce((sum, o) => sum + (o.paymentStatus === 'pending' ? (Number(o.total) || 0) : 0), 0);

    // 2. Purchase Orders
    const pos = await db.collection('purchaseorders').find({}).toArray();
    const totalPos = pos.length;
    const pendingPos = pos.filter(po => po.status === 'Pending').length;
    const poTotalValue = pos.reduce((sum, po) => sum + (Number(po.totalAmount) || 0), 0);

    // 3. Suppliers
    const suppliersCount = await db.collection('suppliers').countDocuments();

    // 4. Invoices
    const manualInvoices = await Invoice.find({}).lean();
    const autoInvoicesCount = orders.filter(o => o.invoice && o.invoice.generated).length;
    const totalInvoices = manualInvoices.length + autoInvoicesCount;

    // 5. Order Statuses Breakdown
    const globalStatuses = {
      pending: orders.filter(o => o.orderStatus === 'pending').length,
      processing: orders.filter(o => o.orderStatus === 'processing').length,
      shipped: orders.filter(o => o.orderStatus === 'shipped').length,
      delivered: orders.filter(o => o.orderStatus === 'delivered').length,
      cancelled: orders.filter(o => o.orderStatus === 'cancelled').length,
      returned: orders.filter(o => o.orderStatus === 'returned').length,
    };

    // Store-wise statuses
    const storeMap = {};
    orders.forEach(o => {
      const sName = o.storeName || 'Unknown Store';
      if (!storeMap[sName]) {
        storeMap[sName] = { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0, returned: 0, total: 0 };
      }
      const st = o.orderStatus || 'pending';
      if (storeMap[sName][st] !== undefined) {
        storeMap[sName][st]++;
      }
      storeMap[sName].total++;
    });

    res.json({
      success: true,
      data: {
        orders: { total: totalOrders, paid: paidOrders, pending: pendingOrders, statuses: globalStatuses, storeStatuses: storeMap },
        revenue: { totalCollected: totalRevenue, pendingCollection: pendingRevenue },
        purchaseOrders: { total: totalPos, pending: pendingPos, value: poTotalValue },
        suppliers: { total: suppliersCount },
        invoices: { total: totalInvoices }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- Invoices ---

// Fetch all active stores for dropdowns
router.get('/stores', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const stores = await db.collection('stores')
      .find({ isActive: true })
      .project({ _id: 1, name: 1, storeName: 1, domain: 1 })
      .toArray();
    res.json({ success: true, data: stores });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all invoices across all stores (both manual and auto-generated from orders)
router.get('/invoices', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    
    // 1. Fetch manual invoices
    const manualInvoices = await Invoice.find({}).populate('store').sort({ createdAt: -1 }).lean();
    
    // 2. Fetch auto-generated invoices from orders
    const ordersWithInvoices = await db.collection('orders').find({ "invoice.generated": true }).sort({ "invoice.generatedAt": -1 }).toArray();
    
    const autoInvoices = ordersWithInvoices.map(order => ({
      _id: order._id, // Use order ID or a generated string
      invoiceNumber: order.invoice.invoiceNumber,
      createdAt: order.invoice.generatedAt || order.updatedAt,
      store: { name: order.storeName },
      customerName: order.customerInfo ? `${order.customerInfo.firstName} ${order.customerInfo.lastName}` : (order.address ? `${order.address.firstName} ${order.address.lastName}` : 'N/A'),
      total: order.invoice.total,
      status: order.paymentStatus || 'pending',
      orderStatus: order.orderStatus || 'pending',
      isAutoGenerated: true,
      orderId: order.orderNumber || order._id,
      paymentDate: order.paymentDate
    }));

    // Combine and sort by date descending
    const allInvoices = [...manualInvoices, ...autoInvoices].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, data: allInvoices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single invoice
router.get('/invoices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const objectId = mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;

    if (!objectId) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const db = mongoose.connection.db;

    // First check if it's an auto-generated invoice (which uses order ID as its ID in the list)
    const order = await db.collection('orders').findOne({ _id: objectId });
    if (order && order.invoice && order.invoice.generated) {
      let displayStoreName = order.storeName;
      const storeDoc = await db.collection('stores').findOne({
         $or: [
           { _id: order.store },
           { storeName: order.storeName }
         ]
      });
      if (storeDoc && storeDoc.name) {
        displayStoreName = storeDoc.name;
      }

      const addressData = order.shippingAddress || order.address || order.customerInfo?.address || {};

      return res.json({
        success: true,
        data: {
          _id: order._id,
          invoiceNumber: order.invoice.invoiceNumber,
          createdAt: order.invoice.generatedAt || order.updatedAt,
          store: { name: displayStoreName },
          customerName: order.customerInfo ? `${order.customerInfo.firstName || ''} ${order.customerInfo.lastName || ''}`.trim() : (order.address ? `${order.address.firstName || ''} ${order.address.lastName || ''}`.trim() : 'N/A'),
          customerEmail: order.customerInfo?.email || order.address?.email || '',
          shippingAddress: {
            address: addressData.street || addressData.address || '',
            city: addressData.city || '',
            state: addressData.state || '',
            postalCode: addressData.zipCode || addressData.postalCode || ''
          },
          total: order.invoice.total,
          subtotal: order.invoice.subtotal,
          tax: order.invoice.tax,
          shipping: order.invoice.shipping,
          status: order.paymentStatus || 'pending',
          orderStatus: order.orderStatus || 'pending',
          isAutoGenerated: true,
          orderId: order.orderNumber || order._id,
          lineItems: order.invoice.lineItems,
          paymentDate: order.paymentDate,
          dispatchingCenter: order.dispatchingCenter,
          shippingDetail: order.shippingDetail
        }
      });
    }

    // Otherwise, check manual invoices
    const manualInvoice = await Invoice.findById(objectId).populate('store').lean();
    if (manualInvoice) {
      return res.json({ success: true, data: manualInvoice });
    }

    return res.status(404).json({ success: false, message: 'Invoice not found' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create manual invoice
router.post('/invoices', async (req, res) => {
  try {
    const newInvoice = new Invoice(req.body);
    await newInvoice.save();
    res.status(201).json(newInvoice);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// --- Orders ---

// Get all orders across all stores
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Single Order
router.get('/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const orderObjectId = mongoose.Types.ObjectId.isValid(orderId) ? new mongoose.Types.ObjectId(orderId) : null;

    if (!orderObjectId) {
      return res.status(400).json({ success: false, message: 'Invalid order id' });
    }

    const db = mongoose.connection.db;
    const order = await db.collection('orders').findOne({ _id: orderObjectId });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update Order Payment Status & Auto-Invoice
router.patch('/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { 
      paymentStatus, orderStatus, courierName, trackingNumber, trackingUrl, 
      estimatedDelivery, customerUpdate, internalNote, statusNote, paymentNote, 
      shipping, discount,
      paymentDate, createdAt, dispatchingCenter, shippingDetail, items
    } = req.body;
    const orderObjectId = mongoose.Types.ObjectId.isValid(orderId) ? new mongoose.Types.ObjectId(orderId) : null;

    if (!orderObjectId) {
      return res.status(400).json({ success: false, message: 'Invalid order id' });
    }

    const db = mongoose.connection.db;
    const existingOrder = await db.collection('orders').findOne({ _id: orderObjectId });

    if (!existingOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const now = new Date();
    const setPayload = { updatedAt: now };
    const pushPayload = {};

    if (paymentDate !== undefined) setPayload.paymentDate = paymentDate ? new Date(paymentDate) : null;
    if (createdAt !== undefined) setPayload.createdAt = createdAt ? new Date(createdAt) : null;
    if (dispatchingCenter !== undefined) setPayload.dispatchingCenter = dispatchingCenter;
    if (shippingDetail !== undefined) setPayload.shippingDetail = shippingDetail;
    
    // Update items if provided (to handle variety and extraDescription updates)
    if (items && Array.isArray(items)) {
      setPayload.items = items.map(item => ({
        ...item,
        productId: item.productId || item._id, // fallback if needed
      }));
    }

    if (shipping !== undefined || discount !== undefined) {
      const newShipping = shipping !== undefined ? Number(shipping) : Number(existingOrder.shipping || 0);
      const newDiscount = discount !== undefined ? Number(discount) : Number(existingOrder.discount || 0);
      const subtotal = Number(existingOrder.subtotal || existingOrder.totalAmount || 0) - Number(existingOrder.tax || 0) - Number(existingOrder.shipping || 0) + Number(existingOrder.discount || 0); // approximation if subtotal missing
      const actualSubtotal = existingOrder.subtotal !== undefined ? Number(existingOrder.subtotal) : subtotal;
      const newTotal = actualSubtotal + Number(existingOrder.tax || 0) + newShipping - newDiscount;
      
      setPayload.shipping = newShipping;
      setPayload.discount = newDiscount;
      setPayload.total = newTotal;
      setPayload.totalAmount = newTotal;

      if (existingOrder.invoice && existingOrder.invoice.generated) {
        setPayload['invoice.shipping'] = newShipping;
        setPayload['invoice.discount'] = newDiscount;
        setPayload['invoice.total'] = newTotal;
      }
    }

    // 1. Payment Status Update
    if (paymentStatus && paymentStatus !== existingOrder.paymentStatus) {
      setPayload.paymentStatus = paymentStatus;
      if (!pushPayload.paymentHistory) pushPayload.paymentHistory = [];
      pushPayload.paymentHistory.push({
        _id: new mongoose.Types.ObjectId(),
        status: paymentStatus,
        note: paymentNote || `Payment status updated to ${paymentStatus} by Accountant`,
        createdAt: now,
      });

    } else if (paymentNote) {
      if (!pushPayload.paymentHistory) pushPayload.paymentHistory = [];
      pushPayload.paymentHistory.push({
        _id: new mongoose.Types.ObjectId(),
        status: existingOrder.paymentStatus || 'pending',
        note: paymentNote,
        createdAt: now,
      });
    }

    // 2. Order Status Update
    if (orderStatus && orderStatus !== existingOrder.orderStatus) {
      setPayload.orderStatus = orderStatus;
      if (!pushPayload.statusHistory) pushPayload.statusHistory = [];
      pushPayload.statusHistory.push({
        _id: new mongoose.Types.ObjectId(),
        status: orderStatus,
        note: statusNote || `Order status updated to ${orderStatus}`,
        actor: 'accountant',
        visibility: 'customer',
        createdAt: now,
      });
    } else if (statusNote) {
      if (!pushPayload.statusHistory) pushPayload.statusHistory = [];
      pushPayload.statusHistory.push({
        _id: new mongoose.Types.ObjectId(),
        status: existingOrder.orderStatus || 'pending',
        note: statusNote,
        actor: 'accountant',
        visibility: 'internal',
        createdAt: now,
      });
    }

    // 3. Tracking Info Update
    if (courierName !== undefined || trackingNumber !== undefined || trackingUrl !== undefined || estimatedDelivery !== undefined) {
      setPayload.tracking = {
        ...existingOrder.tracking,
        ...(courierName !== undefined && { courierName }),
        ...(trackingNumber !== undefined && { trackingNumber }),
        ...(trackingUrl !== undefined && { trackingUrl }),
        ...(estimatedDelivery !== undefined && { estimatedDelivery }),
      };
    }

    // 4. Notes & Updates
    if (customerUpdate) {
      if (!pushPayload.trackingUpdates) pushPayload.trackingUpdates = [];
      pushPayload.trackingUpdates.push({
        _id: new mongoose.Types.ObjectId(),
        message: customerUpdate,
        visibility: 'customer',
        createdAt: now,
      });
    }

    if (internalNote) {
      if (!pushPayload.trackingUpdates) pushPayload.trackingUpdates = [];
      pushPayload.trackingUpdates.push({
        _id: new mongoose.Types.ObjectId(),
        message: internalNote,
        visibility: 'internal',
        createdAt: now,
      });
    }

    const updateQuery = { $set: setPayload };
    if (Object.keys(pushPayload).length > 0) {
      updateQuery.$push = {};
      if (pushPayload.paymentHistory) updateQuery.$push.paymentHistory = { $each: pushPayload.paymentHistory };
      if (pushPayload.statusHistory) updateQuery.$push.statusHistory = { $each: pushPayload.statusHistory };
      if (pushPayload.trackingUpdates) updateQuery.$push.trackingUpdates = { $each: pushPayload.trackingUpdates };
    }

    await db.collection('orders').updateOne({ _id: orderObjectId }, updateQuery);

    const updatedOrder = await db.collection('orders').findOne({ _id: orderObjectId });
    res.json({ success: true, message: 'Order updated and synced.', data: updatedOrder });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate Invoice (Accounts)
router.post('/orders/:orderId/invoice', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { invoiceDate, orderDate, paymentDate } = req.body || {};
    const orderObjectId = mongoose.Types.ObjectId.isValid(orderId) ? new mongoose.Types.ObjectId(orderId) : null;

    if (!orderObjectId) {
      return res.status(400).json({ success: false, message: 'Invalid order id' });
    }

    const db = mongoose.connection.db;
    const order = await db.collection('orders').findOne({ _id: orderObjectId });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const now = invoiceDate ? new Date(invoiceDate) : new Date();
    const invoiceNumber =
      order?.invoice?.invoiceNumber ||
      await generateInvoiceNumber(order.storeName);

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

    const setFields = {
      invoice: invoicePayload,
      updatedAt: now,
    };

    if (orderDate) {
      setFields.createdAt = new Date(orderDate);
    }
    if (paymentDate) {
      setFields.paymentDate = new Date(paymentDate);
    }

    await db.collection('orders').updateOne(
      { _id: orderObjectId },
      {
        $set: setFields,
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

// Create order manually
router.post('/orders', async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Sync orders (placeholder for external API sync)
router.post('/sync-orders', async (req, res) => {
  // TODO: Implement syncing from external platforms (e.g., Shopify, WooCommerce)
  res.json({ message: 'Sync orders functionality not fully implemented yet.' });
});

module.exports = router;
