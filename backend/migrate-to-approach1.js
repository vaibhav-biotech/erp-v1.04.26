const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://plants-mall:plants2003@plants-mall.otyfvij.mongodb.net/plants-mall';

async function migrateToApproach1() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    
    console.log('🧹 STEP 1: Deleting empty store-specific collections...\n');
    
    // Collections to delete
    const toDelete = [
      'store1_customers', 'store2_customers', 'store3_customers', 'store4_customers', 'store5_customers',
      'store6_customers', 'store7_customers', 'store8_customers', 'store9_customers', 'store10_customers',
      'store1_products', 'store2_products', 'store3_products', 'store4_products', 'store5_products',
      'store6_products', 'store7_products', 'store8_products', 'store9_products', 'store10_products',
      'store1_orders', 'store2_orders', 'store3_orders', 'store4_orders', 'store5_orders',
      'store6_orders', 'store7_orders', 'store8_orders', 'store9_orders', 'store10_orders',
      'store1_categories', 'store2_categories', 'store3_categories', 'store4_categories', 'store5_categories',
      'store6_categories', 'store7_categories', 'store8_categories', 'store9_categories', 'store10_categories',
      'test.customers'
    ];
    
    for (const collName of toDelete) {
      try {
        await db.collection(collName).drop();
        console.log(`   ✓ Deleted: ${collName}`);
      } catch (err) {
        // Collection might not exist, that's OK
      }
    }
    
    console.log('\n📋 STEP 2: Consolidating customers into main collection...\n');
    
    // Copy from plants-in-garden_customers to customers
    const sourceCollection = db.collection('plants-in-garden_customers');
    const targetCollection = db.collection('customers');
    
    // Get all documents from source
    const documents = await sourceCollection.find({}).toArray();
    console.log(`   Found ${documents.length} customers in plants-in-garden_customers`);
    
    // Clear target collection
    await targetCollection.deleteMany({});
    console.log(`   Cleared customers collection`);
    
    // Insert into target
    if (documents.length > 0) {
      await targetCollection.insertMany(documents);
      console.log(`   ✓ Inserted ${documents.length} customers into customers collection`);
    }
    
    // Delete the source collection
    await sourceCollection.drop();
    console.log(`   ✓ Deleted plants-in-garden_customers collection\n`);
    
    console.log('✅ CONSOLIDATION COMPLETE!\n');
    
    // Verify
    console.log('📊 FINAL STATE:');
    console.log('═'.repeat(60));
    
    const customerCount = await targetCollection.countDocuments();
    console.log(`\n👥 Customers Collection: ${customerCount} documents`);
    
    const customers = await targetCollection.find({}).toArray();
    customers.forEach(c => {
      console.log(`   - ${c.email} (Store: ${c.store})`);
    });
    
    console.log('\n✅ Database is now clean and organized!');
    console.log('✅ Ready to use Approach 1: Single collection per entity type');
    
    await mongoose.connection.close();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

migrateToApproach1();
