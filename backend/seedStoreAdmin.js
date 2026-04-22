require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

const seedStoreAdmin = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp-db';
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✓ MongoDB connected for seeding\n');

    // Check if store admin already exists
    const adminExists = await Admin.findOne({ 
      email: 'admin@plantsingarden.com',
      storeName: 'Plants in Garden'
    });
    
    if (adminExists) {
      console.log('✓ Store admin for "Plants in Garden" already exists');
      console.log('Email: admin@plantsingarden.com');
      console.log('Password: Plants@123');
      process.exit(0);
    }

    // Create store admin for Plants in Garden
    const storeAdmin = new Admin({
      email: 'admin@plantsingarden.com',
      password: 'Plants@123',
      firstName: 'Store',
      lastName: 'Admin',
      phone: '+919876543210',
      role: 'store_admin',
      storeName: 'Plants in Garden',
      permissions: {
        canEditProducts: true,
        canEditCategories: true,
        canManageCustomers: true,
        canViewAnalytics: true,
        canManageOrders: true,
        canManageAdmins: false,
        canAccessAllStores: false
      },
      isActive: true
    });

    await storeAdmin.save();
    console.log('✅ Store admin created successfully!\n');
    console.log('Store Name: Plants in Garden');
    console.log('Role: Store Admin (Tenant Admin)');
    console.log('Email: admin@plantsingarden.com');
    console.log('Password: Plants@123');
    console.log('\n📍 Login at: http://localhost:3000/admin');

    process.exit(0);
  } catch (error) {
    console.error('✗ Error seeding store admin:', error.message);
    process.exit(1);
  }
};

seedStoreAdmin();
