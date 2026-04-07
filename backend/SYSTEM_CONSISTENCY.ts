/**
 * SYSTEM CONSISTENCY DOCUMENT
 * Single Source of Truth for Field Names, Enums, Types
 * Use this EVERYWHERE - Backend, Frontend, Database
 */

// ============================================
// PRODUCT DATA STRUCTURE
// ============================================

interface Product {
  _id: string;
  name: string;
  category: string;
  subcategory: string;
  
  // Pricing
  originalPrice: number;
  finalPrice: number;
  discount?: number;
  
  // Rating & Reviews
  rating: number;
  reviews: number;
  
  // Images (AWS S3 URLs ONLY)
  images: string[]; // [url1, url2, url3, url4]
  
  // Description
  description?: string;
  
  // Size Variants
  sizeVariants: Variant[];
  
  // Pot Variants
  potVariants: Variant[];
  
  // Metadata
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
}

interface Variant {
  id: number;
  name: string;
  price: number;
  tag?: string; // e.g., "Most Loved"
}

// ============================================
// ENUMS & CONSTANTS
// ============================================

enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft'
}

enum UploadStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  PENDING = 'pending'
}

// ============================================
// BULK UPLOAD REQUEST/RESPONSE
// ============================================

interface BulkUploadRequest {
  products: BulkProductItem[];
}

interface BulkProductItem {
  name: string;
  category: string;
  subcategory: string;
  originalPrice: number;
  finalPrice: number;
  rating: number;
  reviews: number;
  description?: string;
  images: string[]; // Google Drive URLs (will be converted to S3)
  sizeVariants?: Variant[];
  potVariants?: Variant[];
}

interface BulkUploadResponse {
  success: number;
  failed: number;
  total: number;
  errors: UploadError[];
  results: UploadResult[];
}

interface UploadError {
  rowIndex: number;
  productName: string;
  error: string;
  status: UploadStatus.FAILED;
}

interface UploadResult {
  rowIndex: number;
  productName: string;
  productId: string;
  status: UploadStatus.SUCCESS;
  message: string;
}

// ============================================
// API ENDPOINTS
// ============================================

/*
POST /api/products/bulk-upload
Body: BulkUploadRequest
Response: BulkUploadResponse

POST /api/products
Body: Product
Response: { success: true, product: Product }

GET /api/products
Response: { success: true, products: Product[] }

GET /api/products/:id
Response: { success: true, product: Product }

PUT /api/products/:id
Body: Partial<Product>
Response: { success: true, product: Product }

DELETE /api/products/:id
Response: { success: true, message: "Product deleted" }
*/

// ============================================
// DATABASE SCHEMA FIELD NAMES
// ============================================

const FIELD_NAMES = {
  // Product
  id: '_id',
  name: 'name',
  category: 'category',
  subcategory: 'subcategory',
  originalPrice: 'originalPrice',
  finalPrice: 'finalPrice',
  discount: 'discount',
  rating: 'rating',
  reviews: 'reviews',
  images: 'images',
  description: 'description',
  sizeVariants: 'sizeVariants',
  potVariants: 'potVariants',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  
  // Variant
  variantId: 'id',
  variantName: 'name',
  variantPrice: 'price',
  variantTag: 'tag'
};

// ============================================
// VALIDATION RULES
// ============================================

const VALIDATION_RULES = {
  name: {
    required: true,
    type: 'string',
    minLength: 3,
    maxLength: 100
  },
  category: {
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 50
  },
  subcategory: {
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 50
  },
  originalPrice: {
    required: true,
    type: 'number',
    min: 0,
    max: 999999
  },
  finalPrice: {
    required: true,
    type: 'number',
    min: 0,
    max: 999999
  },
  rating: {
    required: true,
    type: 'number',
    min: 0,
    max: 5
  },
  reviews: {
    required: true,
    type: 'number',
    min: 0
  },
  images: {
    required: true,
    type: 'array',
    minItems: 1,
    maxItems: 10
  },
  sizeVariants: {
    required: false,
    type: 'array',
    minItems: 0
  },
  potVariants: {
    required: false,
    type: 'array',
    minItems: 0
  }
};

// ============================================
// ERROR CODES
// ============================================

enum ErrorCode {
  INVALID_NAME = 'INVALID_NAME',
  INVALID_PRICE = 'INVALID_PRICE',
  INVALID_RATING = 'INVALID_RATING',
  INVALID_IMAGE_URL = 'INVALID_IMAGE_URL',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  S3_UPLOAD_FAILED = 'S3_UPLOAD_FAILED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INVALID_GOOGLE_DRIVE_URL = 'INVALID_GOOGLE_DRIVE_URL'
}

// ============================================
// USAGE EXAMPLES
// ============================================

/*

FRONTEND - AddProductForm component
------------------------------------
const [formData, setFormData] = useState({
  name: '',
  category: '',
  subcategory: '',
  originalPrice: '',
  finalPrice: '',
  rating: '',
  reviews: '',
  images: ['', '', '', ''],
  sizeVariants: [
    { id: 1, name: 'Small', price: 0 },
  ],
  potVariants: [
    { id: 1, name: 'No Pot', price: 0, tag: '' },
  ]
});


BACKEND - Product Model
-----------------------
const productSchema = new Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  subcategory: { type: String, required: true },
  originalPrice: { type: Number, required: true },
  finalPrice: { type: Number, required: true },
  rating: { type: Number, required: true },
  reviews: { type: Number, required: true },
  images: [String], // S3 URLs
  sizeVariants: [{
    id: Number,
    name: String,
    price: Number
  }],
  potVariants: [{
    id: Number,
    name: String,
    price: Number,
    tag: String
  }],
  status: { type: String, enum: ['active', 'inactive', 'draft'] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});


FRONTEND - BulkUploadModal component
------------------------------------
const bulkUpload = async (products: BulkProductItem[]) => {
  const response = await fetch('/api/products/bulk-upload', {
    method: 'POST',
    body: JSON.stringify({ products })
  });
  const data: BulkUploadResponse = await response.json();
  // Handle errors: data.errors
  // Display success: data.success
};

*/

// ============================================
// IMPORTANT NOTES
// ============================================

/*
1. ALWAYS use field names from FIELD_NAMES constant
2. NEVER create new field names without updating this doc
3. Validate using VALIDATION_RULES for consistency
4. Use enums for status values
5. Images should ONLY store S3 URLs, never Google Drive URLs
6. When bulk uploading, convert Google Drive URLs → S3 URLs → store
7. API responses should always follow the structure defined here
8. Error handling must use ErrorCode enum
9. If you need to add a new field:
   - Add it to Product interface
   - Add it to FIELD_NAMES
   - Add it to VALIDATION_RULES
   - Update this doc
   - Implement everywhere (backend, frontend, DB)
*/

export {
  Product,
  Variant,
  BulkUploadRequest,
  BulkUploadResponse,
  BulkProductItem,
  UploadError,
  UploadResult,
  ProductStatus,
  UploadStatus,
  ErrorCode,
  FIELD_NAMES,
  VALIDATION_RULES
};
