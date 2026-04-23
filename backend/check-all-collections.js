const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://plants-mall:plants2003@plants-mall.otyfvij.mongodb.net/plants-mall';

async function checkAllCollections() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    
    console.log('📚 ALL COLLECTIONS IN DATABASE:');
    collections.forEach(c => console.log(`  - ${c.name}`));
    
    // Check customers collection
    console.log('\n📋 CHECKING CUSTOMERS COLLECTION:');
    const customersCollection = db.collection('customers');
    const customerCount = await customersCollection.countDocuments();
    console.log(`Total documents: ${customerCount}`);
    
    const allCustomers = await customersCollection.find({}).toArray();
    allCustomers.forEach(c => {
      console.log(`\n  Email: ${c.email}`);
      console.log(`  Store: ${c.store}`);
      console.log(`  Name: ${c.firstName} ${c.lastName}`);
    });
    
    await mongoose.connection.close();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkAllCollections();
