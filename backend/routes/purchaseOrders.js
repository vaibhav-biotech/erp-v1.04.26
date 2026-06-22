const express = require('express');
const router = express.Router();
const PurchaseOrder = require('../models/PurchaseOrder');
const Product = require('../models/Product');
const verifyAdminToken = require('../middleware/verifyAdminToken');

router.use(verifyAdminToken);

// GET /api/purchase-orders/stats - Get KPIs
router.get('/stats', async (req, res) => {
  try {
    const pos = await PurchaseOrder.find({});
    
    let totalPO = pos.length;
    let pendingPO = 0;
    let completedPO = 0;
    let cancelledPO = 0;
    
    let purchaseValue = 0;
    let pendingDeliveries = 0;
    let supplierPayments = 0; // pending payables

    pos.forEach(po => {
      purchaseValue += po.financials.grandTotal || 0;
      
      if (po.status === 'Completed') completedPO++;
      else if (po.status === 'Cancelled') cancelledPO++;
      else {
        pendingPO++;
        pendingDeliveries++; // Basic mapping
      }
      
      if (po.paymentStatus !== 'Paid') {
        const pendingAmount = (po.financials.grandTotal || 0) - (po.financials.amountPaid || 0);
        supplierPayments += pendingAmount;
      }
    });

    res.json({
      success: true,
      data: {
        totalPO,
        pendingPO,
        completedPO,
        cancelledPO,
        purchaseValue,
        pendingDeliveries,
        todaysDeliveries: 0, // Hardcoded for now
        supplierPayments
      }
    });
  } catch (error) {
    console.error('Error fetching PO stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch PO stats' });
  }
});

// GET /api/purchase-orders - List POs
router.get('/', async (req, res) => {
  try {
    const pos = await PurchaseOrder.find({})
      .populate('supplier', 'name companyName')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: pos });
  } catch (error) {
    console.error('Error fetching POs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch POs' });
  }
});

// GET /api/purchase-orders/:id - Get single PO
router.get('/:id', async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id)
      .populate('supplier')
      .populate('products.product', 'name sku currentStock');
    if (!po) {
      return res.status(404).json({ success: false, error: 'PO not found' });
    }
    res.json({ success: true, data: po });
  } catch (error) {
    console.error('Error fetching PO:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch PO' });
  }
});

// POST /api/purchase-orders - Create PO
router.post('/', async (req, res) => {
  try {
    const po = new PurchaseOrder({
      ...req.body,
      createdBy: req.adminId // from verifyAdminToken
    });
    
    // Calculate pendingQty initially
    po.products.forEach(p => {
      p.pendingQty = p.orderedQty;
    });

    await po.save();
    res.status(201).json({ success: true, data: po });
  } catch (error) {
    console.error('Error creating PO:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// PUT /api/purchase-orders/:id - Update PO details/status
router.put('/:id', async (req, res) => {
  try {
    const po = await PurchaseOrder.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!po) {
      return res.status(404).json({ success: false, error: 'PO not found' });
    }
    res.json({ success: true, data: po });
  } catch (error) {
    console.error('Error updating PO:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /api/purchase-orders/:id/receive - Goods Received Note (GRN) Processing
router.post('/:id/receive', async (req, res) => {
  try {
    const { items, notes } = req.body; 
    // items should be [{ productId, receivedQty, damagedQty }]
    
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) {
      return res.status(404).json({ success: false, error: 'PO not found' });
    }

    if (po.status === 'Completed' || po.status === 'Cancelled') {
      return res.status(400).json({ success: false, error: 'Cannot receive goods for Completed/Cancelled PO' });
    }

    let allProductsReceived = true;

    for (let incomingItem of items) {
      const poProduct = po.products.find(p => p.product.toString() === incomingItem.productId);
      
      if (!poProduct) continue;

      const recQty = Number(incomingItem.receivedQty) || 0;
      const dmgQty = Number(incomingItem.damagedQty) || 0;
      const validRecQty = recQty - dmgQty;

      if (recQty > 0) {
        poProduct.receivedQty += recQty;
        poProduct.damagedQty += dmgQty;
        poProduct.pendingQty = Math.max(0, poProduct.orderedQty - poProduct.receivedQty);

        // Auto increment Central Inventory
        if (validRecQty > 0) {
          await Product.findByIdAndUpdate(incomingItem.productId, {
            $inc: { stock: validRecQty }
          });
        }

        // Add to GRN history
        po.grnHistory.push({
          product: incomingItem.productId,
          receivedQty: recQty,
          damagedQty: dmgQty,
          receivedBy: req.adminId,
          notes: notes || ''
        });
      }

      if (poProduct.pendingQty > 0) {
        allProductsReceived = false;
      }
    }

    // Auto-update PO status based on pending quantities
    const anyReceived = po.products.some(p => p.receivedQty > 0);
    
    if (allProductsReceived) {
      po.status = 'Received';
    } else if (anyReceived) {
      po.status = 'Partially Received';
    }

    await po.save();
    
    res.json({ success: true, data: po });

  } catch (error) {
    console.error('Error processing GRN:', error);
    res.status(500).json({ success: false, error: 'Failed to process GRN' });
  }
});

module.exports = router;
