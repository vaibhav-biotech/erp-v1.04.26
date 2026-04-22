require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

async function moveCollections() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    
    // Connect to MongoDB
    const conn = await mongoose.connect(MONGODB_URI);
    const db = conn.connection.db;
    
    console.log('✅ Connected to MongoDB');
    
    // Get test database
    const mongoClient = conn.connection.getClient();
    const testDB = mongoClient.db('test');
    const plantsMallDB = mongoClient.db('plants-mall');
    
    // Get all collections from test database
    const collections = await testDB.listCollections().toArray();
    console.log(`\n📋 Found ${collections.length} collections in test database\n`);
    
    for (const collection of collections) {
      const collName = collection.name;
      console.log(`📦 Copying ${collName}...`);
      
      try {
        // Get all documents from test collection
        const documents = await testDB.collection(collName).find({}).toArray();
        
        if (documents.length > 0) {
          // Insert into plants-mall database
          await plantsMallDB.collection(collName).insertMany(documents);
          console.log(`   ✅ Copied ${documents.length} documents`);
        } else {
          // Create empty collection
          await plantsMallDB.collection(collName).insertOne({ _temp: true });
          await plantsMallDB.collection(collName).deleteOne({ _temp: true });
          console.log(`   ✅ Created empty collection`);
        }
      } catch (err) {
        if (err.code === 11000) {
          console.log(`   ⚠️  Collection already exists, skipping`);
        } else {
          console.log(`   ❌ Error: ${err.message}`);
        }
      }
    }
    
    console.log('\n✅ All collections copied to plants-mall database!');
    
    // Verify
    const plantsMallCollections = await plantsMallDB.listCollections().toArray();
    console.log(`\n📊 plants-mall now has ${plantsMallCollections.length} collections`);
    console.log('Collections:', plantsMallCollections.map(c => c.name).join(', '));
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

moveCollections();
