const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://plants-mall:plants2003@plants-mall.otyfvij.mongodb.net/plants-mall';

async function checkCustomers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const customersCollection = db.collection('customers');
    
    // Find all customers
    const customers = await customersCollection.find({}).toArray();
    
    console.log('\n📋 ALL CUSTOMERS IN DATABASE:');
    console.log('================================');
    
    if (customers.length === 0) {
      console.log('❌ NO CUSTOMERS FOUND!');
    } else {
      customers.forEach(c => {
        console.log(`\nEmail: ${c.email}`);
        console.log(`Store: ${c.store || 'NOT SET'}`);
        console.log(`First Name: ${c.firstName}`);
        console.log(`Last Name: ${c.lastName}`);
      });
    }
    
    await mongoose.connection.close();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkCustomers();
