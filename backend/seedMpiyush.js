const mongoose = require('mongoose');
const Customer = require('./models/Customer');
require('dotenv').config();

async function seedCustomer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Seeding customer...\n');

    const customer = {
      email: 'mpiyush2777@gmail.com',
      password: 'Pass@123',
      firstName: 'Mpiyush',
      lastName: 'User',
      phone: '+919876543210',
    };

    // Check if customer exists
    const existing = await Customer.findOne({ email: customer.email });
    if (existing) {
      console.log(`✅ Customer ${customer.email} already exists!`);
      await mongoose.disconnect();
      return;
    }

    const newCustomer = new Customer(customer);
    await newCustomer.save();

    console.log(`✅ Customer created successfully!`);
    console.log(`Email: ${customer.email}`);
    console.log(`Password: ${customer.password}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedCustomer();
