const mongoose = require('mongoose');
require('dotenv').config();
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://plants-mall:plants2003@plants-mall.otyfvij.mongodb.net/plants-mall';

mongoose.connect(mongoURI).then(async () => {
  const Product = require('./models/Product');
  const products = await Product.find({}, 'storeName');
  const counts = {};
  products.forEach(p => {
    const s = p.storeName === undefined ? 'UNDEFINED' : (p.storeName === null ? 'NULL' : p.storeName);
    counts[s] = (counts[s] || 0) + 1;
  });
  console.log("Total products:", products.length);
  console.log("storeName counts:", counts);
  process.exit(0);
});
