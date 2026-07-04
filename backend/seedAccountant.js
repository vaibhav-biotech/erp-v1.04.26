require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/erp-db')
.then(async () => {
  const existing = await Admin.findOne({ email: 'accountant@vaibhav.com' });
  if (!existing) {
    const accountant = new Admin({
      email: 'accountant@vaibhav.com',
      password: 'password123',
      firstName: 'Chief',
      lastName: 'Accountant',
      role: 'accountant'
    });
    await accountant.save();
    console.log('Created new accountant admin.');
  } else {
    console.log('Accountant already exists');
  }
  process.exit(0);
})
.catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
