const Product = require('../models/Product');
const Category = require('../models/Category');
const { uploadImageToS3 } = require('./s3.service');
const { downloadFromGoogleDrive } = require('./drive.service');
const { validateProduct, validateBulkProducts, parseVariants } = require('./validation.service');

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
 * Process: Download → Validate → Upload to S3 → Save to DB
 */
const processBulkUpload = async (products) => {
  const results = [];
  let successCount = 0;
  let failureCount = 0;

  console.log(`🔄 Starting bulk upload for ${products.length} products...`);

  // Step 1: Validate all products first
  console.log('📋 Validating products...');
  const { valid, invalid } = validateBulkProducts(products);

  // Add invalid products to results
  invalid.forEach(item => {
    results.push({
      success: false,
      productName: item.product.name || 'Unknown',
      errors: item.errors
    });
    failureCount++;
  });

  console.log(`✅ Valid products: ${valid.length}, ❌ Invalid products: ${invalid.length}`);

  // Step 2: Process valid products
  for (let i = 0; i < valid.length; i++) {
    const product = valid[i];
    console.log(`\n🔄 Processing product ${i + 1}/${valid.length}: ${product.name}`);

    try {
      const uploadItem = {
        success: true,
        productName: product.name,
        driveImageUrls: product.images || []
      };

      // Step 2a: Download images from Google Drive
      console.log(`  📥 Downloading ${product.images.length} images from Google Drive...`);
      const downloadedImages = [];

      for (let j = 0; j < product.images.length; j++) {
        const driveUrl = product.images[j];
        console.log(`    Downloading image ${j + 1}/${product.images.length}...`);

        const driveResult = await downloadFromGoogleDrive(driveUrl);

        if (!driveResult.success || !driveResult.buffer) {
          console.error(`    ❌ Failed to download: ${driveResult.error}`);
          uploadItem.success = false;
          uploadItem.errors = uploadItem.errors || [];
          uploadItem.errors.push(`Image ${j + 1} download failed: ${driveResult.error}`);
          continue;
        }

        downloadedImages.push({
          url: driveUrl,
          buffer: driveResult.buffer
        });
        console.log(`    ✅ Downloaded ${driveResult.buffer.length} bytes`);
      }

      if (downloadedImages.length === 0) {
        throw new Error('No images could be downloaded from Google Drive');
      }

      // Step 2b: Upload downloaded images to S3
      console.log(`  📤 Uploading ${downloadedImages.length} images to AWS S3...`);
      const s3ImageUrls = [];

      for (let j = 0; j < downloadedImages.length; j++) {
        const image = downloadedImages[j];
        const fileName = `product-${Date.now()}-${j}.jpg`;

        console.log(`    Uploading to S3: ${fileName}...`);
        const s3Result = await uploadImageToS3(image.buffer, fileName, 'image/jpeg');

        if (!s3Result.success || !s3Result.url) {
          console.error(`    ❌ S3 upload failed: ${s3Result.error}`);
          uploadItem.success = false;
          uploadItem.errors = uploadItem.errors || [];
          uploadItem.errors.push(`S3 upload failed: ${s3Result.error}`);
          continue;
        }

        s3ImageUrls.push(s3Result.url);
        console.log(`    ✅ Uploaded to: ${s3Result.url}`);
      }

      if (s3ImageUrls.length === 0) {
        throw new Error('No images could be uploaded to S3');
      }

      // Step 2c: Replace Google Drive URLs with S3 URLs
      // Step 2c1: Resolve category name to category ID
      const resolvedCategoryId = await resolveCategoryId(product.category);
      const categoryDoc = await Category.findById(resolvedCategoryId);
      const categoryName = categoryDoc.name;

      // Step 2c2: Verify subcategory slug exists in category (don't convert to ID, keep slug for filtering)
      const categoryForSubcat = await Category.findById(resolvedCategoryId);
      const subcategorySlug = product.subcategory.toLowerCase();
      
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
      console.log(`     Description: ${productData.description ? productData.description.substring(0, 50) + '...' : 'EMPTY'}`);
      console.log(`     Benefits: ${JSON.stringify(productData.benefits)}`);
      console.log(`     Care: ${JSON.stringify(productData.care)}`);

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
        errors: [error.message || 'Unknown error during bulk upload']
      });
    }
  }

  console.log(`\n📊 Bulk Upload Complete!`);
  console.log(`   Total: ${products.length} | Success: ${successCount} | Failed: ${failureCount}`);

  return {
    totalProducts: products.length,
    successCount,
    failureCount,
    results
  };
};

/**
 * Get all products
 */
const getAllProducts = async (filters) => {
  try {
    let query = {};

    if (filters?.storeName) {
      const normalizedStoreName = String(filters.storeName).toLowerCase().trim();
      query.$or = [
        { storeName: normalizedStoreName },
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
    // Validate updates
    const validationResult = validateProduct({ ...updates });
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
  searchProducts
};
