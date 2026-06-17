const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const categories = await db.collection('categories').find().toArray();
  console.log('Categories count:', categories.length);
  if (categories.length > 0) {
    console.log('First category storeName:', categories[0].storeName);
    console.log('Unique storeNames in categories:');
    const stores = new Set(categories.map(c => c.storeName));
    console.log(Array.from(stores));
  }
  process.exit(0);
});
