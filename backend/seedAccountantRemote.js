require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

console.log('Using URI:', process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI)
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
    console.log('Accountant already exists in remote DB. Deleting and recreating to ensure password is correct.');
    await Admin.deleteOne({ email: 'accountant@vaibhav.com' });
    const accountant = new Admin({
      email: 'accountant@vaibhav.com',
      password: 'password123',
      firstName: 'Chief',
      lastName: 'Accountant',
      role: 'accountant'
    });
    await accountant.save();
    console.log('Recreated accountant admin.');
  }
  process.exit(0);
})
.catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
