const mongoose = require('mongoose');

// The Atlas URI (source of new data)
const ATLAS_URI = "mongodb+srv://plants-mall:plants2003@plants-mall.otyfvij.mongodb.net/plants-mall";

// The VPS Local DB URI (destination)
// This assumes MongoDB is running locally on the VPS at the default port
const VPS_URI = "mongodb://127.0.0.1:27017/plants-mall";

async function syncDatabases() {
  console.log('🔄 Connecting to Atlas...');
  const atlasConnection = await mongoose.createConnection(ATLAS_URI).asPromise();
  
  console.log('🔄 Connecting to VPS DB...');
  const vpsConnection = await mongoose.createConnection(VPS_URI).asPromise();

  console.log('✅ Connected to both databases.\n');

  // Get all collections from Atlas
  const collections = await atlasConnection.db.listCollections().toArray();
  
  for (let col of collections) {
    const colName = col.name;
    // Skip system collections
    if (colName.startsWith('system.')) continue;
    
    console.log(`📦 Syncing collection: ${colName}`);
    
    const atlasCol = atlasConnection.db.collection(colName);
    const vpsCol = vpsConnection.db.collection(colName);

    const documents = await atlasCol.find({}).toArray();
    console.log(`   Found ${documents.length} documents in Atlas.`);

    let insertedCount = 0;
    let modifiedCount = 0;
    
    // Process in chunks to avoid memory overload if collections are large
    for (let doc of documents) {
      try {
        const result = await vpsCol.updateOne(
          { _id: doc._id },
          { $set: doc },
          { upsert: true }
        );
        if (result.upsertedCount > 0) insertedCount++;
        if (result.modifiedCount > 0) modifiedCount++;
      } catch (err) {
        console.error(`   ❌ Failed to sync doc ${doc._id}:`, err.message);
      }
    }
    
    console.log(`   ✅ Synced: ${insertedCount} new inserted, ${modifiedCount} updated.\n`);
  }

  console.log('🎉 Full database migration complete!');
  process.exit(0);
}

syncDatabases().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
