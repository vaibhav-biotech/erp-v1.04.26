require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

const Customer = require('../models/Customer');
const Order = require('../models/Order');
const Invoice = require('../models/Invoice');

async function clearDummyData() {
  try {
    if (!process.env.MONGODB_URI) {
      // Fallback in case path is wrong or run from root
      require('dotenv').config();
    }
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in the environment variables.');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected successfully.');

    console.log('Clearing Customers...');
    const customerResult = await Customer.deleteMany({});
    console.log(`Deleted ${customerResult.deletedCount} customers.`);

    console.log('Clearing Orders...');
    const orderResult = await Order.deleteMany({});
    console.log(`Deleted ${orderResult.deletedCount} orders.`);

    console.log('Clearing Invoices...');
    const invoiceResult = await Invoice.deleteMany({});
    console.log(`Deleted ${invoiceResult.deletedCount} invoices.`);

    console.log('Database clearing completed successfully. Products remain untouched.');
  } catch (error) {
    console.error('Error clearing database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
}

clearDummyData();
