require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/Category');

const seedCategories = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp-db';
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✓ MongoDB connected for seeding categories');

    // Clear existing categories
    await Category.deleteMany({});
    console.log('✓ Cleared existing categories');

    // Create test categories with subcategories
    const categories = [
      {
        name: 'Plants',
        slug: 'plants',
        description: 'Fresh and healthy plants',
        icon: '🌱',
        subcategories: [
          { name: 'Indoor Plants', slug: 'indoor-plants', description: 'Plants for indoor spaces' },
          { name: 'Outdoor Plants', slug: 'outdoor-plants', description: 'Plants for outdoor gardens' },
          { name: 'Flowering Plants', slug: 'flowering-plants', description: 'Colorful flowering plants' },
        ],
      },
      {
        name: 'Seeds',
        slug: 'seeds',
        description: 'Premium quality seeds',
        icon: '🌾',
        subcategories: [
          { name: 'Vegetable Seeds', slug: 'vegetable-seeds', description: 'Organic vegetable seeds' },
          { name: 'Flower Seeds', slug: 'flower-seeds', description: 'Beautiful flower seeds' },
          { name: 'Herb Seeds', slug: 'herb-seeds', description: 'Culinary herb seeds' },
        ],
      },
      {
        name: 'Tools & Accessories',
        slug: 'tools-accessories',
        description: 'Gardening tools and accessories',
        icon: '🛠️',
        subcategories: [
          { name: 'Pots & Planters', slug: 'pots-planters', description: 'Various pots and containers' },
          { name: 'Soil & Fertilizers', slug: 'soil-fertilizers', description: 'Premium soil and nutrients' },
          { name: 'Gardening Tools', slug: 'gardening-tools', description: 'Hand tools and equipment' },
        ],
      },
    ];

    const created = await Category.insertMany(categories);
    console.log(`✓ Created ${created.length} categories with subcategories`);
    
    created.forEach((cat) => {
      console.log(`\n📂 ${cat.name}`);
      cat.subcategories.forEach((sub) => {
        console.log(`   └ ${sub.name}`);
      });
    });

    process.exit(0);
  } catch (error) {
    console.error('✗ Error seeding categories:', error.message);
    process.exit(1);
  }
};

seedCategories();
