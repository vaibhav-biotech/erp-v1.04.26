const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://plants-mall:plants2003@plants-mall.otyfvij.mongodb.net/plants-mall')
  .then(async () => {
    const StaffMember = require('./models/StaffMember');
    // Update all staff members who have no storeName or storeName as empty string
    const result = await StaffMember.updateMany(
      { $or: [{ storeName: { $exists: false } }, { storeName: '' }, { storeName: null }] },
      { $set: { storeName: 'plantsingarden' } }
    );
    console.log(`Fixed ${result.modifiedCount} staff members!`);
    process.exit(0);
  });
