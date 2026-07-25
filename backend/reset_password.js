require('dotenv').config();
const mongoose = require('mongoose');

async function resetPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const Admin = require('./models/Admin');
    
    // Find the admin
    const emailToUpdate = 'admin@plantsingarden.com';
    const newPassword = 'Plants@123';
    
    const admin = await Admin.findOne({ email: emailToUpdate });
    
    if (!admin) {
      console.log('Admin not found in DB!');
      process.exit(1);
    }

    console.log(`Found admin: ${admin.email}. Updating password...`);
    
    // Set new password
    admin.password = newPassword;
    
    // This will trigger the pre('save') hook in models/Admin.js to hash the password
    await admin.save();
    
    console.log('Password updated successfully!');
  } catch (error) {
    console.error('Error updating password:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

resetPassword();
