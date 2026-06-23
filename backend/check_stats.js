require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    
    const ordersCount = await db.collection('orders').countDocuments({});
    const customersCount = await db.collection('customers').countDocuments({});
    const productsCount = await db.collection('products').countDocuments({});
    
    console.log('--- PLANTS IN GARDEN STORE STATS ---');
    console.log('Total Orders:', ordersCount);
    console.log('Total Customers:', customersCount);
    console.log('Total Products:', productsCount);
    
    // Also let's check a sample order to see what the storeName is actually stored as.
    const order = await db.collection('orders').findOne({});
    if (order) {
      console.log('Sample Order storeName field:', order.storeName);
    }
  } catch (error) {
    console.error('Error checking stats:', error);
  } finally {
    process.exit(0);
  }
}
run();
