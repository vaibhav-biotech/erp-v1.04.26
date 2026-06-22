require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
  console.log('Connected to MongoDB');

  // Check if it already exists
  const existing = await Admin.findOne({ email: 'inventory@vaibhav.com' });
  if (existing) {
    console.log('Inventory admin already exists! Overwriting role and permissions just in case.');
    existing.role = 'inventory_admin';
    existing.permissions = {
      canManageInventory: true,
      canManageMarketing: false,
      canManageCustomers: false,
      canViewAnalytics: true,
      canManageOrders: false,
      canManageAdmins: false,
      canAccessAllStores: false
    };
    await existing.save();
    console.log('Updated existing inventory admin.');
  } else {
    // Create new
    const inventoryAdmin = new Admin({
      email: 'inventory@vaibhav.com',
      password: 'password123',
      firstName: 'Central',
      lastName: 'Inventory',
      role: 'inventory_admin',
      permissions: {
        canManageInventory: true,
        canManageMarketing: false,
        canManageCustomers: false,
        canViewAnalytics: true,
        canManageOrders: false,
        canManageAdmins: false,
        canAccessAllStores: false
      }
    });

    await inventoryAdmin.save();
    console.log('Created new inventory admin.');
  }

  console.log('Done!');
  process.exit(0);
})
.catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
