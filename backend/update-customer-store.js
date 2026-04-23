const mongoose = require('mongoose');

// Connect to MongoDB Atlas
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://piyushsrvr:Pm%4022442232@plants-mall.otyfvij.mongodb.net/plants-mall?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB Atlas');

    const Customer = require('./models/Customer.js');

    // Update customer store to "Plants in Garden"
    const result = await Customer.findOneAndUpdate(
      { email: 'piyushmagar4p@gmail.com' },
      { store: 'Plants in Garden' },
      { new: true }
    );

    console.log('✅ Customer updated:', result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
