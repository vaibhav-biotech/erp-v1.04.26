require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seedAdmin = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp-db';
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✓ MongoDB connected for seeding');

    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin1@plants.com' });
    if (adminExists) {
      console.log('✓ Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const admin = new User({
      email: 'admin1@plants.com',
      password: 'Plants@123',
    });

    await admin.save();
    console.log('✓ Admin user created successfully');
    console.log('Email: admin1@plants.com');
    console.log('Password: Plants@123');

    process.exit(0);
  } catch (error) {
    console.error('✗ Error seeding admin:', error.message);
    process.exit(1);
  }
};

seedAdmin();
