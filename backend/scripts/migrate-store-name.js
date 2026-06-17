const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Admin = require('../models/Admin');
const StaffMember = require('../models/StaffMember');
const StaffTaskRecord = require('../models/StaffTaskRecord');
const StaffAttendanceRecord = require('../models/StaffAttendanceRecord');

const runMigration = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp-db';
    console.log('Connecting to MongoDB at:', mongoURI);
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✓ MongoDB connected successfully');

    console.log('Running migration: Adding storeName="plantsingarden" to old records...');

    const models = [
      { name: 'Category', model: Category },
      { name: 'Product', model: Product },
      { name: 'Customer', model: Customer },
      { name: 'Admin', model: Admin },
      { name: 'StaffMember', model: StaffMember },
      { name: 'StaffTaskRecord', model: StaffTaskRecord },
      { name: 'StaffAttendanceRecord', model: StaffAttendanceRecord },
    ];

    for (const { name, model } of models) {
      if (model) {
        try {
          const res = await model.updateMany(
            { storeName: { $exists: false } },
            { $set: { storeName: 'plantsingarden' } }
          );
          console.log(`- ${name} updated: ${res.modifiedCount}`);
        } catch (err) {
          console.error(`Error updating ${name}:`, err.message);
        }
      }
    }

    console.log('✓ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

runMigration();
