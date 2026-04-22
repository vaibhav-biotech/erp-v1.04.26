# ERP v1.04.26 - Backend Folder Structure

## Overview
Express.js backend with MongoDB, serving the e-commerce platform with admin and customer authentication.

## Directory Structure

```
backend/
├── models/
│   ├── Admin.js                 # Admin/Store Admin schema with role, permissions
│   ├── Category.js              # Product categories
│   ├── Customer.js              # Customer accounts with store field
│   ├── Product.js               # Products with variants
│   ├── Product.ts               # TypeScript version
│   └── User.js                  # Legacy user model (deprecated)
│
├── routes/
│   ├── admin.js                 # Admin CRUD operations
│   ├── auth.js                  # Unified login (admin + customer)
│   ├── customers.js             # Customer management (GET /all for super admin)
│   ├── products.js              # Product routes
│   ├── products.ts              # TypeScript version
│   └── [other routes]
│
├── services/
│   ├── bulkupload.service.js    # Bulk product upload logic
│   ├── bulkupload.service.ts    # TypeScript version
│   ├── drive.service.js         # Google Drive integration
│   ├── drive.service.ts
│   ├── s3.service.js            # AWS S3 image upload
│   ├── s3.service.ts
│   ├── validation.service.js    # Data validation
│   └── validation.service.ts
│
├── middleware/
│   ├── storeRouter.js           # Store detection middleware
│   └── [auth middleware]
│
├── .env                         # Environment variables
├── server.js                    # Express app setup & DB connection
├── tsconfig.json                # TypeScript config
├── package.json                 # Dependencies
│
├── seed.js                      # Seed initial data
├── seedCategories.js            # Seed categories
├── seedCustomer.js              # Seed customers
│
└── SYSTEM_CONSISTENCY.ts        # System validation checks
```

## Key Components

### Routes

#### `/api/auth/login` - POST
- Unified login for both Admin and Customer
- Returns JWT token with role, storeName (for admins)
- Checks Admin model first, then Customer model

#### `/api/admin/*` - Admin Routes
- Manage store admins
- RBAC protected

#### `/api/customers` - GET
- Store-specific customers
- Filters by admin's storeName

#### `/api/customers/all` - GET
- All customers across all stores
- Super admin only (role check in JWT)

#### `/api/products` - Product Routes
- Create, read, update, delete products
- Store-specific operations

### Services

- **S3 Service**: Upload product images to AWS S3
- **Bulk Upload**: Process Excel files for bulk product import
- **Drive Service**: Integration with Google Drive
- **Validation Service**: Validate products, customers, data integrity

### Middleware

- **storeRouter**: Detects which store is accessing the API
- Extracts storeName from request and sets `req.storeName`

## Database Connection

- **URI**: `process.env.MONGODB_URI`
- **Default**: `mongodb://localhost:27017/erp-db`
- **Current**: MongoDB Atlas (plants-mall database)

## Environment Variables

```
MONGODB_URI=mongodb+srv://plants-mall:plants2003@plants-mall.otyfvij.mongodb.net/plants-mall
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:3000
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=...
```

## Authentication Flow

1. User sends email + password to `/api/auth/login`
2. Check Admin collection (with role field)
3. If found & password correct:
   - Generate JWT: `{ id, type: 'admin', role: 'super_admin' | 'store_admin', storeName }`
   - Return admin data + token
4. Else check Customer collection
5. Store token in frontend localStorage

## API Protection

- Routes check JWT token in `Authorization` header
- Extract role from decoded token
- Super Admin routes check `admin?.role === 'super_admin'`
- Store Admin routes check `admin?.storeName` for filtering
