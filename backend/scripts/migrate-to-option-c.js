/**
 * STEP 3: Migration Script - Option C Implementation
 * 
 * Purpose: Migrate from test collections to store-prefixed collections
 * 
 * What this does:
 * 1. Backup existing data from test.* collections
 * 2. Copy test.customers -> plantsingarden_customers
 * 3. Copy test.products -> plantsingarden_products
 * 4. Copy test.categories -> plantsingarden_categories
 * 5. Create empty store2-10 collections
 * 6. Verify data integrity
 * 7. Log all changes
 * 
 * Usage:
 *   node backend/scripts/migrate-to-option-c.js
 * 
 * Safety:
 *   - Creates backups before migrating
 *   - Verifies data integrity
 *   - Easy to rollback (test.* collections stay intact)
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

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

const migration = {
  startTime: Date.now(),
  backups: [],
  migrations: [],
  errors: [],
};

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

async function migrateCollection(db, sourceCollection, targetCollection) {
  try {
    log.step(3, `Migrating ${sourceCollection} → ${targetCollection}`);

    // Check if source exists
    const sourceExists = await db.listCollections({ name: sourceCollection }).toArray();
    if (sourceExists.length === 0) {
      log.warning(`Source collection ${sourceCollection} not found, skipping`);
      return { success: false, reason: 'source_not_found' };
    }

    // Get source data
    const sourceData = await db.collection(sourceCollection).find({}).toArray();
    log.info(`Found ${sourceData.length} documents in ${sourceCollection}`);

    if (sourceData.length === 0) {
      log.warning(`Source collection ${sourceCollection} is empty`);
      return { success: false, reason: 'empty_collection', count: 0 };
    }

    // Check if target already exists
    const targetExists = await db.listCollections({ name: targetCollection }).toArray();
    if (targetExists.length > 0) {
      log.warning(`Target collection ${targetCollection} already exists`);
      const existingCount = await db.collection(targetCollection).countDocuments();
      log.info(`Target has ${existingCount} documents`);
      
      if (existingCount > 0) {
        return { success: false, reason: 'target_exists', count: existingCount };
      }
    }

    // Create backup
    const backupName = `backup_${sourceCollection}_${Date.now()}.json`;
    fs.writeFileSync(
      path.join(__dirname, backupName),
      JSON.stringify(sourceData, null, 2)
    );
    migration.backups.push(backupName);
    log.success(`Backup created: ${backupName}`);

    // Copy documents
    const targetCollection_obj = db.collection(targetCollection);
    const insertResult = await targetCollection_obj.insertMany(sourceData);
    
    const insertedCount = insertResult.insertedIds.length;
    log.success(`Migrated ${insertedCount} documents to ${targetCollection}`);

    // Verify
    const verifyCount = await targetCollection_obj.countDocuments();
    if (verifyCount === sourceData.length) {
      log.success(`Verification passed: ${verifyCount} documents verified`);
      migration.migrations.push({
        from: sourceCollection,
        to: targetCollection,
        count: insertedCount,
        verified: true,
      });
      return { success: true, count: insertedCount };
    } else {
      throw new Error(`Verification failed: expected ${sourceData.length}, got ${verifyCount}`);
    }
  } catch (error) {
    log.error(`Migration failed for ${sourceCollection} → ${targetCollection}: ${error.message}`);
    migration.errors.push({
      from: sourceCollection,
      to: targetCollection,
      error: error.message,
    });
    return { success: false, reason: 'migration_error', error: error.message };
  }
}

async function createEmptyCollections(db) {
  try {
    log.step(3, 'Creating empty store collections (store2-store10)');
    
    const stores = ['store2', 'store3', 'store4', 'store5', 'store6', 'store7', 'store8', 'store9', 'store10'];
    const collectionTypes = ['customers', 'products', 'categories', 'orders'];
    
    for (const store of stores) {
      for (const type of collectionTypes) {
        const collectionName = `${store}_${type}`;
        
        // Check if exists
        const exists = await db.listCollections({ name: collectionName }).toArray();
        if (exists.length > 0) {
          log.warning(`Collection ${collectionName} already exists`);
          continue;
        }
        
        // Create collection by inserting and deleting a document
        await db.collection(collectionName).insertOne({ _temp: true, createdAt: new Date() });
        await db.collection(collectionName).deleteOne({ _temp: true });
        
        log.success(`Created collection: ${collectionName}`);
      }
    }
  } catch (error) {
    log.error(`Failed to create empty collections: ${error.message}`);
    migration.errors.push({
      step: 'create_empty_collections',
      error: error.message,
    });
  }
}

async function createIndexes(db) {
  try {
    log.step(3, 'Creating indexes for new collections');
    
    const collections = [
      'plantsingarden_customers',
      'plantsingarden_products',
      'plantsingarden_categories',
      'plantsingarden_orders',
    ];
    
    for (const collection of collections) {
      const exists = await db.listCollections({ name: collection }).toArray();
      if (exists.length === 0) continue;
      
      const col = db.collection(collection);
      
      // Index email for customers (unique)
      if (collection.endsWith('_customers')) {
        await col.createIndex({ email: 1 }, { unique: true });
        log.success(`Created unique index on ${collection}.email`);
      }
      
      // Index name for products
      if (collection.endsWith('_products')) {
        await col.createIndex({ name: 1 });
        log.success(`Created index on ${collection}.name`);
      }
    }
  } catch (error) {
    log.error(`Failed to create indexes: ${error.message}`);
    migration.errors.push({
      step: 'create_indexes',
      error: error.message,
    });
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('STEP 3: MIGRATION TO OPTION C (Store-Prefixed Collections)');
  console.log('='.repeat(60) + '\n');

  const db = await connectDB();

  try {
    // Step 1: Migrate test collections to plantsingarden
    log.step(3, 'Starting collection migration');
    console.log('');
    
    await migrateCollection(db, 'test.customers', 'plantsingarden_customers');
    await migrateCollection(db, 'test.products', 'plantsingarden_products');
    await migrateCollection(db, 'test.categories', 'plantsingarden_categories');
    
    console.log('');
    
    // Step 2: Create empty collections for store2-10
    await createEmptyCollections(db);
    
    console.log('');
    
    // Step 3: Create indexes
    await createIndexes(db);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('MIGRATION SUMMARY');
    console.log('='.repeat(60));
    
    log.success(`Total migrations completed: ${migration.migrations.length}`);
    migration.migrations.forEach((m) => {
      console.log(`  → ${m.from} → ${m.to} (${m.count} documents)`);
    });
    
    log.success(`Total backups created: ${migration.backups.length}`);
    migration.backups.forEach((b) => {
      console.log(`  → ${b}`);
    });
    
    if (migration.errors.length > 0) {
      log.warning(`Total errors encountered: ${migration.errors.length}`);
      migration.errors.forEach((e) => {
        console.log(`  → ${JSON.stringify(e)}`);
      });
    }
    
    const duration = ((Date.now() - migration.startTime) / 1000).toFixed(2);
    log.success(`Migration completed in ${duration}s`);
    
    console.log('\n' + '='.repeat(60) + '\n');

  } catch (error) {
    log.error(`Migration failed: ${error.message}`);
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
