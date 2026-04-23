const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://plants-mall:plants2003@plants-mall.otyfvij.mongodb.net/plants-mall';

async function fixCustomer() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Find and update the customer
    const result = await db.collection('customers').updateOne(
      { email: 'piyushmagar4p@gmail.com' },
      { $set: { store: 'Plants in Garden' } }
    );

    console.log('Update result:', result);
    
    // Verify the update
    const customer = await db.collection('customers').findOne({ 
      email: 'piyushmagar4p@gmail.com' 
    });
    
    console.log('Customer after update:', customer);
    
    await mongoose.connection.close();
    console.log('✅ Done');
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

fixCustomer();
