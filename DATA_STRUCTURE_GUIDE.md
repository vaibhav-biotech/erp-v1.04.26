# Data Structure Explanation - Common vs Separated by Store

## Current Setup
- **Admin**: admin@plantsmall.com (email: plantsingarden@plantsmall.com)
- **Store**: store 1
- **All customers who signup will be saved to: store: 'store 1'**

---

## Collections Overview (plants-mall database)

### 🟢 SEPARATED BY STORE (storeName field)
Each store has its own data:

1. **customers** ✅
   - Field: `store: "store 1"`
   - Meaning: Each store has different customers
   - Example: store 1 customers ≠ store 2 customers
   - Your admin sees only: `customers where store = "store 1"`

2. **products** ✅
   - Field: `storeName: "store 1"`
   - Meaning: Each store has different products
   - Example: Plant A exists in store 1 but not in store 2
   - Admin adds products = goes to store 1 products only

3. **categories** ✅
   - Field: `storeName: "store 1"`
   - Meaning: Each store has different categories
   - Example: "Indoor Plants" category in store 1 ≠ store 2
   - Admin creates category = only for store 1

4. **orders** ✅
   - Field: `storeName: "store 1"`
   - Meaning: Each store has different orders
   - Example: Orders from store 1 ≠ orders from store 2

---

### 🔵 COMMON/SHARED (NO storeName field)
ALL stores use the same data:

1. **admins** - SHARED
   - Field: `storeName: "store 1"` (identifies which admin manages which store)
   - Data itself is SHARED collection
   - All store admins are in ONE admins collection
   - Example: admin@plantsmall.com manages store 1

2. **users** - SHARED (if used)
   - Global user data (not store-specific)
   - Example: Super admin account

---

## Data Flow Example

### When Customer Signs Up:
```
Frontend Signup Form
    ↓
Send: { email, password, firstName, lastName, phone }
Send Header: X-Store-Name: "store 1"
    ↓
Backend storeRouter Middleware
    ↓
Detects: req.storeName = "store 1"
    ↓
Signup creates Customer with: { store: "store 1", ...otherData }
    ↓
Saved to: customers collection
    ↓
Admin views customers (sends Authorization + token)
    ↓
Backend returns: customers where store = "store 1"
```

---

## Your Current Setup

### Admin: admin@plantsmall.com
- Email: plantsingarden@plantsmall.com
- Store: store 1
- Can see: All data for store 1 only

### Collections Admin Can Access:

✅ **Customers (store 1 only)**
- Can view signups
- Can manage customers
- See: `customers where store = "store 1"`

✅ **Products (store 1 only)**
- Can add/edit/delete products
- See: `products where storeName = "store 1"`

✅ **Categories (store 1 only)**
- Can manage categories
- See: `categories where storeName = "store 1"`

✅ **Orders (store 1 only)**
- Can view orders
- See: `orders where storeName = "store 1"`

---

## Current Issue Status

✅ **FIXED**: Customers now saved to correct store
- Signup sends: `X-Store-Name: "store 1"`
- Backend uses: `req.storeName` from middleware
- Customers saved with: `store: "store 1"`

✅ **FIXED**: Admin can see customers
- CustomersPage sends Authorization token
- Backend filters: `customers where store = "store 1"`
- Admin sees only their store's customers

---

## To Verify Everything Works:

1. Sign up a new customer
2. Check MongoDB: `customers.findOne({store: "store 1"})`
3. Should see the new signup with `store: "store 1"`
4. Store admin dashboard → Customers page
5. Should display the new customer

