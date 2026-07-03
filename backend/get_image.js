const mongoose = require('mongoose');
require('dotenv').config();

async function getImage() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const product = await db.collection('products').findOne({ images: { $exists: true, $not: {$size: 0} } });
  if (product && product.images && product.images.length > 0) {
    console.log(product.images[0]);
  } else {
    console.log("No product images found");
  }
  process.exit(0);
}

getImage();
