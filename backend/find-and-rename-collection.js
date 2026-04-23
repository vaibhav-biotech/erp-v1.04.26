const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://plants-mall:plants2003@plants-mall.otyfvij.mongodb.net/plants-mall';

async function findAndRenameCollection() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    
    // Search for the customer in all collections
    const targetEmail1 = 'piyushmagar4p@gmail.com';
    const targetEmail2 = 'pixelsadvertise@gmail.com';
    
    console.log(`🔍 Searching for customers: ${targetEmail1}, ${targetEmail2}\n`);
    
    const collections = await db.listCollections().toArray();
    let foundCollection = null;
    
    for (const coll of collections) {
      if (coll.name.includes('customer')) {
        const collection = db.collection(coll.name);
        const doc1 = await collection.findOne({ email: targetEmail1 });
        const doc2 = await collection.findOne({ email: targetEmail2 });
        
        if (doc1 || doc2) {
          console.log(`✅ FOUND! Collection: ${coll.name}`);
          foundCollection = coll.name;
          
          if (doc1) console.log(`   - Found: ${targetEmail1}`);
          if (doc2) console.log(`   - Found: ${targetEmail2}`);
          break;
        }
      }
    }
    
    if (foundCollection) {
      // Now rename this collection to 'plants-in-garden_customers'
      const newName = 'plants-in-garden_customers';
      
      console.log(`\n📝 Renaming collection from "${foundCollection}" to "${newName}"...`);
      
      // Rename the collection
      await db.collection(foundCollection).rename(newName);
      
      console.log(`✅ Collection renamed successfully!`);
      
      // Verify
      const newCollection = db.collection(newName);
      const count = await newCollection.countDocuments();
      console.log(`✅ New collection "${newName}" has ${count} documents`);
      
      const customers = await newCollection.find({}).toArray();
      console.log('\n📋 Customers in new collection:');
      customers.forEach(c => {
        console.log(`   - ${c.email} (${c.firstName} ${c.lastName})`);
      });
      
    } else {
      console.log(`❌ Collection not found!`);
    }
    
    await mongoose.connection.close();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

findAndRenameCollection();
