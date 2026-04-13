Created 12 todos

# 🛍️ **Customer Module - Implementation Plan**

---

## **🎯 Key Architecture Decision**

✅ **Customer Dashboard Layout is DIFFERENT from Admin**
- Uses **PUBLIC NAVBAR** (like homepage)
- Sidebar navigation on LEFT side for customer options
- Clean, customer-friendly design (NOT admin/operational)
- Separate folder structure: `/customer/` instead of `/admin/`

---

## **📁 Folder Structure**

```
frontend/src/
├── app/
│   ├── auth/
│   │   ├── signup/page.tsx
│   │   ├── login/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── customer/
│   │   ├── layout.tsx (with PublicNavbar + CustomerSidebar)
│   │   ├── dashboard/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── orders/page.tsx
│   │   ├── orders/[id]/page.tsx
│   │   ├── addresses/page.tsx
│   │   ├── wishlist/page.tsx
│   │   ├── payments/page.tsx
│   │   ├── reviews/page.tsx
│   │   └── settings/page.tsx
│
├── components/
│   ├── CustomerLayout.tsx (wrapper with PublicNavbar + Sidebar)
│   ├── CustomerSidebar.tsx (left navigation)
│   ├── customer/
│   │   ├── ProfileForm.tsx
│   │   ├── AddressCard.tsx
│   │   ├── OrderCard.tsx
│   │   ├── WishlistCard.tsx
│   │   └── PaymentCard.tsx
│
├── contexts/
│   ├── AuthContext.tsx (customer auth)
│   └── CustomerContext.tsx (customer data)

backend/src/
├── models/
│   ├── Customer.ts
│   ├── Address.ts
│   ├── Order.ts
│   └── Review.ts
│
├── routes/
│   ├── auth.ts (signup, login, logout)
│   ├── customer.ts (profile, dashboard)
│   ├── addresses.ts (CRUD)
│   ├── orders.ts (history, tracking)
│   └── wishlist.ts (CRUD)
│
└── middleware/
    └── auth.ts (JWT verification)
```

---

## **🔐 Phase 1: Authentication (CURRENT)**

### Backend - Customer Model
```typescript
Customer {
  _id: ObjectId
  email: string (unique)
  password: string (hashed)
  firstName: string
  lastName: string
  phone: string
  profileImage?: string
  isEmailVerified: boolean
  preferences: {
    notifications: boolean
    newsletter: boolean
  }
  createdAt: Date
  updatedAt: Date
}
```

### Backend APIs
```
POST   /api/auth/signup          - Register new customer
POST   /api/auth/login           - Login & get JWT token
POST   /api/auth/logout          - Clear session
POST   /api/auth/refresh-token   - Refresh JWT
POST   /api/auth/verify-email    - Verify email
```

### Frontend Components
```
/auth/signup/page.tsx       - Signup form
/auth/login/page.tsx        - Login form
/auth/forgot-password/page.tsx - Password reset
```

### Frontend Context
```
AuthContext {
  user: Customer | null
  token: string | null
  isLoading: boolean
  login(email, password)
  signup(email, password, name)
  logout()
  isAuthenticated: boolean
}
```

---

## **🛋️ Phase 2: Customer Dashboard Layout**

### CustomerLayout.tsx (NEW)
```
┌─────────────────────────────────────┐
│      PublicNavbar (same as home)    │ ← Cart badge, categories, etc
├──────────────┬──────────────────────┤
│              │                      │
│  Sidebar     │   Page Content       │
│  (Left)      │   (Main)             │
│              │                      │
│ • Dashboard  │                      │
│ • Profile    │                      │
│ • Orders     │                      │
│ • Addresses  │                      │
│ • Wishlist   │                      │
│ • Payments   │                      │
│ • Reviews    │                      │
│ • Settings   │                      │
│              │                      │
└──────────────┴──────────────────────┘
```

### Routes Structure
```
/customer/dashboard       → Overview page
/customer/profile         → Edit profile
/customer/orders          → Order list
/customer/orders/[id]     → Order details
/customer/addresses       → Address management
/customer/wishlist        → Saved items
/customer/payments        → Payment methods
/customer/reviews         → My reviews
/customer/settings        → Account settings
```

---

## **📊 Phase 3-4: Core Features** (After Auth & Layout)

Will implement in order:
1. Profile management
2. Address CRUD
3. Order history & tracking
4. Wishlist
5. Payment methods
6. Reviews

---

## **🚀 Implementation Order**

### TODAY - Phase 1
- [ ] Create Customer model (MongoDB)
- [ ] Create signup API
- [ ] Create login API  
- [ ] Create AuthContext (React)
- [ ] Create signup page
- [ ] Create login page
- [ ] Setup protected routes

### NEXT - Phase 2
- [ ] Create CustomerLayout component (with PublicNavbar + Sidebar)
- [ ] Create CustomerSidebar navigation
- [ ] Create dashboard stub page
- [ ] Create profile stub page

### LATER - Phase 3+
- [ ] Build remaining pages (one by one)
- [ ] Implement features (one by one)

---

**Status: Ready to start Phase 1 - Backend (Customer Model + Auth APIs)** ✅
- Order details view
- Order tracking (real-time)
- Cancel order
- Download invoice
- Return request

### Wishlist
- Add product to wishlist
- Remove from wishlist
- Move to cart
- Share wishlist (link)
- Wishlist count badge

### Payments
- Save credit card
- Save UPI/Digital wallet
- Set default payment
- Delete saved payment
- Payment history

---

## **Phase 4: Advanced Features** (Week 5)

### Reviews & Ratings
- Post review on purchased products
- Upload images in review
- Rate product (1-5 stars)
- Edit/delete own reviews

### Order Tracking
- Real-time order status updates
- Delivery tracking map
- Estimated delivery date
- SMS/Email notifications

### Account Security
- Change password
- Two-factor authentication
- Active sessions management
- Login history

---

## **Database Structure**

```
📦 Customer Collection
├─ _id
├─ email (unique)
├─ password (hashed)
├─ firstName, lastName
├─ phone
├─ profileImage
├─ isVerified
├─ createdAt, updatedAt
└─ preferences

📦 Address Collection
├─ _id
├─ customerId (reference)
├─ street, city, state, country
├─ postalCode
├─ label (Home/Office)
├─ isDefaultShipping
├─ isDefaultBilling
└─ createdAt

📦 Order Collection
├─ _id
├─ customerId (reference)
├─ items[] (product references)
├─ totalPrice
├─ status (pending/shipped/delivered)
├─ shippingAddress
├─ billingAddress
├─ paymentMethod
├─ trackingId
└─ createdAt

📦 Wishlist Collection
├─ _id
├─ customerId (reference)
├─ products[] (product IDs)
└─ createdAt

📦 Review Collection
├─ _id
├─ customerId (reference)
├─ productId (reference)
├─ rating (1-5)
├─ title, comment
├─ images[]
└─ createdAt
```

---

## **API Endpoints**

### **Auth**
```
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh-token
POST   /api/auth/forgot-password
```

### **Customer**
```
GET    /api/customer/profile
PUT    /api/customer/profile
GET    /api/customer/dashboard
```

### **Addresses**
```
GET    /api/customer/addresses
POST   /api/customer/addresses
PUT    /api/customer/addresses/:id
DELETE /api/customer/addresses/:id
PATCH  /api/customer/addresses/:id/set-default
```

### **Orders**
```
GET    /api/customer/orders
GET    /api/customer/orders/:id
POST   /api/customer/orders/:id/cancel
POST   /api/customer/orders/:id/return
GET    /api/customer/orders/:id/track
```

### **Wishlist**
```
GET    /api/customer/wishlist
POST   /api/customer/wishlist
DELETE /api/customer/wishlist/:productId
```

### **Reviews**
```
GET    /api/customer/reviews
POST   /api/products/:id/reviews
PUT    /api/customer/reviews/:id
DELETE /api/customer/reviews/:id
```

---

## **Frontend Routes**

```
/signup                    - Signup page
/login                     - Login page
/customer/dashboard        - Main dashboard
/customer/profile          - Edit profile
/customer/orders           - Order history
/customer/orders/:id       - Order detail & tracking
/customer/addresses        - Address management
/customer/wishlist         - Wishlist page
/customer/payments         - Payment methods
/customer/reviews          - My reviews
/customer/settings         - Account settings
```

---

## **Implementation Order**

1. **Backend First**
   - Customer model
   - Signup/Login API
   - JWT middleware

2. **Frontend Auth**
   - Signup/Login pages
   - Auth context
   - Protected routes

3. **Dashboard Layout**
   - Customer dashboard layout
   - Navigation sidebar
   - Different from admin

4. **Features (one by one)**
   - Profile management
   - Address CRUD
   - Order history
   - Wishlist
   - Payments
   - Reviews
   - Tracking

---

**Ready to start Phase 1 (Backend Customer Model + Signup/Login)?** 🚀