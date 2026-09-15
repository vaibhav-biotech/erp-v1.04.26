const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars from the correct path
dotenv.config({ path: path.join(__dirname, '../.env') });

const Product = require('../models/Product');

// Function to generate a random 6-character alphanumeric string
function generateSKU() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let sku = '';
  for (let i = 0; i < 6; i++) {
    sku += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return sku;
}

const backfillSKUs = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/plantsingarden';
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected...');

    const products = await Product.find({ sku: { $exists: false } });
    console.log(`Found ${products.length} products without a SKU.`);

    let count = 0;
    for (const product of products) {
      let isUnique = false;
      let newSku = '';
      while (!isUnique) {
        newSku = generateSKU();
        const existingProduct = await Product.findOne({ sku: newSku });
        if (!existingProduct) {
          isUnique = true;
        }
      }
      product.sku = newSku;
      if (product.stock < 0) {
        product.stock = 0;
      }
      await product.save({ validateBeforeSave: false });
      count++;
      if (count % 10 === 0) {
        console.log(`Processed ${count} products...`);
      }
    }

    console.log(`Successfully backfilled SKUs for ${count} products.`);
    process.exit(0);
  } catch (error) {
    console.error('Error backfilling SKUs:', error);
    process.exit(1);
  }
};

backfillSKUs();
