const cron = require('node-cron');
const Cart = require('../models/Cart');
const Customer = require('../models/Customer');
const emailService = require('../services/email.service');

// Schedule to run every hour at minute 0
cron.schedule('0 * * * *', async () => {
  console.log('[CRON] Running Abandoned Cart Check...');
  try {
    // Determine the threshold for "abandoned". 
    // E.g., older than 12 hours
    const ABANDONED_HOURS = parseInt(process.env.ABANDONED_CART_HOURS || '12', 10);
    const thresholdDate = new Date(Date.now() - ABANDONED_HOURS * 60 * 60 * 1000);

    const abandonedCarts = await Cart.find({
      items: { $not: { $size: 0 } },
      recoveryEmailSent: false,
      lastUpdatedAt: { $lt: thresholdDate }
    });

    console.log(`[CRON] Found ${abandonedCarts.length} abandoned carts to process.`);

    for (const cart of abandonedCarts) {
      const customer = await Customer.findById(cart.customerId);
      if (customer && customer.email) {
        try {
          if (emailService.apiKey) {
             await emailService.sendAbandonedCartEmail(cart, customer);
             cart.recoveryEmailSent = true;
             await cart.save();
             console.log(`[CRON] Sent recovery email to ${customer.email}`);
          } else {
             console.log(`[CRON] ZeptoMail API key not set. Would have sent email to ${customer.email}`);
             // Still mark as sent so we don't keep logging it during local testing if API key is missing
             cart.recoveryEmailSent = true;
             await cart.save();
          }
        } catch (emailErr) {
          console.error(`[CRON] Error sending email to ${customer.email}:`, emailErr);
        }
      }
    }
  } catch (error) {
    console.error('[CRON] Abandoned Cart job failed:', error);
  }
});

console.log('✓ Abandoned Cart Cron Job initialized.');
