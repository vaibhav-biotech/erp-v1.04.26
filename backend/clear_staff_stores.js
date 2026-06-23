require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const StaffMember = require('./models/StaffMember');
    
    // Clear storeName for all staff members who are not store_admin
    const result = await StaffMember.updateMany(
      { role: { $ne: 'store_admin' } },
      { $set: { storeName: '' } }
    );
    
    console.log(`Updated ${result.modifiedCount} staff members to be unassigned.`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}
run();
