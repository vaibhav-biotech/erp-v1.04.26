const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://plants-mall:plants2003@plants-mall.otyfvij.mongodb.net/plants-mall';

async function analyzeDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log('📊 DATABASE ANALYSIS:');
    console.log('═'.repeat(60));
    
    // Group collections by type
    const byType = {};
    collections.forEach(c => {
      const name = c.name;
      if (name.includes('_customers')) {
        byType.customers = byType.customers || [];
        byType.customers.push(name);
      } else if (name.includes('_products')) {
        byType.products = byType.products || [];
        byType.products.push(name);
      } else if (name.includes('_orders')) {
        byType.orders = byType.orders || [];
        byType.orders.push(name);
      } else if (name.includes('_categories')) {
        byType.categories = byType.categories || [];
        byType.categories.push(name);
      } else {
        byType.other = byType.other || [];
        byType.other.push(name);
      }
    });
    
    console.log('\n👥 CUSTOMER COLLECTIONS:');
    if (byType.customers) {
      byType.customers.forEach(name => {
        console.log(`   - ${name}`);
      });
    }
    
    console.log('\n📦 PRODUCT COLLECTIONS:');
    if (byType.products) {
      byType.products.forEach(name => {
        console.log(`   - ${name}`);
      });
    }
    
    console.log('\n📋 ORDER COLLECTIONS:');
    if (byType.orders) {
      byType.orders.forEach(name => {
        console.log(`   - ${name}`);
      });
    }
    
    console.log('\n🏷️  CATEGORY COLLECTIONS:');
    if (byType.categories) {
      byType.categories.forEach(name => {
        console.log(`   - ${name}`);
      });
    }
    
    console.log('\n🔧 OTHER COLLECTIONS:');
    if (byType.other) {
      byType.other.forEach(name => {
        console.log(`   - ${name}`);
      });
    }
    
    // Count documents
    console.log('\n📈 DOCUMENT COUNTS:');
    console.log('─'.repeat(60));
    
    for (const [type, names] of Object.entries(byType)) {
      if (names && Array.isArray(names)) {
        console.log(`\n${type.toUpperCase()}:`);
        for (const name of names) {
          const count = await db.collection(name).countDocuments();
          console.log(`   ${name}: ${count} documents`);
        }
      }
    }
    
    await mongoose.connection.close();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

analyzeDatabase();
