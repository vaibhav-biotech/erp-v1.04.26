const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://plants-mall:plants2003@plants-mall.otyfvij.mongodb.net/plants-mall';

async function updateCustomerStore() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const collection = db.collection('plants-in-garden_customers');
    
    // Check current store field
    console.log('📋 Current customers:');
    const currentDocs = await collection.find({}).toArray();
    currentDocs.forEach(c => {
      console.log(`   Email: ${c.email}, Store: "${c.store}"`);
    });
    
    // Update store field to "plants in garden"
    console.log('\n📝 Updating store field to "plants in garden"...');
    const result = await collection.updateMany(
      {},
      { $set: { store: 'plants in garden' } }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} documents`);
    
    // Verify
    console.log('\n✅ Updated customers:');
    const updatedDocs = await collection.find({}).toArray();
    updatedDocs.forEach(c => {
      console.log(`   Email: ${c.email}, Store: "${c.store}"`);
    });
    
    await mongoose.connection.close();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

updateCustomerStore();
