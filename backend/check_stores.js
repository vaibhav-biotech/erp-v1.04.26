require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  const stores = await db.collection('stores').find({}).toArray();
  console.log('--- STORES IN DB ---');
  stores.forEach(s => console.log(s.name, '|', s.storeName));
  console.log('Total:', stores.length);
  
  process.exit(0);
}
run();
