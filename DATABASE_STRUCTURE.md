# ERP v1.04.26 - Database Schema & Collection Structure

## Overview
MongoDB database storing multi-tenant e-commerce data with admin stores, products, customers, and orders.

## Database Info
- **Name**: `plants-mall` (MongoDB Atlas)
- **URI**: `mongodb+srv://plants-mall:plants2003@plants-mall.otyfvij.mongodb.net/plants-mall`
- **Connection**: Mongoose (backend/server.js)

---

## Collections

### 1. **admins**
Store admins with role-based access control

```javascript
{
  _id: ObjectId,
  email: String (unique),
  name: String,
  storeName: String,           // Which store this admin manages
  role: String,                // "super_admin" | "store_admin"
  password: String,            // bcrypt hashed
  phone: String,
  address: String,
  permissions: [String],       // e.g., ["manage_products", "manage_customers", "manage_orders"]
  isActive: Boolean,           // Default: true
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date
}
```

**Indexes**:
- `email` (unique)
- `storeName`
- `role`

**Queries**:
```javascript
// Login
db.admins.findOne({ email: "admin@store.com" })

// Get all admins for super admin
db.admins.find({ role: "super_admin" })

// Get store admins
db.admins.find({ storeName: "Plants Mall", role: "store_admin" })
```

---

### 2. **customers**
Customer accounts (store-specific or global)

```javascript
{
  _id: ObjectId,
  email: String (unique),
  name: String,
  password: String,            // bcrypt hashed
  phone: String,
  storeName: String,           // Which store customer registered on (optional)
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: String
  },
  defaultAddressId: ObjectId,  // Reference to addresses array
  addresses: [
    {
      _id: ObjectId,
      type: String,            // "home" | "office" | "other"
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: String,
      isDefault: Boolean
    }
  ],
  cart: [
    {
      productId: ObjectId,
      variantId: String,
      quantity: Number,
      addedAt: Date
    }
  ],
  wishlist: [ObjectId],        // Product IDs
  orders: [ObjectId],          // Order IDs
  preferences: {
    newsletter: Boolean,       // Email opt-in
    notifications: Boolean,
    currency: String,          // "INR" | "USD"
    language: String           // "en" | "hi"
  },
  isActive: Boolean,           // Default: true
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `email` (unique)
- `storeName`
- `isActive`

**Queries**:
```javascript
// Login
db.customers.findOne({ email: "customer@example.com" })

// Get all customers for a store
db.customers.find({ storeName: "Plants Mall" })

// Get all customers (super admin only)
db.customers.find({})

// Get customer cart
db.customers.findOne({ _id: customerId }, { cart: 1 })
```

---

### 3. **categories**
Product categories with hierarchy

```javascript
{
  _id: ObjectId,
  name: String,                // e.g., "Indoor Plants", "Succulents"
  slug: String (unique),       // URL-friendly name
  description: String,
  parentId: ObjectId,          // For subcategories (optional)
  image: String,               // S3 URL
  storeName: String,           // Which store this category belongs to
  displayOrder: Number,        // For sorting in UI
  isActive: Boolean,           // Default: true
  metadata: {
    seoTitle: String,
    seoDescription: String,
    keywords: [String]
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `slug` (unique)
- `storeName`
- `parentId`
- `isActive`

**Queries**:
```javascript
// Get all categories for a store
db.categories.find({ storeName: "Plants Mall", isActive: true })
           .sort({ displayOrder: 1 })

// Get subcategories
db.categories.find({ parentId: categoryId })

// Get category by slug
db.categories.findOne({ slug: "indoor-plants" })
```

---

### 4. **products**
Product information with variants and images

```javascript
{
  _id: ObjectId,
  sku: String (unique),        // Stock Keeping Unit
  name: String,
  slug: String (unique),       // URL slug
  description: String,         // HTML or markdown
  price: Number,               // Base price
  discount: {
    percentage: Number,        // 0-100
    flatAmount: Number,
    validFrom: Date,
    validTo: Date
  },
  category: {
    id: ObjectId,
    name: String
  },
  storeName: String,
  stock: {
    quantity: Number,
    reserved: Number,
    available: Number          // calculated: quantity - reserved
  },
  images: [
    {
      url: String,             // S3 URL
      alt: String,
      isDefault: Boolean
    }
  ],
  variants: [
    {
      _id: ObjectId,
      name: String,            // e.g., "Color", "Size"
      options: [
        {
          _id: ObjectId,
          label: String,       // e.g., "Red", "Large"
          sku: String,
          price: Number,       // Variant-specific price override (optional)
          stock: Number,
          images: [
            {
              url: String,
              alt: String
            }
          ]
        }
      ]
    }
  ],
  attributes: {
    care: String,             // Care instructions (HTML)
    benefits: String,         // Benefits (HTML)
    dimensions: {
      height: Number,
      width: Number,
      depth: Number,
      unit: String            // "cm" | "inches"
    },
    weight: {
      value: Number,
      unit: String            // "kg" | "lbs"
    },
    material: String
  },
  seo: {
    title: String,
    description: String,
    keywords: [String]
  },
  reviews: [
    {
      customerId: ObjectId,
      rating: Number,         // 1-5
      title: String,
      comment: String,
      createdAt: Date
    }
  ],
  rating: {
    average: Number,          // Calculated average
    count: Number,            // Total reviews
    distribution: {
      5: Number,
      4: Number,
      3: Number,
      2: Number,
      1: Number
    }
  },
  tags: [String],            // e.g., ["air-purifying", "low-maintenance"]
  isActive: Boolean,
  isFeatured: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `sku` (unique)
- `slug` (unique)
- `storeName`
- `category.id`
- `isActive`
- `isFeatured`
- `rating.average`

**Queries**:
```javascript
// Get all products for store
db.products.find({ storeName: "Plants Mall", isActive: true })

// Get product by slug
db.products.findOne({ slug: "monstera-deliciosa" })

// Search products
db.products.find({
  storeName: "Plants Mall",
  $or: [
    { name: /monstera/i },
    { description: /monstera/i }
  ]
})

// Get top-rated products
db.products.find({ storeName: "Plants Mall" })
          .sort({ "rating.average": -1 })
          .limit(10)

// Get category products
db.products.find({
  storeName: "Plants Mall",
  "category.id": categoryId,
  isActive: true
})
```

---

### 5. **orders**
Customer orders with items and status

```javascript
{
  _id: ObjectId,
  orderNumber: String (unique),   // e.g., "ORD-20240101-0001"
  customerId: ObjectId,
  storeName: String,
  items: [
    {
      productId: ObjectId,
      productName: String,
      variantId: String,
      variantLabel: String,
      quantity: Number,
      price: Number,             // Price at time of order
      subtotal: Number           // quantity * price
    }
  ],
  status: String,                // "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" | "returned"
  paymentStatus: String,         // "pending" | "completed" | "failed" | "refunded"
  paymentMethod: String,         // "card" | "upi" | "cod" | "wallet"
  paymentId: String,             // Payment gateway transaction ID
  shippingAddress: {
    name: String,
    email: String,
    phone: String,
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: String
  },
  billingAddress: {
    // Same structure as shippingAddress
  },
  pricing: {
    subtotal: Number,
    tax: Number,
    shippingCost: Number,
    discount: Number,
    total: Number
  },
  tracking: {
    trackingNumber: String,
    carrier: String,            // "FedEx" | "UPS" | etc
    estimatedDelivery: Date,
    actualDelivery: Date,
    updates: [
      {
        status: String,
        timestamp: Date,
        details: String
      }
    ]
  },
  notes: String,
  giftWrap: Boolean,
  giftMessage: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `orderNumber` (unique)
- `customerId`
- `storeName`
- `status`
- `paymentStatus`
- `createdAt`

**Queries**:
```javascript
// Get customer orders
db.orders.find({ customerId: customerId })
        .sort({ createdAt: -1 })

// Get pending orders for store
db.orders.find({ storeName: "Plants Mall", status: "pending" })

// Get orders by status
db.orders.find({ status: "shipped" })
        .sort({ createdAt: -1 })
```

---

### 6. **bulkupload**
Track bulk product uploads (Excel imports)

```javascript
{
  _id: ObjectId,
  adminId: ObjectId,
  storeName: String,
  fileName: String,
  fileUrl: String,             // S3 URL of uploaded Excel
  status: String,              // "pending" | "processing" | "completed" | "failed"
  totalRows: Number,
  successCount: Number,
  failureCount: Number,
  errors: [
    {
      rowNumber: Number,
      column: String,
      error: String
    }
  ],
  processedProducts: [
    {
      sku: String,
      status: String,          // "created" | "updated" | "failed"
      productId: ObjectId
    }
  ],
  createdAt: Date,
  startedAt: Date,
  completedAt: Date
}
```

**Queries**:
```javascript
// Get recent uploads for store
db.bulkupload.find({ storeName: "Plants Mall" })
            .sort({ createdAt: -1 })
            .limit(10)

// Get failed uploads
db.bulkupload.find({ status: "failed" })
```

---

### 7. **inventory**
Inventory tracking and stock management

```javascript
{
  _id: ObjectId,
  productId: ObjectId,
  variantId: String,
  storeName: String,
  quantity: Number,            // Total stock
  reserved: Number,            // Reserved for pending orders
  sold: Number,               // Lifetime units sold
  reorderLevel: Number,       // Alert when stock falls below this
  lastRestockDate: Date,
  movements: [
    {
      type: String,           // "purchase" | "sale" | "return" | "adjustment"
      quantity: Number,
      reason: String,
      orderId: ObjectId,
      date: Date
    }
  ],
  updatedAt: Date
}
```

---

### 8. **stores**
Multi-tenant store configuration (optional)

```javascript
{
  _id: ObjectId,
  name: String (unique),       // e.g., "Plants Mall"
  slug: String (unique),
  description: String,
  logo: String,               // S3 URL
  banner: String,             // S3 URL
  email: String,
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: String
  },
  website: String,
  currency: String,           // "INR" | "USD"
  timezone: String,
  isActive: Boolean,
  settings: {
    taxRate: Number,
    shippingCost: Number,
    freeShippingAbove: Number,
    orderNotifications: Boolean
  },
  createdAt: Date,
  updatedAt: Date
}
```

---

## Data Relationships

```
┌─────────┐         ┌──────────────┐
│  Admin  │────────→│ storeName    │
└─────────┘         └──────────────┘
     │
     │ creates/manages
     ↓
┌─────────────┐
│  Products   │
└─────────────┘
     ↑
     │ references
     │
┌───────────┐       ┌─────────────┐
│Categories │◄──────│  Products   │
└───────────┘       └─────────────┘

┌───────────┐       ┌─────────────┐
│Customers  │──────→│   Orders    │
└───────────┘       └─────────────┘
                          │
                          ├─→ products
                          └─→ shipping address
```

---

## Aggregation Examples

### Get top products by sales
```javascript
db.orders.aggregate([
  { $match: { storeName: "Plants Mall" } },
  { $unwind: "$items" },
  { $group: {
      _id: "$items.productId",
      totalSold: { $sum: "$items.quantity" },
      revenue: { $sum: "$items.subtotal" }
    }
  },
  { $sort: { revenue: -1 } },
  { $limit: 10 },
  { $lookup: {
      from: "products",
      localField: "_id",
      foreignField: "_id",
      as: "product"
    }
  }
])
```

### Get customer order stats
```javascript
db.orders.aggregate([
  { $match: { customerId: customerId } },
  { $group: {
      _id: null,
      totalOrders: { $sum: 1 },
      totalSpent: { $sum: "$pricing.total" },
      avgOrderValue: { $avg: "$pricing.total" }
    }
  }
])
```

---

## Migration Notes

- **TypeScript Versions**: Some models have `.ts` versions (Product.ts, products.ts) - consolidate to single source
- **Legacy JSX**: Some components are `.jsx` - consider converting to `.tsx`
- **User Model**: Appears deprecated in favor of Admin + Customer separation
