const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://plants-mall:plants2003@plants-mall.otyfvij.mongodb.net/plants-mall')
  .then(async () => {
    const db = mongoose.connection.db;
    const prodRes = await db.collection('products').updateMany({ storeName: 'plants in garden' }, { $set: { storeName: 'plantsingarden' } });
    console.log('Products updated:', prodRes.modifiedCount);
    
    const catRes = await db.collection('categories').updateMany({ storeName: 'plants in garden' }, { $set: { storeName: 'plantsingarden' } });
    console.log('Categories updated:', catRes.modifiedCount);
    
    const orderRes = await db.collection('orders').updateMany({ storeName: 'plants in garden' }, { $set: { storeName: 'plantsingarden' } });
    console.log('Orders updated:', orderRes.modifiedCount);
    
    const custRes = await db.collection('customers').updateMany({ storeName: 'plants in garden' }, { $set: { storeName: 'plantsingarden' } });
    console.log('Customers updated:', custRes.modifiedCount);
    
    process.exit(0);
  });
