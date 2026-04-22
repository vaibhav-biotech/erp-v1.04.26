# ERP v1.04.26 - Frontend Folder Structure

## Overview
Next.js 14+ frontend with TypeScript and TailwindCSS for admin dashboard and public storefront.

## Directory Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout with navbar/footer
│   │   ├── page.tsx                # Homepage
│   │   ├── globals.css             # Global styles
│   │   │
│   │   ├── login/
│   │   │   └── page.tsx            # Unified login page (Admin + Customer)
│   │   │
│   │   ├── dashboard/
│   │   │   └── page.tsx            # Customer dashboard home
│   │   │
│   │   ├── admin/
│   │   │   └── dashboard/
│   │   │       └── page.tsx        # Admin dashboard (super + store admin)
│   │   │
│   │   ├── products/
│   │   │   └── [slug]/
│   │   │       └── page.tsx        # Product detail page (public)
│   │   │
│   │   ├── testing/
│   │   │   └── page.tsx            # Testing/debug page
│   │   │
│   │   └── api/
│   │       └── [API route handlers - if needed]
│   │
│   ├── components/
│   │   ├── [Layout Components]
│   │   │   ├── PublicLayout.tsx    # Navbar + Footer wrapper (public pages)
│   │   │   ├── PublicNavbar.tsx    # Public site navigation
│   │   │   ├── PublicFooter.tsx    # Public site footer
│   │   │   ├── DashboardLayout.tsx # Admin/Customer dashboard layout
│   │   │   ├── Sidebar.tsx         # Dashboard sidebar
│   │   │   └── Topbar.tsx          # Dashboard top navigation
│   │   │
│   │   ├── [Admin Components]
│   │   │   ├── DataTable.tsx       # Generic data table for listings
│   │   │   ├── ProductsTable.tsx   # Product management table
│   │   │   ├── BulkUploadModal.tsx # Excel upload modal
│   │   │   ├── AddProductForm.tsx  # Product creation form
│   │   │   └── ActionButtons.tsx   # Reusable action buttons
│   │   │
│   │   ├── [Product Components]
│   │   │   ├── ProductDetails.tsx  # Main product detail component
│   │   │   ├── ProductDetails 3.tsx
│   │   │   ├── ProductDetailCard.tsx
│   │   │   ├── ProductGallery.tsx  # Image carousel
│   │   │   ├── ProductPreviewDrawer.tsx
│   │   │   ├── VariantCard.tsx     # Product variant display
│   │   │   └── productVariant.jsx  # Legacy variant component
│   │   │
│   │   ├── [Product Info Components]
│   │   │   ├── DescriptionSection.tsx
│   │   │   ├── BenefitsSection.tsx
│   │   │   ├── CareSection.tsx
│   │   │   ├── productinfo.jsx     # Legacy product info
│   │   │   ├── deliveryChecker.jsx # Delivery info component
│   │   │   └── giftOptions.jsx     # Gift wrapping options
│   │   │
│   │   ├── [Reusable Components]
│   │   │   ├── Button.tsx          # Custom button component
│   │   │   ├── Modal.tsx           # Modal wrapper
│   │   │   ├── Breadcrumb.tsx      # Breadcrumb navigation
│   │   │   ├── GiftOptions.tsx
│   │   │   └── CareSection.tsx
│   │   │
│   │   └── pages/
│   │       ├── HomePage.tsx        # Home page layout
│   │       ├── ProductsPage.tsx    # Products listing page
│   │       ├── CategoriesPage.tsx  # Categories management
│   │       ├── AddProductPage.tsx  # Product creation page
│   │       ├── OrdersPage.tsx      # Orders listing
│   │       ├── CustomersPage.tsx   # Customers listing
│   │       └── UsersPage.tsx       # Users/Admins management
│   │
│   ├── hooks/
│   │   ├── useAuth.ts              # Auth context and token management
│   │   └── useCategories.ts        # Categories API hook
│   │
│   ├── lib/
│   │   └── constants.ts            # API endpoints, routes
│   │
│   ├── utils/
│   │   └── parseExcelFile.ts       # Excel file parsing utility
│   │
│   └── [context/]
│       └── [Auth context, Store context, etc]
│
├── public/
│   └── [Static assets - images, favicon, etc]
│
├── next.config.ts                 # Next.js configuration
├── tsconfig.json                  # TypeScript config
├── package.json                   # Dependencies
├── eslint.config.mjs              # ESLint rules
├── postcss.config.mjs             # PostCSS (TailwindCSS)
├── next-env.d.ts                  # Generated TypeScript definitions
│
├── README.md                      # Project documentation
├── AGENTS.md                      # AI Agent instructions
├── CLAUDE.md                      # Claude-specific notes
│
└── .env.local                     # Local environment variables
```

## Key Features

### Authentication (`useAuth.ts`)
- Stores JWT token in localStorage
- Provides user context (role, storeName, id)
- Auto-redirect to login if token invalid
- Support for both Admin and Customer roles

### API Integration
- Base URL: `http://localhost:3000/api` → `process.env.NEXT_PUBLIC_API_URL`
- Endpoints in `lib/constants.ts`

### Page Routes

| Route | Description | Protected |
|-------|-------------|-----------|
| `/` | Homepage | No |
| `/products` | Product catalog | No |
| `/products/[slug]` | Product details | No |
| `/login` | Login page | No |
| `/dashboard` | Customer dashboard | Yes (customer role) |
| `/admin/dashboard` | Admin panel | Yes (admin role) |
| `/testing` | Debug page | No |

### Admin Features
- Product management (CRUD)
- Bulk upload (Excel)
- Customer management
- Order tracking
- Category management
- Store/Role management

### Customer Features
- Product browsing
- Shopping cart
- Order history
- Account settings
- Gift options/delivery preferences

## Environment Variables

```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_STORE_NAME=Plants Mall  # Or other store name
```

## Build & Run

```bash
# Development
npm run dev           # Runs on http://localhost:3000

# Production build
npm run build
npm start
```

## Component Naming Convention

- Layout components: `*Layout.tsx`, `*Navbar.tsx`
- Form components: `*Form.tsx`
- Table components: `*Table.tsx`
- Modal/Dialog: `*Modal.tsx`
- Feature pages: `*Page.tsx` (in `/pages` folder)
- Utility components: `*Section.tsx`, `*Card.tsx`

## Styling

- **Framework**: TailwindCSS
- **Config**: `postcss.config.mjs` + `globals.css`
- **Approach**: Utility-first CSS classes
