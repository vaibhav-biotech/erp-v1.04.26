require('dotenv').config();
const mongoose = require('mongoose');
const Customer = require('./models/Customer.js');

const seedCustomer = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp-db';
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✓ MongoDB connected for seeding');

    // Check if test customer already exists
    const customerExists = await Customer.findOne({ email: 'test@example.com' });
    if (customerExists) {
      console.log('✓ Test customer already exists');
      console.log('Email: test@example.com');
      console.log('Password: password123');
      process.exit(0);
    }

    // Create test customer
    const customer = new Customer({
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      phone: '+91 98765 43210',
      isEmailVerified: false,
      preferences: {
        notifications: true,
        newsletter: true,
      },
    });

    await customer.save();
    console.log('✓ Test customer created successfully');
    console.log('Email: test@example.com');
    console.log('Password: password123');

    process.exit(0);
  } catch (error) {
    console.error('✗ Error seeding customer:', error.message);
    process.exit(1);
  }
};

seedCustomer();
