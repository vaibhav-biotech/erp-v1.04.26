/**
 * STEP 3: Seed Script - Create admins and stores collections
 * 
 * Purpose: Seed shared collections for Option C (multi-store system)
 * 
 * What this does:
 * 1. Create admins collection with:
 *    - 1 Super Admin (can access all stores)
 *    - 10 Store Admins (one per store, access only their store)
 * 
 * 2. Create stores collection with:
 *    - 10 store configurations (metadata, colors, domains)
 * 
 * Usage:
 *   node backend/scripts/seed-stores.js
 * 
 * Credentials:
 *   Super Admin:
 *     email: super@plantsmall.com
 *     password: SuperAdmin@123
 *   
 *   Store Admins:
 *     email: admin+{storeName}@plantsmall.com
 *     password: Store@123
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'plants-mall';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  step: (num, msg) => console.log(`${colors.cyan}[STEP ${num}] ${msg}${colors.reset}`),
};

const colors_palette = [
  '#22c55e', // green - plantsingarden
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f97316', // orange
  '#6366f1', // indigo
  '#d946ef', // fuchsia
];

const storeNames = [
  'plantsingarden',
  'store2',
  'store3',
  'store4',
  'store5',
  'store6',
  'store7',
  'store8',
  'store9',
  'store10',
];

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    log.success('MongoDB connected');
    return mongoose.connection.db;
  } catch (error) {
    log.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
}

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

async function seedAdmins(db) {
  try {
    log.step(3, 'Seeding admins collection');

    const adminsCollection = db.collection('admins');

    // Check if already seeded
    const existingCount = await adminsCollection.countDocuments();
    if (existingCount > 0) {
      log.warning(`admins collection already has ${existingCount} documents. Skipping seed.`);
      return;
    }

    const admins = [];

    // Super Admin
    admins.push({
      email: 'super@plantsmall.com',
      password: await hashPassword('SuperAdmin@123'),
      role: 'super_admin',
      storeName: null,
      firstName: 'Super',
      lastName: 'Admin',
      phone: '+1-555-0000',
      permissions: {
        canEditProducts: true,
        canEditCategories: true,
        canManageCustomers: true,
        canViewAnalytics: true,
        canManageOrders: true,
        canManageAdmins: true,
        canAccessAllStores: true,
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Store Admins (1 per store)
    for (let i = 0; i < storeNames.length; i++) {
      const storeName = storeNames[i];
      admins.push({
        email: `admin+${storeName}@plantsmall.com`,
        password: await hashPassword('Store@123'),
        role: 'store_admin',
        storeName: storeName,
        firstName: `Admin`,
        lastName: storeName.charAt(0).toUpperCase() + storeName.slice(1),
        phone: `+1-555-${String(i + 1).padStart(4, '0')}`,
        permissions: {
          canEditProducts: true,
          canEditCategories: true,
          canManageCustomers: true,
          canViewAnalytics: true,
          canManageOrders: true,
          canManageAdmins: false,
          canAccessAllStores: false,
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Insert all admins
    const result = await adminsCollection.insertMany(admins);
    log.success(`Created ${result.insertedIds.length} admin accounts`);
    log.info(`Super Admin: super@plantsmall.com / SuperAdmin@123`);
    log.info(`Store Admins: admin+{storeName}@plantsmall.com / Store@123`);

    // Create unique index on email
    await adminsCollection.createIndex({ email: 1 }, { unique: true });
    log.success('Created unique index on admins.email');

    // Create index on role and storeName
    await adminsCollection.createIndex({ role: 1, storeName: 1 });
    log.success('Created compound index on admins.role and admins.storeName');
  } catch (error) {
    log.error(`Failed to seed admins: ${error.message}`);
    throw error;
  }
}

async function seedStores(db) {
  try {
    log.step(3, 'Seeding stores collection');

    const storesCollection = db.collection('stores');

    // Check if already seeded
    const existingCount = await storesCollection.countDocuments();
    if (existingCount > 0) {
      log.warning(`stores collection already has ${existingCount} documents. Skipping seed.`);
      return;
    }

    const stores = [];

    for (let i = 0; i < storeNames.length; i++) {
      const storeName = storeNames[i];
      stores.push({
        storeName: storeName,
        displayName: storeName === 'plantsingarden' 
          ? 'Plants In Garden' 
          : `Store ${i + 1}`,
        domain: `${storeName}.com`,
        subdomain: storeName,
        primaryColor: colors_palette[i],
        logo: `https://via.placeholder.com/200x50?text=${storeName}`,
        description: `Welcome to ${storeName} - Your premium e-commerce store`,
        email: `info@${storeName}.com`,
        phone: `+1-555-${String(i + 1000).slice(-4)}`,
        address: `${i + 1} Main Street, City, Country`,
        owner: {
          name: `Owner ${i + 1}`,
          email: `owner+${storeName}@plantsmall.com`,
        },
        subscription: {
          plan: 'premium',
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          features: ['bulk_upload', 'analytics', 'api_access', 'custom_domain'],
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Insert all stores
    const result = await storesCollection.insertMany(stores);
    log.success(`Created ${result.insertedIds.length} store configurations`);

    stores.forEach((store) => {
      console.log(`  → ${store.storeName} (${store.primaryColor})`);
    });

    // Create unique index on storeName
    await storesCollection.createIndex({ storeName: 1 }, { unique: true });
    log.success('Created unique index on stores.storeName');

    // Create index on domain
    await storesCollection.createIndex({ domain: 1 }, { unique: true });
    log.success('Created unique index on stores.domain');
  } catch (error) {
    log.error(`Failed to seed stores: ${error.message}`);
    throw error;
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('STEP 3: SEED ADMINS & STORES (Shared Collections)');
  console.log('='.repeat(60) + '\n');

  const db = await connectDB();

  try {
    await seedAdmins(db);
    console.log('');
    await seedStores(db);

    console.log('\n' + '='.repeat(60));
    log.success('Seed completed successfully!');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    log.error(`Seed failed: ${error.message}`);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    log.success('Database disconnected');
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
