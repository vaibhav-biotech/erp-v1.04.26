const mongoose = require('mongoose');
const StaffMember = require('./backend/models/StaffMember');
const StaffTaskRecord = require('./backend/models/StaffTaskRecord');
const StaffCallLogRecord = require('./backend/models/StaffCallLogRecord');
require('dotenv').config({ path: './backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const staffMembers = await StaffMember.find({});
  const activeStaff = await StaffMember.find({ active: true });
  console.log('Total staff:', staffMembers.length, 'Active staff:', activeStaff.length);
  const tasks = await StaffTaskRecord.find({});
  console.log('Total tasks:', tasks.length);
  const calls = await StaffCallLogRecord.find({});
  console.log('Total calls:', calls.length);
  process.exit(0);
}
run();
