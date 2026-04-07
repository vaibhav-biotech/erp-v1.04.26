import Product, { IProduct } from '../models/Product';
import { uploadImageToS3 } from './s3.service';
import { downloadFromGoogleDrive } from './drive.service';
import { validateProduct, validateBulkProducts } from './validation.service';

interface BulkUploadItem {
  success: boolean;
  productName?: string;
  productId?: string;
  s3ImageUrls?: string[];
  errors?: string[];
  driveImageUrls?: string[];
}

interface BulkUploadResponse {
  totalProducts: number;
  successCount: number;
  failureCount: number;
  results: BulkUploadItem[];
}

/**
 * Main bulk upload orchestrator
 * Process: Download → Validate → Upload to S3 → Save to DB
 */
export const processBulkUpload = async (products: any[]): Promise<BulkUploadResponse> => {
  const results: BulkUploadItem[] = [];
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
      const uploadItem: BulkUploadItem = {
        success: true,
        productName: product.name,
        driveImageUrls: product.images || []
      };

      // Step 2a: Download images from Google Drive
      console.log(`  📥 Downloading ${product.images.length} images from Google Drive...`);
      const downloadedImages: { url: string; buffer: Buffer }[] = [];

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
      const s3ImageUrls: string[] = [];

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
      const productData = {
        ...product,
        images: s3ImageUrls
      };

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
    } catch (error: any) {
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
export const getAllProducts = async (
  filters?: { category?: string; status?: string; limit?: number; skip?: number }
) => {
  try {
    let query: any = {};

    if (filters?.category) {
      query.category = filters.category;
    }

    if (filters?.status) {
      query.status = filters.status;
    }

    const limit = filters?.limit || 50;
    const skip = filters?.skip || 0;

    const products = await Product.find(query).limit(limit).skip(skip).sort({ createdAt: -1 });
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
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch products'
    };
  }
};

/**
 * Get product by ID
 */
export const getProductById = async (productId: string) => {
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
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch product'
    };
  }
};

/**
 * Update product
 */
export const updateProduct = async (productId: string, updates: any) => {
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
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to update product'
    };
  }
};

/**
 * Delete product
 */
export const deleteProduct = async (productId: string) => {
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
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to delete product'
    };
  }
};

/**
 * Search products by name
 */
export const searchProducts = async (query: string, limit: number = 20) => {
  try {
    const products = await Product.find(
      { $text: { $search: query } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit);

    return {
      success: true,
      data: products,
      count: products.length
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Search failed'
    };
  }
};
