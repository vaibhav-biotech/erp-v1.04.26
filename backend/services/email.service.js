const axios = require('axios');

/**
 * Zepto Email API Service for sending transactional emails.
 * Ensure ZEPTO_API_KEY, ZEPTO_SENDER_EMAIL, and ZEPTO_SENDER_NAME are in .env
 */
class EmailService {
  constructor() {
    this.apiKey = process.env.ZEPTO_API_KEY;
    this.senderEmail = process.env.ZEPTO_SENDER_EMAIL || 'noreply@yourstore.com';
    this.senderName = process.env.ZEPTO_SENDER_NAME || 'Store Admin';
    // Use .in or .com based on the region your Zepto account is created in
    this.apiUrl = process.env.ZEPTO_API_URL || 'https://api.zeptomail.in/v1.1/email'; 
  }

  /**
   * Core function to send an email using Zepto API
   */
  async sendEmail({ to, toName, subject, htmlBody }) {
    if (!this.apiKey) {
      console.warn(`[EmailService - MOCK] Would send email to: ${to}`);
      console.warn(`Subject: ${subject}`);
      console.warn(`Body: ${htmlBody}`);
      return { success: true, mocked: true };
    }

    try {
      const payload = {
        from: {
          address: this.senderEmail,
          name: this.senderName,
        },
        to: [
          {
            email_address: {
              address: to,
              name: toName || to,
            },
          },
        ],
        subject: subject,
        htmlbody: htmlBody,
      };

      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          'Authorization': `Zoho-enczapikey ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log(`[EmailService] Email sent successfully to ${to}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`[EmailService] Error sending email to ${to}:`, error?.response?.data || error.message);
      // We don't want to break the main application flow if an email fails, so we return false
      return { success: false, error: error?.response?.data || error.message };
    }
  }

  // --- SPECIFIC EMAIL TRIGGERS ---

  async sendWelcomeEmail(customer) {
    const subject = `Welcome to ${customer.store || 'Our Store'}!`;
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Welcome, ${customer.firstName}!</h2>
        <p>Thank you for registering with us. We are thrilled to have you on board.</p>
        <p>You can now log in to your account and start shopping.</p>
        <br/>
        <p>Best regards,<br/>The ${customer.store || 'Store'} Team</p>
      </div>
    `;
    return this.sendEmail({ to: customer.email, toName: `${customer.firstName} ${customer.lastName}`, subject, htmlBody });
  }

  async sendPasswordResetEmail(email, resetUrl) {
    const subject = `Password Reset Request`;
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Password Reset</h2>
        <p>You requested a password reset. Please click the link below to set a new password:</p>
        <p><a href="${resetUrl}" style="padding: 10px 15px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
        <p>If you did not request this, please ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
      </div>
    `;
    return this.sendEmail({ to: email, subject, htmlBody });
  }

  async sendOrderConfirmation(order) {
    const customerInfo = order.customerInfo || {};
    const toEmail = customerInfo.email || 'customer@example.com';
    const toName = customerInfo.firstName ? `${customerInfo.firstName} ${customerInfo.lastName}` : 'Valued Customer';
    
    const subject = `Order Confirmation - ${order.orderNumber}`;
    let itemsHtml = order.items.map(item => `<li>${item.quantity}x ${item.name} - ₹${item.price}</li>`).join('');
    
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Thank you for your order!</h2>
        <p>Your order <strong>${order.orderNumber}</strong> has been successfully placed.</p>
        <h3>Order Summary:</h3>
        <ul>
          ${itemsHtml}
        </ul>
        <p><strong>Total Amount:</strong> ₹${order.total}</p>
        <p>We will notify you once your order is shipped.</p>
        <br/>
        <p>Best regards,<br/>The ${order.storeName || 'Store'} Team</p>
      </div>
    `;
    return this.sendEmail({ to: toEmail, toName, subject, htmlBody });
  }

  async sendOrderStatusUpdate(order) {
    const customerInfo = order.customerInfo || {};
    const toEmail = customerInfo.email || 'customer@example.com';
    const toName = customerInfo.firstName ? `${customerInfo.firstName} ${customerInfo.lastName}` : 'Valued Customer';
    
    const statusLabel = order.orderStatus.replace(/_/g, ' ').toUpperCase();
    const subject = `Update on your order: ${order.orderNumber}`;
    
    let extraInfo = '';
    if (order.orderStatus === 'shipped') {
        const tracking = order.tracking || {};
        extraInfo = `<p>Your order has been shipped!</p>`;
        if (tracking.courierName) extraInfo += `<p>Courier: ${tracking.courierName}</p>`;
        if (tracking.trackingNumber) extraInfo += `<p>Tracking Number: ${tracking.trackingNumber}</p>`;
        if (tracking.trackingUrl) extraInfo += `<p>Track here: <a href="${tracking.trackingUrl}">${tracking.trackingUrl}</a></p>`;
    }

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Order Status Update</h2>
        <p>Hello ${toName},</p>
        <p>The status of your order <strong>${order.orderNumber}</strong> is now: <strong>${statusLabel}</strong></p>
        ${extraInfo}
        <br/>
        <p>Best regards,<br/>The ${order.storeName || 'Store'} Team</p>
      </div>
    `;
    return this.sendEmail({ to: toEmail, toName, subject, htmlBody });
  }

  async sendInvoiceEmail(order) {
    const customerInfo = order.customerInfo || {};
    const toEmail = customerInfo.email || 'customer@example.com';
    const toName = customerInfo.firstName ? `${customerInfo.firstName} ${customerInfo.lastName}` : 'Valued Customer';
    
    const subject = `Invoice for your order: ${order.orderNumber}`;
    const invoiceNum = order.invoice?.invoiceNumber || 'N/A';
    
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Your Invoice is Ready</h2>
        <p>Hello ${toName},</p>
        <p>The invoice for your order <strong>${order.orderNumber}</strong> has been generated.</p>
        <p><strong>Invoice Number:</strong> ${invoiceNum}</p>
        <p><strong>Total Amount:</strong> ₹${order.total}</p>
        <p>You can download it from your account dashboard.</p>
        <br/>
        <p>Best regards,<br/>The ${order.storeName || 'Store'} Team</p>
      </div>
    `;
    return this.sendEmail({ to: toEmail, toName, subject, htmlBody });
  }

  async sendStaffWelcomeEmail(staff, rawPassword) {
    const subject = `Welcome to the Team, ${staff.firstName}!`;
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Welcome, ${staff.firstName}!</h2>
        <p>Your staff account has been created for the store: ${staff.store}</p>
        <p><strong>Login Email:</strong> ${staff.email}</p>
        <p><strong>Temporary Password:</strong> ${rawPassword}</p>
        <p>Please log in and change your password immediately.</p>
      </div>
    `;
    return this.sendEmail({ to: staff.email, toName: `${staff.firstName} ${staff.lastName}`, subject, htmlBody });
  }
}

module.exports = new EmailService();
