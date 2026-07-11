require('dotenv').config();
const mongoose = require('mongoose');

console.log("URI:", process.env.MONGODB_URI ? "present" : "missing");
mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log("Connected successfully");
  process.exit(0);
}).catch(err => {
  console.error("Connection failed:", err.message);
  process.exit(1);
});
