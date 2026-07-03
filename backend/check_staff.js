const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://plants-mall:plants2003@plants-mall.otyfvij.mongodb.net/plants-mall')
  .then(async () => {
    const StaffMember = require('./models/StaffMember');
    const members = await StaffMember.find({});
    for (const m of members) {
      console.log(`Username: ${m.username}, Email: ${m.email}, StoreName: ${m.storeName}`);
    }
    process.exit(0);
  });
