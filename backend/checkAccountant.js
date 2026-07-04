require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/erp-db')
.then(async () => {
  const existing = await Admin.findOne({ email: 'accountant@vaibhav.com' });
  console.log(existing);
  process.exit(0);
})
.catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
