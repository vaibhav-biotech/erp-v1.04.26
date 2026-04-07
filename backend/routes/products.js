const express = require('express');
const {
  processBulkUpload,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  searchProducts
} = require('../services/bulkupload.service');

const router = express.Router();

/**
 * POST /api/products/bulk-upload
 * Upload multiple products with images from Google Drive
 * Expects array of products with driveImageUrls (Google Drive links or IDs)
 */
router.post('/bulk-upload', async (req, res) => {
  try {
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Products array is required and must not be empty'
      });
    }

    console.log(`📨 Received bulk upload request for ${products.length} products`);

    const result = await processBulkUpload(products);

    return res.status(200).json({
      success: true,
      message: 'Bulk upload completed',
      data: result
    });
  } catch (error) {
    console.error('Bulk Upload Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Bulk upload failed'
    });
  }
});

/**
 * GET /api/products
 * Get all products with optional filters
 * Query params: category, status, limit, skip
 */
router.get('/', async (req, res) => {
  try {
    const { category, status, limit, skip } = req.query;

    const result = await getAllProducts({
      category,
      status,
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

    const result = await searchProducts(q, limit ? parseInt(limit) : 20);

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

    const result = await updateProduct(id, updates);

    if (!result.success) {
      return res.status(400).json(result);
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
