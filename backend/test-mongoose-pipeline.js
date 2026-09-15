const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/test');
const ProductTest = mongoose.model('ProductTest', new mongoose.Schema({ stock: Number }));

async function run() {
  const p = await ProductTest.create({ stock: 5 });
  await ProductTest.findByIdAndUpdate(p._id, [
    { $set: { stock: { $max: [0, { $subtract: ["$stock", 10] }] } } }
  ]);
  const updated = await ProductTest.findById(p._id);
  console.log("Updated stock:", updated.stock);
  process.exit(0);
}
run();
