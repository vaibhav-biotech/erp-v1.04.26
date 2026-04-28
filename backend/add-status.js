const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

async function addStatusToProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all products without status
    const productsWithoutStatus = await Product.find({ status: { $exists: false } });
    console.log(`\n🔍 Found ${productsWithoutStatus.length} products without status`);

    // Update all to active
    const result = await Product.updateMany(
      { status: { $exists: false } },
      { $set: { status: 'active' } }
    );

    console.log(`✅ Updated ${result.modifiedCount} products to active status`);

    // Verify
    const allProducts = await Product.find({});
    console.log(`\n📊 Total products now: ${allProducts.length}`);
    console.log('\nSample products:');
    allProducts.slice(0, 3).forEach((p) => {
      console.log(`  - ${p.name} | Status: ${p.status} | Tags: ${p.tags?.join(', ') || 'none'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addStatusToProducts();
