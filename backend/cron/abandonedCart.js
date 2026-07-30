const cron = require('node-cron');
const nodemailer = require('nodemailer');
const Cart = require('../models/Cart');
const Customer = require('../models/Customer');

const sendAbandonedCartEmail = async (cart, customer) => {
  // Determine SMTP config (using environment variables or defaults)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER, // e.g., your gmail
      pass: process.env.SMTP_PASS, // e.g., app password
    },
  });

  const cartTotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const checkoutUrl = `${process.env.NEXT_PUBLIC_API_URL_PROD || 'https://plantingarden.com'}/checkout`;

  const itemsHtml = cart.items.map(item => `
    <div style="display: flex; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
      <img src="${item.image}" alt="${item.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; margin-right: 15px;" />
      <div>
        <h4 style="margin: 0 0 5px 0; color: #333;">${item.name}</h4>
        <p style="margin: 0; color: #666; font-size: 14px;">Variant: ${item.sizeVariant.name} - ${item.potVariant.name}</p>
        <p style="margin: 5px 0 0 0; color: #16a34a; font-weight: bold;">₹${item.totalPrice} (Qty: ${item.quantity})</p>
      </div>
    </div>
  `).join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #16a34a; margin: 0;">You left something behind! 🛒</h2>
      </div>
      <p style="color: #444; font-size: 16px;">Hi ${customer.firstName},</p>
      <p style="color: #444; font-size: 16px;">We noticed you left some items in your shopping cart. They are waiting for you!</p>
      
      <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
        ${itemsHtml}
        <div style="text-align: right; margin-top: 15px;">
          <h3 style="margin: 0; color: #333;">Total: ₹${cartTotal}</h3>
        </div>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${checkoutUrl}" style="background: #16a34a; color: white; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">Complete Your Purchase</a>
      </div>
      
      <p style="color: #888; font-size: 12px; text-align: center; margin-top: 30px;">
        If you have any questions, feel free to reply to this email.<br/>
        &copy; ${new Date().getFullYear()} ${cart.storeName || 'Plants in Garden'}
      </p>
    </div>
  `;

  const mailOptions = {
    from: `"Plants in Garden" <${process.env.SMTP_USER}>`,
    to: customer.email,
    subject: "Wait! You left items in your cart 🌿",
    html: html
  };

  await transporter.sendMail(mailOptions);
};

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
          if (process.env.SMTP_USER && process.env.SMTP_PASS) {
             await sendAbandonedCartEmail(cart, customer);
             cart.recoveryEmailSent = true;
             await cart.save();
             console.log(`[CRON] Sent recovery email to ${customer.email}`);
          } else {
             console.log(`[CRON] SMTP credentials not set. Would have sent email to ${customer.email}`);
             // Still mark as sent so we don't keep logging it during local testing if SMTP is missing
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
