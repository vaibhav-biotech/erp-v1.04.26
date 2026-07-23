require('dotenv').config();
const mongoose = require('mongoose');
const Store = require('./models/Store');

async function fixStoreDomain() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const stores = await Store.find({});
  for (const store of stores) {
    console.log(`Store: ${store.storeName}, Domain: ${store.domain}`);
    if (store.domain === 'plantsingarden.com' || store.domain === 'https://plantsingarden.com') {
      console.log(`Found incorrect domain for ${store.storeName}, fixing to https://www.plantingarden.com...`);
      store.domain = 'https://www.plantingarden.com';
      await store.save();
      console.log('Fixed!');
    }
  }

  mongoose.disconnect();
}

fixStoreDomain().catch(console.error);
