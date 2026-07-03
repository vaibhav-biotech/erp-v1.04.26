const mongoose = require('mongoose');

const uri = "mongodb+srv://plants-mall:plants2003@plants-mall.otyfvij.mongodb.net/plants-mall";

mongoose.connect(uri)
  .then(async () => {
    console.log("✅ SUCCESSFULLY CONNECTED TO MONGODB!");
    
    try {
      const staff = await mongoose.connection.db.collection('staffmembers').find({ storeName: 'plantsingarden' }).toArray();
      console.log(`\n📊 Found ${staff.length} staff members for 'plantsingarden'`);
      
      const admins = await mongoose.connection.db.collection('admins').find().toArray();
      console.log(`\n📊 Found ${admins.length} global admins in the database:`);
      admins.forEach(doc => console.log(`  - ${doc.email}`));
      
      const stores = await mongoose.connection.db.collection('stores').find({ storeName: 'plantsingarden' }).toArray();
      console.log(`\n📊 Store 'plantsingarden' exists: ${stores.length > 0 ? 'YES' : 'NO'}`);
      
      process.exit(0);
    } catch (err) {
      console.error("Error:", err);
      process.exit(1);
    }
  });
