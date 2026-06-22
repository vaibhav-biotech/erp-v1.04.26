const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');
const verifyAdminToken = require('../middleware/verifyAdminToken');

// Apply admin token verification to all routes
router.use(verifyAdminToken);

// GET /api/suppliers/stats - Get KPIs
router.get('/stats', async (req, res) => {
  try {
    const suppliers = await Supplier.find({});
    const totalSuppliers = suppliers.length;
    const activeSuppliers = suppliers.filter(s => s.status === 'Active').length;
    
    // Mocked for Phase 1 (POs will supply real data later)
    const pendingPurchaseOrders = 0; 
    const outstandingPayables = 0;
    const thisMonthPurchases = 0;
    const completedDeliveries = 0;
    const averageDeliveryTime = '0 days';

    // Best rating supplier
    let topSupplierName = 'N/A';
    let topRating = -1;
    suppliers.forEach(s => {
      if (s.rating > topRating) {
        topRating = s.rating;
        topSupplierName = s.name;
      }
    });

    res.json({
      success: true,
      data: {
        totalSuppliers,
        activeSuppliers,
        pendingPurchaseOrders,
        outstandingPayables,
        thisMonthPurchases,
        completedDeliveries,
        averageDeliveryTime,
        topSupplier: topSupplierName
      }
    });
  } catch (error) {
    console.error('Error fetching supplier stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch supplier stats' });
  }
});

// GET /api/suppliers - List suppliers
router.get('/', async (req, res) => {
  try {
    const suppliers = await Supplier.find({}).sort({ createdAt: -1 });
    
    // Add mocked fields for the table until PO module is built
    const suppliersWithMocks = suppliers.map(s => {
      const obj = s.toObject();
      obj.productsCount = 0;
      obj.pendingPO = 0;
      obj.outstanding = 0;
      return obj;
    });

    res.json({ success: true, data: suppliersWithMocks });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch suppliers' });
  }
});

// GET /api/suppliers/:id - Get single supplier
router.get('/:id', async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, error: 'Supplier not found' });
    }
    res.json({ success: true, data: supplier });
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch supplier' });
  }
});

// POST /api/suppliers - Create supplier
router.post('/', async (req, res) => {
  try {
    const supplier = new Supplier(req.body);
    await supplier.save();
    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// PUT /api/suppliers/:id - Update supplier
router.put('/:id', async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!supplier) {
      return res.status(404).json({ success: false, error: 'Supplier not found' });
    }
    res.json({ success: true, data: supplier });
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// DELETE /api/suppliers/:id - Delete supplier
router.delete('/:id', async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, error: 'Supplier not found' });
    }
    res.json({ success: true, data: {} });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ success: false, error: 'Failed to delete supplier' });
  }
});

module.exports = router;
