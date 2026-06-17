require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

const runMigration = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp-db';
    console.log('Connecting to MongoDB at:', mongoURI);
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✓ MongoDB connected successfully');

    console.log('Running migration: Adding storeName="plantsingarden" to old records...');

    // Update Categories
    if (Category) {
      const catRes = await Category.updateMany(
        { storeName: { $exists: false } },
        { $set: { storeName: 'plantsingarden' } }
      );
      console.log(`- Categories updated: ${catRes.modifiedCount}`);
    }

    // Update Products
    if (Product) {
      const prodRes = await Product.updateMany(
        { storeName: { $exists: false } },
        { $set: { storeName: 'plantsingarden' } }
      );
      console.log(`- Products updated: ${prodRes.modifiedCount}`);
    }

    // Update Customers
    if (Customer) {
      const custRes = await Customer.updateMany(
        { storeName: { $exists: false } },
        { $set: { storeName: 'plantsingarden' } }
      );
      console.log(`- Customers updated: ${custRes.modifiedCount}`);
    }

    console.log('✓ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

runMigration();
