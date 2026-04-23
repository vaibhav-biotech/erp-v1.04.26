const mongoose = require('mongoose');
const Customer = require('./models/Customer');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/plants-mall')
  .then(async () => {
    const email = 'piyushmagar4p@gmail.com';
    const passwordToTry = 'Pm@22442232';
    
    const customer = await Customer.findOne({ email }).select('+password');
    
    if (!customer) {
      console.log('✗ Customer not found');
      process.exit(0);
    }
    
    console.log('✓ Customer found:', email);
    console.log('  Name:', customer.firstName, customer.lastName);
    console.log('  Stored hash:', customer.password);
    console.log('');
    
    // Try to compare
    try {
      const isMatch = await bcrypt.compare(passwordToTry, customer.password);
      console.log('Testing password: ' + passwordToTry);
      console.log('Match result:', isMatch ? '✅ MATCHED' : '❌ NO MATCH');
      
      if (!isMatch) {
        console.log('');
        console.log('Trying other possible passwords:');
        const passwords = ['Pm222442232', 'Pm@222442232', 'Plants@123', 'password'];
        
        for (const pwd of passwords) {
          const match = await bcrypt.compare(pwd, customer.password);
          console.log('  - "' + pwd + '":', match ? '✅ MATCH' : '❌ no');
        }
      }
    } catch (err) {
      console.error('Error comparing password:', err.message);
    }
    
    process.exit(0);
  });
