const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb+srv://plants-mall:plants2003@plants-mall.otyfvij.mongodb.net/plants-mall';

async function checkCustomer() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const collection = db.collection('customers');
    
    const customer = await collection.findOne({ email: 'piyushmagar4p@gmail.com' });
    
    if (!customer) {
      console.log('❌ Customer not found!');
      await mongoose.connection.close();
      process.exit(1);
    }
    
    console.log('📋 CUSTOMER FOUND:');
    console.log(`   Email: ${customer.email}`);
    console.log(`   Store: ${customer.store}`);
    console.log(`   First Name: ${customer.firstName}`);
    console.log(`   Password Hash: ${customer.password}`);
    
    // Test password
    console.log('\n🔐 TESTING PASSWORD:');
    const testPassword = 'Pm@22442232';
    
    const isMatch = await bcrypt.compare(testPassword, customer.password);
    console.log(`   Testing: "${testPassword}"`);
    console.log(`   Match: ${isMatch ? '✅ YES' : '❌ NO'}`);
    
    if (!isMatch) {
      // Try other common passwords
      console.log('\n   Trying other possibilities:');
      const passwords = ['password', '123456', 'Plants123', 'plants123', 'Pm@22442232'];
      for (const pwd of passwords) {
        const match = await bcrypt.compare(pwd, customer.password);
        if (match) {
          console.log(`   ✅ FOUND! Password is: "${pwd}"`);
        }
      }
    }
    
    await mongoose.connection.close();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkCustomer();
