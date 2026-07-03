const Product = require('../models/Product');
const Category = require('../models/Category');
const StockMovement = require('../models/StockMovement');
const { uploadImageToS3 } = require('./s3.service');
const { downloadFromGoogleDrive } = require('./drive.service');
const { optimizeImage } = require('./imageOptimize.service');
const { patchBulkUploadJob } = require('./bulkUploadJobs');
const { validateProduct, validateBulkProducts } = require('./validation.service');

const IMAGE_CONCURRENCY = parseInt(process.env.BULK_IMAGE_CONCURRENCY || '4', 10);

/** Run async tasks with a concurrency limit */
const mapWithConcurrency = async (items, limit, fn) => {
  if (!items.length) return [];
  const results = new Array(items.length);
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < items.length) {
      const i = nextIndex++;
      results[i] = await fn(items[i], i);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker())
  );
  return results;
};

/**
 * Download Drive images in parallel, optimize, upload to S3.
 */
const processProductImages = async (driveUrls, productSlug) => {
  const safeSlug = String(productSlug || 'product')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 40);

  const imageResults = await mapWithConcurrency(driveUrls, IMAGE_CONCURRENCY, async (driveUrl, j) => {
    const driveResult = await downloadFromGoogleDrive(driveUrl);
    if (!driveResult.success || !driveResult.buffer) {
      return { success: false, error: `Image ${j + 1}: ${driveResult.error || 'download failed'}` };
    }

    const optimized = await optimizeImage(driveResult.buffer);
    const ext = optimized.contentType.includes('webp') ? 'webp' : 'jpg';
    const fileName = `${safeSlug}-${Date.now()}-${j}.${ext}`;
    const s3Result = await uploadImageToS3(
      optimized.buffer,
      fileName,
      optimized.contentType
    );

    if (!s3Result.success || !s3Result.url) {
      return { success: false, error: `Image ${j + 1}: ${s3Result.error || 'S3 upload failed'}` };
    }

    if (optimized.optimized) {
      const saved = optimized.originalBytes - optimized.outputBytes;
      const pct = optimized.originalBytes
        ? Math.round((saved / optimized.originalBytes) * 100)
        : 0;
      console.log(`    📷 Image ${j + 1} optimized: ${optimized.originalBytes} → ${optimized.outputBytes} bytes (−${pct}%)`);
    }

    return { success: true, url: s3Result.url };
  });

  const s3ImageUrls = imageResults.filter((r) => r.success).map((r) => r.url);
  const errors = imageResults.filter((r) => !r.success).map((r) => r.error);

  return { s3ImageUrls, errors };
};

const toSlug = (value) => String(value || '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');

const normalizeTags = (input, fallbackSubcategory) => {
  const rawTags = Array.isArray(input)
    ? input
    : typeof input === 'string'
      ? input.split(',')
      : [];

  const tags = rawTags
    .map((tag) => toSlug(tag))
    .filter(Boolean);

  const subcategorySlug = toSlug(fallbackSubcategory);
  if (subcategorySlug && !tags.includes(subcategorySlug)) tags.unshift(subcategorySlug);

  return Array.from(new Set(tags));
};

const buildStoreNameAliases = (value) => {
  const raw = String(value || '').toLowerCase().trim();
  const compact = raw.replace(/\s+/g, '');
  const aliases = new Set([raw, compact]);

  if (raw === 'plants in garden' || raw === 'plants-in-garden' || raw === 'plantingarden' || compact === 'plantsingarden') {
    aliases.add('plantsingarden');
    aliases.add('plants in garden');
    aliases.add('plants-in-garden');
    aliases.add('plantingarden');
  }

  return Array.from(aliases).filter(Boolean);
};

/**
 * Resolve subcategory slug to subcategory ID
 */
const resolveSubcategoryId = async (categoryId, subcategorySlug) => {
  try {
    const category = await Category.findById(categoryId);

    if (!category) {
      throw new Error(`Category with ID ${categoryId} not found`);
    }

    // Find subcategory by slug
    const subcategory = category.subcategories.find(
      (sub) => sub.slug.toLowerCase() === subcategorySlug.toLowerCase()
    );

    if (subcategory) {
      return subcategory._id.toString();
    }

    console.warn(`⚠️ Subcategory not found: ${subcategorySlug}. Creating new subcategory...`);

    // Create new subcategory if it doesn't exist
    const newSubcategory = {
      name: subcategorySlug
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
      slug: subcategorySlug.toLowerCase(),
      description: ''
    };

    category.subcategories.push(newSubcategory);
    const updatedCategory = await category.save();
    
    // Return the newly added subcategory's ID
    const addedSubcategory = updatedCategory.subcategories[updatedCategory.subcategories.length - 1];
    return addedSubcategory._id.toString();
  } catch (error) {
    console.error('Error resolving subcategory:', error);
    throw new Error(`Failed to resolve subcategory: ${subcategorySlug}`);
  }
};

/**
 * Resolve category name to category ID
 * If category doesn't exist, create it
 */
const resolveCategoryId = async (categoryName) => {
  try {
    const category = await Category.findOne({
      name: { $regex: new RegExp(`^${categoryName}$`, 'i') }
    });

    if (category) {
      return category._id.toString();
    }

    console.warn(`⚠️ Category not found: ${categoryName}. Creating new category...`);
    
    // Create new category if it doesn't exist
    const newCategory = new Category({
      name: categoryName,
      slug: categoryName.toLowerCase().replace(/\s+/g, '-'),
      description: `${categoryName} category`,
      subcategories: []
    });
    
    const savedCategory = await newCategory.save();
    return savedCategory._id.toString();
  } catch (error) {
    console.error('Error resolving category:', error);
    throw new Error(`Failed to resolve category: ${categoryName}`);
  }
};

/**
 * Main bulk upload orchestrator
 * Process: Download → Optimize → Upload to S3 → Save to DB
 * @param {object[]} products
 * @param {{ jobId?: string }} options
 */
const processBulkUpload = async (products, options = {}) => {
  const { jobId } = options;
  const results = [];
  let successCount = 0;
  let failureCount = 0;

  const reportProgress = (patch) => {
    if (jobId) {
      patchBulkUploadJob(jobId, {
        ...patch,
        results: [...results],
      });
    }
  };

  console.log(`🔄 Starting bulk upload for ${products.length} products...`);

  const { valid, invalid } = validateBulkProducts(products);

  invalid.forEach((item) => {
    results.push({
      success: false,
      productName: item.product.name || 'Unknown',
      errors: item.errors,
    });
    failureCount++;
  });

  reportProgress({
    processed: invalid.length,
    failureCount,
    successCount,
  });

  console.log(`✅ Valid products: ${valid.length}, ❌ Invalid products: ${invalid.length}`);

  for (let i = 0; i < valid.length; i++) {
    const product = valid[i];
    const processedSoFar = invalid.length + i;

    reportProgress({
      currentProduct: product.name,
      processed: processedSoFar,
      successCount,
      failureCount,
    });

    console.log(`\n🔄 Processing product ${i + 1}/${valid.length}: ${product.name}`);

    try {
      const uploadItem = {
        success: true,
        productName: product.name,
        driveImageUrls: product.images || [],
      };

      console.log(`  📥 Processing ${product.images.length} images (parallel ×${IMAGE_CONCURRENCY})...`);
      const { s3ImageUrls, errors: imageErrors } = await processProductImages(
        product.images,
        product.name
      );

      if (imageErrors.length) {
        uploadItem.errors = imageErrors;
      }

      if (s3ImageUrls.length === 0) {
        throw new Error('No images could be downloaded and uploaded to S3');
      }

      // Step 2c: Replace Google Drive URLs with S3 URLs
      // Step 2c1: Resolve category name to category ID
      const resolvedCategoryId = await resolveCategoryId(product.category);
      const categoryDoc = await Category.findById(resolvedCategoryId);
      const categoryName = categoryDoc.name;

      // Step 2c2: Verify subcategory slug exists in category (don't convert to ID, keep slug for filtering)
      const categoryForSubcat = await Category.findById(resolvedCategoryId);
      const subcategorySlug = toSlug(product.subcategory);
      
      const subcategoryExists = categoryForSubcat.subcategories.some(
        (sub) => sub.slug.toLowerCase() === subcategorySlug
      );

      if (!subcategoryExists) {
        console.warn(`⚠️ Subcategory not found: ${subcategorySlug}. Creating...`);
        
        const newSubcategory = {
          name: subcategorySlug
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' '),
          slug: subcategorySlug,
          description: ''
        };
        
        categoryForSubcat.subcategories.push(newSubcategory);
        await categoryForSubcat.save();
      }

      // DEBUG: Log what we're receiving from frontend
      console.log(`\n📦 Processing product: ${product.name}`);
      console.log('   Received sizeVariants:', JSON.stringify(product.sizeVariants));
      console.log('   Discount:', product.discount);

      const productData = {
        ...product,
        category: resolvedCategoryId, // Use resolved category ID
        categoryName: categoryName, // Store category name for filtering
        subcategory: subcategorySlug, // Keep slug for filtering
        tags: normalizeTags(product.tags, subcategorySlug),
        // Apply discount to size variants (already parsed by frontend)
        sizeVariants: product.sizeVariants && Array.isArray(product.sizeVariants)
          ? product.sizeVariants.map(variant => ({
              id: variant.id,
              name: variant.name,
              price: variant.price,
              originalPrice: variant.originalPrice,
              tag: variant.tag
            }))
          : [],
        // POT VARIANTS DISABLED FOR NOW - focus on size variants only
        potVariants: [],
        // Parse benefits and care into arrays (split by | or ,)
        benefits: product.benefits 
          ? product.benefits
              .split(/[|,]/)
              .map(b => b.trim())
              .filter(b => b.length > 0)
          : [],
        care: product.care
          ? product.care
              .split(/[|,]/)
              .map(c => c.trim())
              .filter(c => c.length > 0)
          : [],
        images: s3ImageUrls
      };

      // Debug logging
      console.log(`  📝 Product data being saved:`);
      console.log(`     sizeVariants: ${JSON.stringify(productData.sizeVariants)}`);
      console.log(`     Tags: ${JSON.stringify(productData.tags)}`);
      console.log(`     Description: ${productData.description ? productData.description.substring(0, 50) + '...' : 'EMPTY'}`);
      console.log(`     Benefits: ${JSON.stringify(productData.benefits)}`);
      console.log(`     Care: ${JSON.stringify(productData.care)}`);

      // Check for exact duplicate
      if (!options.allowDuplicates) {
        const duplicateCheck = await Product.findOne({
          name: productData.name,
          category: productData.category,
          subcategory: productData.subcategory,
          originalPrice: productData.originalPrice,
          finalPrice: productData.finalPrice
        });

        if (duplicateCheck) {
          throw new Error('Exact duplicate product already exists');
        }
      }

      // Sync base prices with the lowest variant price
      if (productData.sizeVariants && productData.sizeVariants.length > 0) {
        const lowestVariant = productData.sizeVariants.reduce((min, v) => (v.price < min.price ? v : min), productData.sizeVariants[0]);
        productData.finalPrice = lowestVariant.price;
        productData.originalPrice = lowestVariant.originalPrice || lowestVariant.price;
      }

      // Step 2d: Save to MongoDB
      console.log(`  💾 Saving to MongoDB...`);
      const newProduct = new Product(productData);
      const savedProduct = await newProduct.save();

      uploadItem.success = true;
      uploadItem.productId = savedProduct._id.toString();
      uploadItem.s3ImageUrls = s3ImageUrls;

      successCount++;
      console.log(`  ✅ Successfully saved product with ID: ${savedProduct._id}`);
      results.push(uploadItem);
    } catch (error) {
      failureCount++;
      console.error(`  ❌ Error processing product: ${error.message}`);

      results.push({
        success: false,
        productName: product.name,
        errors: [error.message || 'Unknown error during bulk upload'],
      });
    }

    reportProgress({
      processed: invalid.length + i + 1,
      successCount,
      failureCount,
      currentProduct: null,
    });
  }

  console.log(`\n📊 Bulk Upload Complete!`);
  console.log(`   Total: ${products.length} | Success: ${successCount} | Failed: ${failureCount}`);

  const summary = {
    totalProducts: products.length,
    successCount,
    failureCount,
    results,
  };

  reportProgress({
    processed: products.length,
    successCount,
    failureCount,
    currentProduct: null,
    results,
  });

  return summary;
};

/**
 * Get all products
 */
const getAllProducts = async (filters) => {
  try {
    let query = {};

    if (filters?.storeName) {
      const storeAliases = buildStoreNameAliases(filters.storeName);
      query.$or = [
        { storeName: { $in: storeAliases } },
        { storeName: { $exists: false } },
        { storeName: null },
        { storeName: '' },
      ];
    }

    if (filters?.category) {
      query.category = filters.category;
    }

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.stockStatus) {
      if (filters.stockStatus === 'in-stock') {
        query.stock = { $gt: 0 };
      } else if (filters.stockStatus === 'low-stock') {
        query.stock = { $gt: 0, $lt: 100 };
      } else if (filters.stockStatus === 'out-of-stock') {
        query.stock = 0;
      }
    }

    const limit = filters?.limit || 50;
    const skip = filters?.skip || 0;

    let products = await Product.find(query).limit(limit).skip(skip).sort({ createdAt: -1 });
    
    // Enrich products with category names from categoryName field
    // If categoryName is not available, try to extract from category field
    products = products.map(product => {
      const productObj = product.toObject ? product.toObject() : product;
      return {
        ...productObj,
        categoryName: productObj.categoryName || productObj.category
      };
    });

    const total = await Product.countDocuments(query);

    return {
      success: true,
      data: products,
      pagination: {
        total,
        limit,
        skip,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch products'
    };
  }
};

/**
 * Get product by ID
 */
const getProductById = async (productId) => {
  try {
    const product = await Product.findById(productId);

    if (!product) {
      return {
        success: false,
        error: 'Product not found'
      };
    }

    return {
      success: true,
      data: product
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch product'
    };
  }
};

/**
 * Update product
 */
const updateProduct = async (productId, updates) => {
  try {
    // Fetch existing product to merge before validation
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      return {
        success: false,
        error: 'Product not found'
      };
    }

    const mergedData = { ...existingProduct.toObject(), ...updates };

    // Sync base prices with the lowest variant price
    if (mergedData.sizeVariants && mergedData.sizeVariants.length > 0) {
      const lowestVariant = mergedData.sizeVariants.reduce((min, v) => (v.price < min.price ? v : min), mergedData.sizeVariants[0]);
      mergedData.finalPrice = lowestVariant.price;
      mergedData.originalPrice = lowestVariant.originalPrice || lowestVariant.price;
      
      // Ensure the computed prices are set on the updates object so they get saved
      updates.finalPrice = mergedData.finalPrice;
      updates.originalPrice = mergedData.originalPrice;
    }

    // Validate merged updates
    const validationResult = validateProduct(mergedData);
    if (!validationResult.isValid) {
      return {
        success: false,
        errors: validationResult.errors
      };
    }

    const product = await Product.findByIdAndUpdate(productId, updates, { new: true });

    if (!product) {
      return {
        success: false,
        error: 'Product not found'
      };
    }

    // Log StockMovement if stock was updated
    if (updates.stock !== undefined && existingProduct.stock !== updates.stock) {
      const delta = updates.stock - existingProduct.stock;
      try {
        await StockMovement.create({
          productId: product._id,
          delta: delta,
          reason: updates.stockMovementReason || 'Manual Adjustment',
          notes: 'Updated via bulk/admin update'
        });
      } catch (err) {
        console.error('Failed to log stock movement:', err);
        // Do not fail the entire update if just the log fails
      }
    }

    return {
      success: true,
      data: product
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to update product'
    };
  }
};

/**
 * Delete product
 */
const deleteProduct = async (productId) => {
  try {
    const product = await Product.findByIdAndDelete(productId);

    if (!product) {
      return {
        success: false,
        error: 'Product not found'
      };
    }

    return {
      success: true,
      message: 'Product deleted successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to delete product'
    };
  }
};

/**
 * Bulk delete products
 */
const bulkDeleteProducts = async (productIds) => {
  try {
    const result = await Product.deleteMany({ _id: { $in: productIds } });

    return {
      success: true,
      message: `${result.deletedCount} products deleted successfully`,
      deletedCount: result.deletedCount
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to bulk delete products'
    };
  }
};

/**
 * Search products by name
 */
const searchProducts = async (query, limit = 20, storeName) => {
  try {
    const searchFilter = {
      $text: { $search: query }
    };

    if (storeName) {
      const normalizedStoreName = String(storeName).toLowerCase().trim();
      searchFilter.$or = [
        { storeName: normalizedStoreName },
        { storeName: { $exists: false } },
        { storeName: null },
        { storeName: '' },
      ];
    }

    const products = await Product.find(
      searchFilter,
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit);

    return {
      success: true,
      data: products,
      count: products.length
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Search failed'
    };
  }
};

module.exports = {
  processBulkUpload,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
  searchProducts
};
