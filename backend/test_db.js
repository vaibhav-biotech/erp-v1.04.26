const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const product = await db.collection('products').findOne({ images: null });
  if (product) {
    console.log(`Found product with null images: ${product._id}`);
  } else {
    console.log('No products have null images');
  }
  process.exit(0);
});
