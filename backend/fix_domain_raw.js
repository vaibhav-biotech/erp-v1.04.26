require('dotenv').config();
const mongoose = require('mongoose');

async function fixStoreDomain() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const db = mongoose.connection.db;
  const result = await db.collection('stores').updateMany(
    { domain: { $in: ['plantsingarden.com', 'https://plantsingarden.com'] } },
    { $set: { domain: 'https://www.plantingarden.com' } }
  );

  console.log(`Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
  
  await mongoose.disconnect();
}

fixStoreDomain().catch(console.error);
