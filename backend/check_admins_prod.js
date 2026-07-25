require('dotenv').config();
const mongoose = require('mongoose');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');
  
  const Admin = require('./models/Admin');
  const StaffMember = require('./models/StaffMember');

  const admins = await Admin.find({}, 'email role isActive active storeName');
  console.log('--- ADMINS ---');
  console.log(admins);

  const staff = await StaffMember.find({}, 'email username role active storeName');
  console.log('--- STAFF MEMBERS ---');
  console.log(staff);

  await mongoose.disconnect();
}
check().catch(console.error);
