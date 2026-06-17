const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'backend', 'routes', 'superadmin.js');
let content = fs.readFileSync(file, 'utf8');

const newRoute = `
// ==========================================
// 5. ALL ORDERS
// ==========================================

// Get all orders across all stores
router.get('/orders', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const orders = await db
      .collection('orders')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error('[Superadmin Get Orders Error]', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

module.exports = router;
`;

content = content.replace('module.exports = router;', newRoute);

fs.writeFileSync(file, content);
console.log('Successfully added /orders route to superadmin.js');
