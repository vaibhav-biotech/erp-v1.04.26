# 🚀 Store Rename: "store 1" → "plants-in-garden"

## Action Plan

### What to Update:

#### 1️⃣ Frontend - Signup Form
**File**: `frontend/src/app/auth/login/page.tsx`
**Change**: `X-Store-Name: 'store 1'` → `X-Store-Name: 'plants-in-garden'`
**Impact**: All new customer signups will be saved to "plants-in-garden" store

#### 2️⃣ Admin Account Check
**File**: Check MongoDB or backend
**Current Admin**: plantsingarden@plantsmall.com
**Should have**: `storeName: "plants-in-garden"`
**Impact**: Admin manages "plants-in-garden" store

#### 3️⃣ Backend Default Store (Optional)
**File**: `backend/routes/auth.js` (signup route)
**Current**: Fallback to 'test' if no store header
**Can Change**: Fallback to 'plants-in-garden' instead
**Impact**: Safety net if header missing

---

## After Update - Data Flow:

```
Customer Signs Up
    ↓
Sends: X-Store-Name: "plants-in-garden"
    ↓
Saved to MongoDB with:
    {
      store: "plants-in-garden",
      email: "customer@example.com",
      ...
    }
    ↓
Admin Dashboard (plantsingarden@plantsmall.com)
    ↓
Views customers where store = "plants-in-garden" only
    ↓
Sees the new customer ✅
```

---

## Database Collections After Update:

**Same collection**, but filtered by store name:

- `customers` where `store = "plants-in-garden"` ✅
- `products` where `storeName = "plants-in-garden"` ✅
- `categories` where `storeName = "plants-in-garden"` ✅
- `orders` where `storeName = "plants-in-garden"` ✅

---

## Quick Summary:

✅ **Store Name**: "plants-in-garden"
✅ **Domain**: www.plantingarden.com
✅ **Admin Email**: plantsingarden@plantsmall.com
✅ **What Gets Stored**: 
   - Customers signups
   - Orders
   - Products
   - All data is isolated per store in shared collections

---

## What Stays the Same:

- MongoDB collections remain SHARED (customers, products, categories, orders)
- Data is just filtered by `store: "plants-in-garden"`
- Admin token already maps to store
- No database migration needed ✅

