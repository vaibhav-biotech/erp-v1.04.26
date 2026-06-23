# Centralized ERP Architecture Implementation Plan

This document outlines the detailed architectural transition of the Vaibhav Biotech ERP from an isolated multi-tenant system to a modern, centralized retail-chain architecture.

## 🏗️ System Hierarchy

```text
Super Admin (Vaibhav Biotech HQ)
        │
        ├──────────────┐
        │              │
 Inventory Team     Marketing Team
        │              │
        └──────────────┘
               │
        Shared Product Catalog
               │
   ┌───────────┼────────────┐
   │           │            │
Store 1     Store 2      Store 10
(Admin)      (Admin)      (Admin)
```

Instead of 10 Stores with 10 Inventories, we are building:
**10 Stores → ONE Inventory → ONE ERP → ONE Customer Database → ONE Finance system.**

This avoids duplicate products, mismatched stock, and inconsistent pricing.

---

## 👥 Roles & Permissions

We will expand the system to exactly five defined roles with strict permission boundaries:

### 1. Super Admin (Head Office / HQ)
This is Vaibhav Biotech HQ. They control **EVERYTHING** across the entire business.
*   **Modules:** Full access to all modules.
*   **Store Management:** Create, edit, and manage all stores (Owner, Admin, Theme, Domain, Status, Orders, Revenue).
*   **Staff:** View and manage all employees, attendance, tasks, performance, and reports.
*   **Finance:** Access overall business revenue, store-wise revenue, expenses, and profit.
*   **Analytics:** View global business analytics (Total Revenue, Total Orders, Inventory Value, Low Stock alerts, Top/Worst Stores, Staff stats).

### 2. Inventory Admin
Manages the central product catalog. They serve all stores.
*   **Powers:** Create, edit, delete products.
*   **Scope:** Manage global stock, global pricing, discounts, images, SEO, categories, tags, and collections.
*   **No Access:** Store-specific orders, website themes, localized marketing.

### 3. Marketing Admin
Manages all customer engagement and content globally.
*   **Powers:** Manage global Campaigns, global Coupons, global Offers, and SEO.
*   **Scope:** Operates across the central customer database.

### 4. Store Admin
Each store admin **ONLY** manages their own specific store.
*   **Orders:** Manage pending, packed, shipped, delivered, and cancelled orders for THEIR store.
*   **Customers:** View and manage customers of THAT specific store only.
*   **Website:** Manage their store's specific Banner, Landing Page, Offer Banner, Theme, Homepage Sections, Menus, Blogs, About Us, and Contact pages.
*   **Coupons:** Create and manage store-specific coupons.
*   **Reports:** View Today's Sales, Orders, and Visitors for their store.
*   **RESTRICTIONS:** Cannot create products. Cannot change stock. Cannot change prices globally. No inventory access.

### 5. Staff
*   **Scope:** Limited access to assigned tasks, order processing (if permitted by store), and attendance logging.

---

## 📦 Core Flows

### 1. Product & Inventory Flow (Centralized)
One inventory. All stores consume from it.

**Example Flow:**
1.  **Inventory Admin** adds "Snake Plant" with a Stock of 500.
2.  Inventory Admin selects authorized stores:
    *   [x] Plants in Garden
    *   [x] Decor Plants
    *   [x] Indoor Plants
    *   [ ] Seeds Store
    *   [ ] Fertilizer Store
3.  The product **immediately** appears on the storefronts of the selected stores.

**Stock Tracking:**
*   **Total Stock:** 250
*   **Reserved:** 32
*   **Available:** 218

### 2. Order & Stock Depletion Flow
When an order occurs at any storefront, the central stock is updated immediately to prevent overselling.

**Example Flow:**
1.  "Plants in Garden" store sells 5 Snake Plants.
2.  Global Stock drops from 500 → 495.
3.  Every authorized store immediately sees the available stock as 495.
4.  No duplicate inventory is ever created.

### 3. Website Management Flow
Store Admins control the visual presentation of their assigned store without affecting the global catalog.
*   Store Admin changes: Banner, Homepage, Offers, Collections, Blogs.
*   **Impact:** Only affects THEIR store. Not others.

---

## 🛠️ Technical Implementation Strategy

### 1. Database Schema Updates
*   **`Product` Model:**
    *   Remove `storeName: String`.
    *   Add `storesSelling: [String]` (Array of store identifiers).
    *   Add `reservedStock: Number` and unify `stock: Number` as global values.
*   **`Admin` Model:**
    *   Update `role` enum to `['super_admin', 'inventory_admin', 'marketing_admin', 'store_admin']`.
    *   Update granular permissions object to match the powers listed above.

### 2. API & Routing Updates
*   **Inventory API:** Restrict Product creation/editing endpoints to `super_admin` and `inventory_admin`.
*   **Storefront API:** Modify product fetching logic to `Product.find({ storesSelling: currentStoreIdentifier })`.
*   **Order API:** Update the order creation logic to decrement the central `Product.stock` globally. Add logic to handle `reservedStock` if an item is in the checkout flow.

## User Review Required

> [!IMPORTANT]
> Please review this updated document. ReplySys has been removed and will be handled separately. If this plan looks good, I will start executing it!

------------------------------------



### 1. What We Currently Have (Super Admin Side)
*   **Navigation & Modules:** The Super Admin currently only has access to: Dashboard, Manage Stores, Manage Admins, Manage Staff, Analytics, All Customers, and All Orders.
*   **Missing Core Modules:** Currently, the Super Admin does **NOT** have access to the "Products" or "Categories" tabs! Right now, the code restricts those entirely to the `store_admin` role.
*   **Dashboard Stats:** The dashboard only shows basic totals (Total Stores, Customers, Orders, Revenue).
*   **Database Roles:** The backend currently only understands two roles: `super_admin` and `store_admin`. 

### 2. What We Need to Change
To align perfectly with your new Vaibhav Biotech HQ architecture, we need to make the following changes on the Super Admin side:

####

*   **Move Inventory Control:** We need to take the "Products" and "Categories" menu items away from the Store Admins and give them to the Super Admin (and the future Inventory Admin). The HQ must be the sole owner of the product catalog.

####

*   **Update the Backend Roles:** We must update the `Admin` database model to formally introduce the new roles (`inventory_admin` and `marketing_admin`), and rewrite the permission flags so that Store Admins physically cannot edit products or stock.
*   **Expand Dashboard Analytics:** We need to update the Super Admin dashboard API to calculate and display the new advanced metrics you specified: **Inventory Value, Low Stock alerts, Top Store, and Worst Store**.
*   **Centralize Product Data:** We must update the `Product` database model to remove the old `storeName` text field, and replace it with a `storesSelling` array and a single, unified `stock` number.

Does this breakdown correctly capture the gap between our current state and the new HQ architecture? If you agree, let me know which specific piece (e.g., the Database Roles, or the Super Admin UI) you'd like to tackle first!