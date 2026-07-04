const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Store = require('./models/Store');
const InvoiceCounter = require('./models/InvoiceCounter');

async function migrateInvoices() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    // 1. Ensure the store has invoiceCode '01'
    await db.collection('stores').updateMany(
      {},
      { $set: { invoiceCode: '01' } }
    );
    console.log('Updated all stores to have invoiceCode 01');

    const store = await db.collection('stores').findOne({});
    if (!store) {
      console.log('No store found, exiting');
      process.exit(0);
    }

    const storeId = store._id;

    // 2. Find all orders with an already generated invoice
    const orders = await db.collection('orders').find({ "invoice.generated": true }).toArray();
    console.log(`Found ${orders.length} orders with generated invoices.`);

    // Reset counters to be safe
    await db.collection('invoicecounters').deleteMany({});

    for (const order of orders) {
      const generatedAt = order.invoice.generatedAt ? new Date(order.invoice.generatedAt) : new Date();
      const month = String(generatedAt.getMonth() + 1).padStart(2, '0');
      const year = String(generatedAt.getFullYear()).slice(-2);
      const monthYear = `${month}${year}`;

      const counter = await InvoiceCounter.findOneAndUpdate(
        { storeId, monthYear },
        { $inc: { sequence: 1 } },
        { new: true, upsert: true }
      );

      const sequenceStr = String(counter.sequence).padStart(4, '0');
      const newInvoiceNumber = `01${monthYear}${sequenceStr}`;

      await db.collection('orders').updateOne(
        { _id: order._id },
        { $set: { "invoice.invoiceNumber": newInvoiceNumber } }
      );
      console.log(`Updated Order ${order.orderNumber || order._id} invoiceNumber to ${newInvoiceNumber}`);
    }

    // Also update any manual invoices in 'invoices' collection
    const manualInvoices = await db.collection('invoices').find({}).toArray();
    for (const inv of manualInvoices) {
      const generatedAt = inv.createdAt ? new Date(inv.createdAt) : new Date();
      const month = String(generatedAt.getMonth() + 1).padStart(2, '0');
      const year = String(generatedAt.getFullYear()).slice(-2);
      const monthYear = `${month}${year}`;

      const counter = await InvoiceCounter.findOneAndUpdate(
        { storeId, monthYear },
        { $inc: { sequence: 1 } },
        { new: true, upsert: true }
      );

      const sequenceStr = String(counter.sequence).padStart(4, '0');
      const newInvoiceNumber = `01${monthYear}${sequenceStr}`;

      await db.collection('invoices').updateOne(
        { _id: inv._id },
        { $set: { invoiceNumber: newInvoiceNumber } }
      );
      console.log(`Updated Manual Invoice ${inv._id} invoiceNumber to ${newInvoiceNumber}`);
    }

    console.log('Migration complete.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateInvoices();
