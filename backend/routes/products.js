const express = require('express');
const {
  processBulkUpload,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  searchProducts
} = require('../services/bulkupload.service');
const Category = require('../models/Category');
const Product = require('../models/Product');
const ActivityLog = require('../models/ActivityLog');
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');

const router = express.Router();

/**
 * POST /api/products/migrate
 * Migrate old products with string category to category ID
 * Temporary endpoint for one-time migration
 */
router.post('/migrate', async (req, res) => {
  try {
    console.log('🔄 Starting product migration...');

    // Get all products
    const products = await Product.find({});
    console.log(`📊 Found ${products.length} products to check`);

    let migratedCount = 0;
    const results = [];

    for (const product of products) {
      // Check if category is a string (old format)
      if (typeof product.category === 'string') {
        console.log(`\n🔄 Processing: ${product.name}`);
        console.log(`   Current category: ${product.category}`);

        // Find category by name
        const category = await Category.findOne({
          name: { $regex: new RegExp(`^${product.category}$`, 'i') }
        });

        if (category) {
          // Update product with category ID and name
          product.category = category._id.toString();
          product.categoryName = category.name;
          await product.save();
          console.log(`   ✅ Updated to ID: ${category._id}, Name: ${category.name}`);
          migratedCount++;
          results.push({
            productName: product.name,
            status: 'migrated',
            categoryId: category._id,
            categoryName: category.name
          });
        } else {
          console.log(`   ⚠️ Category not found: ${product.category}`);
          results.push({
            productName: product.name,
            status: 'failed',
            reason: 'Category not found'
          });
        }
      }
    }

    console.log(`\n📈 Migration complete! Migrated: ${migratedCount}/${products.length}`);

    return res.status(200).json({
      success: true,
      message: 'Migration completed',
      migratedCount,
      totalProducts: products.length,
      results
    });
  } catch (error) {
    console.error('Migration error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Migration failed'
    });
  }
});

/**
 * POST /api/products/bulk-upload
 * Starts async bulk upload; poll GET /bulk-upload/status/:jobId for progress.
 */
router.post('/bulk-upload', async (req, res) => {
  try {
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Products array is required and must not be empty',
      });
    }

    const {
      createBulkUploadJob,
      completeBulkUploadJob,
      failBulkUploadJob,
    } = require('../services/bulkUploadJobs');

    const jobId = createBulkUploadJob(products.length);
    console.log(`📨 Bulk upload job ${jobId} — ${products.length} products`);

    res.status(202).json({
      success: true,
      jobId,
      totalProducts: products.length,
      message: 'Upload started. Poll /api/products/bulk-upload/status/:jobId for progress.',
    });

    setImmediate(async () => {
      try {
        const result = await processBulkUpload(products, { jobId });
        completeBulkUploadJob(jobId, result);
      } catch (error) {
        console.error('Bulk Upload Job Error:', error);
        failBulkUploadJob(jobId, error.message || 'Bulk upload failed');
      }
    });
  } catch (error) {
    console.error('Bulk Upload Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Bulk upload failed',
    });
  }
});

/**
 * GET /api/products/bulk-upload/status/:jobId
 */
router.get('/bulk-upload/status/:jobId', (req, res) => {
  const { getBulkUploadJob } = require('../services/bulkUploadJobs');
  const job = getBulkUploadJob(req.params.jobId);

  if (!job) {
    return res.status(404).json({
      success: false,
      error: 'Upload job not found or expired',
    });
  }

  const percent =
    job.totalProducts > 0
      ? Math.round((job.processed / job.totalProducts) * 100)
      : 0;

  return res.status(200).json({
    success: true,
    jobId: job.id,
    status: job.status,
    percent,
    totalProducts: job.totalProducts,
    processed: job.processed,
    currentProduct: job.currentProduct,
    successCount: job.successCount,
    failureCount: job.failureCount,
    results: job.status === 'completed' || job.status === 'failed' ? job.results : undefined,
    error: job.error,
  });
});

/**
 * POST /api/products
 * Create a single product (used by frontend Add Product form)
 */
router.post('/', async (req, res) => {
  try {
    const product = req.body;

    const { validateProduct } = require('../services/validation.service');
    const validation = validateProduct(product);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, errors: validation.errors });
    }

    const Product = require('../models/Product');
    const newProduct = new Product(product);
    const saved = await newProduct.save();

    return res.status(201).json({ success: true, data: saved });
  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to create product' });
  }
});

/**
 * GET /api/products
 * Get all products with optional filters
 * Query params: category, status, limit, skip
 */
router.get('/', async (req, res) => {
  try {
    const { category, status, stockStatus, limit, skip } = req.query;

    const result = await getAllProducts({
      storeName: req.storeName,
      category,
      status,
      stockStatus,
      limit: limit ? parseInt(limit) : undefined,
      skip: skip ? parseInt(skip) : undefined
    });

    if (!result.success) {
      return res.status(500).json(result);
    }

    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch products'
    });
  }
});

/**
 * GET /api/products/search
 * Search products by name
 * Query params: q (search query), limit
 */
router.get('/search', async (req, res) => {
  try {
    const { q, limit } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query (q) is required'
      });
    }

    const result = await searchProducts(q, limit ? parseInt(limit) : 20, req.storeName);

    if (!result.success) {
      return res.status(500).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Search failed'
    });
  }
});

/**
 * GET /api/products/:id
 * Get product by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await getProductById(id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch product'
    });
  }
});

/**
 * PUT /api/products/:id
 * Update product by ID
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Capture user making the request
    let adminRole = null;
    let adminEmail = null;
    let adminId = null;

    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-key-change-in-production');
        adminRole = decoded.role;
        adminId = decoded.id;
        
        if (adminId) {
          const adminObj = await Admin.findById(adminId);
          if (adminObj) adminEmail = adminObj.email;
        }
      } catch (err) {
        console.error('Invalid token during product update');
      }
    }

    const oldProduct = await Product.findById(id);

    const result = await updateProduct(id, updates);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Log Activity for inventory_admin
    if (adminRole === 'inventory_admin' && oldProduct) {
      const details = [];
      if (updates.stock !== undefined && Number(oldProduct.stock) !== Number(updates.stock)) {
        details.push(`stock from ${oldProduct.stock} to ${updates.stock}`);
      }
      if (updates.costPrice !== undefined && Number(oldProduct.costPrice) !== Number(updates.costPrice)) {
        details.push(`cost price from ₹${oldProduct.costPrice || 0} to ₹${updates.costPrice}`);
      }

      if (details.length > 0) {
        try {
          await ActivityLog.create({
            adminId,
            adminEmail: adminEmail || 'Unknown',
            role: adminRole,
            action: 'UPDATE_PRODUCT',
            details: `Updated ${oldProduct.name}: changed ${details.join(', ')}`,
          });
        } catch (logErr) {
          console.error('Failed to log product update activity:', logErr);
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: result.data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update product'
    });
  }
});

/**
 * DELETE /api/products/:id
 * Delete product by ID
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await deleteProduct(id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete product'
    });
  }
});

module.exports = router;
