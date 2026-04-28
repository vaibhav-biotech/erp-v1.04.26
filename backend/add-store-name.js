const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

async function addStoreNameToProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all products without storeName
    const productsWithoutStore = await Product.find({ 
      $or: [
        { storeName: { $exists: false } },
        { storeName: null }
      ]
    });
    
    console.log(`\n🔍 Found ${productsWithoutStore.length} products without storeName`);

    // Update all to remove storeName or set it
    const result = await Product.updateMany(
      { 
        $or: [
          { storeName: { $exists: false } },
          { storeName: null }
        ]
      },
      { $unset: { storeName: "" } }
    );

    console.log(`✅ Removed storeName field from ${result.modifiedCount} products`);

    // Verify
    const allProducts = await Product.find({});
    console.log(`\n📊 Total products: ${allProducts.length}`);
    console.log('\nSample products:');
    allProducts.slice(0, 5).forEach((p, i) => {
      console.log(`  ${i+1}. ${p.name}`);
      console.log(`     Status: ${p.status} | Tags: ${p.tags?.join(', ') || 'none'}`);
      console.log(`     StoreName: ${p.storeName || '(none)'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addStoreNameToProducts();
