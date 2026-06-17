const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'backend', 'routes', 'superadmin.js');
let content = fs.readFileSync(file, 'utf8');

const newRoute = `
// Get single order by ID
router.get('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require('mongoose');
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order id' });
    }

    const db = mongoose.connection.db;
    const order = await db.collection('orders').findOne({ _id: new mongoose.Types.ObjectId(id) });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('[Superadmin Get Single Order Error]', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order details',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

module.exports = router;
`;

content = content.replace('module.exports = router;', newRoute);

fs.writeFileSync(file, content);
console.log('Successfully added /orders/:id route to superadmin.js');
