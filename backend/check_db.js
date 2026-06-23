const mongoose = require('mongoose');
const url = 'mongodb+srv://vaibhavbiotech:Piyush2003@cluster0.p7qf3e9.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';
async function run() {
  await mongoose.connect(url);
  const db = mongoose.connection.db;
  const store = await db.collection('stores').findOne({});
  const product = await db.collection('products').findOne({});
  const order = await db.collection('orders').findOne({});
  console.log("Store:", store ? store.storeName : null);
  console.log("Product:", product ? product.storeName : null);
  console.log("Order:", order ? order.storeName : null);
  process.exit(0);
}
run();
