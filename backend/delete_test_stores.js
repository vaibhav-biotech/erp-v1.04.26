require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    
    const testStoreNames = ['store2', 'store3', 'store4', 'store5', 'store6', 'store7', 'store8', 'store9', 'store10'];
    
    const result = await db.collection('stores').deleteMany({
      storeName: { $in: testStoreNames }
    });
    
    console.log(`Deleted ${result.deletedCount} test stores.`);
  } catch (error) {
    console.error('Error deleting test stores:', error);
  } finally {
    process.exit(0);
  }
}
run();
