import express, { Router, Request, Response } from 'express';
import {
  processBulkUpload,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  searchProducts
} from '../services/bulkupload.service';

const router = Router();

/**
 * POST /api/products/bulk-upload
 * Upload multiple products with images from Google Drive
 * Expects array of products with driveImageUrls (Google Drive links or IDs)
 */
router.post('/bulk-upload', async (req: Request, res: Response) => {
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
  } catch (error: any) {
    console.error('Bulk Upload Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Bulk upload failed'
    });
  }
});

/**
 * GET /api/products/search
 * Search products by name
 * Query params: q (search query), limit
 * MUST come before /:id route to avoid route conflict
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, limit } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query (q) is required'
      });
    }

    const result = await searchProducts(q as string, limit ? parseInt(limit as string) : 20);

    if (!result.success) {
      return res.status(500).json(result);
    }

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Search failed'
    });
  }
});

/**
 * GET /api/products
 * Get all products with optional filters
 * Query params: category, status, limit, skip
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, status, limit, skip } = req.query;

    const result = await getAllProducts({
      category: category as string,
      status: status as string,
      limit: limit ? parseInt(limit as string) : undefined,
      skip: skip ? parseInt(skip as string) : undefined
    });

    if (!result.success) {
      return res.status(500).json(result);
    }

    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch products'
    });
  }
});

/**
 * GET /api/products/:id
 * Get product by ID
 * MUST come after /search route
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const result = await getProductById(id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error: any) {
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
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
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
  } catch (error: any) {
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
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const result = await deleteProduct(id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete product'
    });
  }
});

export default router;
