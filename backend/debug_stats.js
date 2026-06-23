require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    
    const order = await db.collection('orders').findOne({});
    console.log('Sample Order:', JSON.stringify(order, null, 2));

    const customer = await db.collection('customers').findOne({});
    console.log('Sample Customer:', JSON.stringify(customer, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}
run();
