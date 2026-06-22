const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const ActivityLog = require('../models/ActivityLog');

router.get('/stats', async (req, res) => {
  try {
    const products = await Product.find({}).populate('category', 'name');
    
    let totalProducts = products.length;
    let stockUnits = 0;
    let inventoryValue = 0;
    let stockValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    
    const categoryCounts = {};

    products.forEach(p => {
      const stock = p.stock || 0;
      const costPrice = p.costPrice || 0;
      const sellingPrice = p.originalPrice || p.price || 0; // fallback to price if originalPrice missing

      stockUnits += stock;
      inventoryValue += (stock * costPrice);
      stockValue += (stock * sellingPrice);
      
      if (stock === 0) {
        outOfStockCount++;
      } else if (stock < 100) {
        lowStockCount++;
      }

      const catName = p.category?.name || 'Uncategorized';
      categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
    });

    const potentialGrossProfit = stockValue - inventoryValue;
    const stockAlerts = lowStockCount + outOfStockCount;

    // Mock reserved stock to be 5% of total stock for now until order logic is built out
    const reservedStock = Math.floor(stockUnits * 0.05);
    const availableStock = stockUnits - reservedStock;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const movements = await StockMovement.find({ createdAt: { $gte: startOfMonth } }).populate('productId', 'name');
    
    let inventoryTurnover = 0;
    movements.forEach(m => {
      if (m.reason === 'Order' && m.delta < 0) {
        inventoryTurnover += Math.abs(m.delta);
      }
    });

    // Tables
    const topInventoryValue = [...products]
      .sort((a, b) => ((b.stock || 0) * (b.costPrice || 0)) - ((a.stock || 0) * (a.costPrice || 0)))
      .slice(0, 5)
      .map(p => ({ name: p.name, value: ((p.stock || 0) * (p.costPrice || 0)) }));

    const lowStockProducts = [...products]
      .filter(p => p.stock > 0 && p.stock < 100)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 5)
      .map(p => ({ name: p.name, stock: p.stock }));

    const recentlyUpdated = await StockMovement.find()
      .populate('productId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);
    
    const recentlyUpdatedTable = recentlyUpdated.map(m => ({
      name: m.productId ? m.productId.name : 'Unknown Product',
      delta: m.delta > 0 ? `+${m.delta}` : `${m.delta}`
    }));

    const categoryDistribution = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    // Mocking Store Coverage for 10 stores
    const sharedProducts = totalProducts;
    const storeCoverage = [
      { name: "Vaibhav Main Store", count: totalProducts },
      { name: "Garden Essentials", count: Math.floor(totalProducts * 0.95) },
      { name: "Green Nursery", count: Math.floor(totalProducts * 0.85) },
      { name: "Outdoor Plants Co", count: Math.floor(totalProducts * 0.80) },
      { name: "Indoor Decor", count: Math.floor(totalProducts * 0.70) }
    ];

    res.json({
      success: true,
      data: {
        totalProducts,
        stockUnits,
        inventoryValue,
        stockValue,
        lowStockCount,
        outOfStockCount,
        reservedStock,
        availableStock,
        potentialGrossProfit,
        inventoryTurnover,
        sharedProducts,
        stockAlerts,
        tables: {
          topInventoryValue,
          lowStockProducts,
          recentlyUpdatedTable,
          categoryDistribution,
          storeCoverage
        }
      }
    });
  } catch (error) {
    console.error('Inventory stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch inventory stats' });
  }
});

router.get('/activity-log', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.skip) || 0;
    
    // For now we fetch all inventory_admin logs
    const logs = await ActivityLog.find({ role: 'inventory_admin' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    const total = await ActivityLog.countDocuments({ role: 'inventory_admin' });

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        limit,
        skip,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Activity log fetch error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch activity logs' });
  }
});

module.exports = router;
