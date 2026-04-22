/**
 * Migration script to update existing products with category string to category ID
 * Run once: node migrate-products.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('./models/Product');
const Category = require('./models/Category');

const migrateProducts = async () => {
  try {
    console.log('🔄 Starting product migration...');
    
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/plants-db';
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    // Get all products
    const products = await Product.find({});
    console.log(`📊 Found ${products.length} products to check`);

    let migratedCount = 0;

    for (const product of products) {
      // Check if category is a string (old format)
      if (typeof product.category === 'string') {
        console.log(`\n🔄 Processing: ${product.name}`);
        console.log(`   Current category: ${product.category} (type: ${typeof product.category})`);

        // Find category by name
        const category = await Category.findOne({
          name: { $regex: new RegExp(`^${product.category}$`, 'i') }
        });

        if (category) {
          // Update product with category ID
          product.category = category._id.toString();
          await product.save();
          console.log(`   ✅ Updated to category ID: ${category._id}`);
          migratedCount++;
        } else {
          console.log(`   ⚠️ Category not found: ${product.category}`);
        }
      } else {
        console.log(`✅ Product "${product.name}" already has category ID`);
      }
    }

    console.log(`\n📈 Migration complete!`);
    console.log(`   Total migrated: ${migratedCount}/${products.length}`);

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
};

migrateProducts();
