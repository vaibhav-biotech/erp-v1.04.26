const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb+srv://plants-mall:plants2003@plants-mall.otyfvij.mongodb.net/plants-mall';

async function testLogin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const customersCollection = db.collection('customers');
    
    const testEmail = 'piyushmagar4p@gmail.com';
    const testPassword = 'Pm@22442232';
    
    console.log('🔐 TESTING LOGIN:');
    console.log('═'.repeat(60));
    console.log(`Email: ${testEmail}`);
    console.log(`Password: ${testPassword}\n`);
    
    // Step 1: Find customer
    console.log('STEP 1: Finding customer in database...');
    const customer = await customersCollection.findOne({ email: testEmail });
    
    if (!customer) {
      console.log('❌ Customer NOT found!');
      await mongoose.connection.close();
      process.exit(1);
    }
    
    console.log('✅ Customer found!');
    console.log(`   Name: ${customer.firstName} ${customer.lastName}`);
    console.log(`   Email: ${customer.email}`);
    console.log(`   Store: ${customer.store}`);
    console.log(`   Password hash: ${customer.password}\n`);
    
    // Step 2: Compare password
    console.log('STEP 2: Comparing password...');
    const isMatch = await bcrypt.compare(testPassword, customer.password);
    
    if (isMatch) {
      console.log('✅ PASSWORD MATCHES!');
      console.log('\n🎉 LOGIN WOULD SUCCEED!\n');
      console.log('Expected response:');
      console.log({
        success: true,
        message: 'Customer login successful',
        type: 'customer',
        data: {
          customer: {
            _id: customer._id,
            email: customer.email,
            firstName: customer.firstName,
            lastName: customer.lastName,
            phone: customer.phone,
            store: customer.store,
          },
          token: 'JWT_TOKEN_HERE',
        },
      });
    } else {
      console.log('❌ PASSWORD DOES NOT MATCH!');
      console.log(`   Provided: ${testPassword}`);
      console.log(`   Stored hash: ${customer.password}`);
    }
    
    await mongoose.connection.close();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

testLogin();
