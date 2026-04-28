const mongoose = require('mongoose');
const Product = require('./models/Product');

const mongoUri = 'mongodb+srv://plants-mall:plants2003@plants-mall.otyfvij.mongodb.net/plants-mall';

const toSlug = (value) => String(value || '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');

const normalizeTags = (tags, fallbackSubcategory) => {
  const arr = Array.isArray(tags) ? tags : [];
  const subcategorySlug = toSlug(fallbackSubcategory);
  if (subcategorySlug && !arr.includes(subcategorySlug)) {
    arr.unshift(subcategorySlug);
  }
  return Array.from(new Set(arr.map(t => toSlug(t)).filter(Boolean)));
};

async function fixDuplicates() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find all products
    const allProducts = await Product.find({});
    console.log(`\n📊 Total products in database: ${allProducts.length}\n`);

    // Group by name to find duplicates
    const grouped = {};
    allProducts.forEach((p) => {
      const key = p.name.toLowerCase().trim();
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(p);
    });

    let mergedCount = 0;
    let deletedCount = 0;

    // Process each group
    for (const [name, products] of Object.entries(grouped)) {
      if (products.length > 1) {
        console.log(`\n🔄 Found ${products.length} duplicates of: ${name}`);
        
        // Use first product as base
        const baseProduct = products[0];
        const allSubcategories = products.map(p => p.subcategory).filter(Boolean);
        const allTags = products.flatMap(p => p.tags || []);
        
        console.log(`   Subcategories: ${allSubcategories.join(', ')}`);
        console.log(`   Current tags: ${allTags.join(', ')}`);
        
        // Merge all tags with all subcategories
        const mergedTags = normalizeTags([...allTags, ...allSubcategories], baseProduct.subcategory);
        console.log(`   Merged tags: ${mergedTags.join(', ')}`);

        // Update base product with merged tags
        baseProduct.tags = mergedTags;
        await baseProduct.save();
        console.log(`   ✅ Updated base product (${baseProduct._id}) with merged tags`);
        mergedCount++;

        // Delete duplicate products
        for (let i = 1; i < products.length; i++) {
          const dupProduct = products[i];
          await Product.deleteOne({ _id: dupProduct._id });
          console.log(`   ❌ Deleted duplicate (${dupProduct._id}) - was subcategory: ${dupProduct.subcategory}`);
          deletedCount++;
        }
      }
    }

    console.log(`\n\n✅ Migration complete!`);
    console.log(`   Products merged: ${mergedCount}`);
    console.log(`   Duplicates deleted: ${deletedCount}`);
    
    const finalCount = await Product.countDocuments({});
    console.log(`   Final product count: ${finalCount}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixDuplicates();
