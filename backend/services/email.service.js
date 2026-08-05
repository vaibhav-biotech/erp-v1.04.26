const axios = require('axios');
const mongoose = require('mongoose');
const Store = require('../models/Store');

class EmailService {
  constructor() {
    this.apiKey = process.env.ZEPTO_API_KEY;
    this.senderEmail = process.env.ZEPTO_SENDER_EMAIL || 'noreply@yourstore.com';
    this.fallbackSenderName = process.env.ZEPTO_SENDER_NAME || 'Store Admin';
    this.apiUrl = process.env.ZEPTO_API_URL || 'https://api.zeptomail.in/v1.1/email'; 
  }

  async _getStoreBranding(storeIdentifier) {
    const defaultBranding = {
      name: this.fallbackSenderName,
      logo: null,
      primaryColor: '#007bff',
      domain: 'example.com'
    };

    if (!storeIdentifier) return defaultBranding;

    try {
      const store = await Store.findOne({ storeName: storeIdentifier.toLowerCase().trim() });
      if (store) {
        return {
          name: store.name || defaultBranding.name,
          logo: store.logo || null,
          primaryColor: store.primaryColor || defaultBranding.primaryColor,
          domain: store.domain || defaultBranding.domain
        };
      }
    } catch (e) {
      console.error('[EmailService] Error fetching store branding:', e);
    }
    return defaultBranding;
  }

  _getBaseTemplate(branding, innerContent) {
    const logoHtml = branding.logo 
      ? `<img src="${branding.logo}" alt="${branding.name}" style="max-height: 60px; max-width: 200px;">`
      : `<h1 style="margin: 0; color: #333; font-size: 24px;">${branding.name}</h1>`;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
            .header { padding: 20px; text-align: center; background-color: #f8f9fa; border-bottom: 3px solid ${branding.primaryColor}; }
            .content { padding: 30px; color: #444; line-height: 1.6; font-size: 15px; }
            .content h2 { color: ${branding.primaryColor}; margin-top: 0; font-size: 20px; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eaeaea; }
            .btn { display: inline-block; padding: 12px 24px; background-color: ${branding.primaryColor}; color: #ffffff !important; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 20px; margin-bottom: 20px; }
            .order-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .order-table th { text-align: left; padding: 10px; border-bottom: 2px solid #eee; color: #666; font-size: 14px; }
            .order-table td { padding: 10px; border-bottom: 1px solid #eee; font-size: 14px; }
            .total-row td { font-weight: bold; border-top: 2px solid #eee; font-size: 16px; }
            .info-block { background-color: #f8f9fa; padding: 15px; border-left: 4px solid ${branding.primaryColor}; border-radius: 4px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              ${logoHtml}
            </div>
            <div class="content">
              ${innerContent}
            </div>
            <div class="footer">
              &copy; ${new Date().getFullYear()} ${branding.name}. All rights reserved.<br>
              <a href="https://${branding.domain}" style="color: #888; text-decoration: none;">Visit our store</a>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  async sendEmail({ to, toName, subject, htmlBody, branding }) {
    if (!this.apiKey) {
      console.warn(`[EmailService - MOCK] Would send email to: ${to}`);
      console.warn(`Subject: ${subject}`);
      return { success: true, mocked: true };
    }

    try {
      const payload = {
        from: {
          address: this.senderEmail,
          name: branding ? branding.name : this.fallbackSenderName,
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
      return { success: false, error: error?.response?.data || error.message };
    }
  }

  async sendWelcomeEmail(customer) {
    const branding = await this._getStoreBranding(customer.store);
    const subject = `Welcome to ${branding.name}!`;
    const innerContent = `
      <h2>Welcome, ${customer.firstName}!</h2>
      <p>Thank you for registering with us. We are thrilled to have you on board.</p>
      <p>You can now log in to your account and start shopping.</p>
      <center>
        <a href="https://${branding.domain}/login" class="btn" style="color: #ffffff;">Login to Your Account</a>
      </center>
      <p>Best regards,<br/>The ${branding.name} Team</p>
    `;
    const htmlBody = this._getBaseTemplate(branding, innerContent);
    return this.sendEmail({ to: customer.email, toName: `${customer.firstName} ${customer.lastName}`, subject, htmlBody, branding });
  }

  async sendPasswordResetEmail(email, resetUrl, storeIdentifier) {
    const branding = await this._getStoreBranding(storeIdentifier);
    const subject = `Password Reset Request - ${branding.name}`;
    const innerContent = `
      <h2>Password Reset</h2>
      <p>You requested a password reset for your account. Please click the link below to set a new password:</p>
      <center>
        <a href="${resetUrl}" class="btn" style="color: #ffffff;">Reset Password</a>
      </center>
      <p>If you did not request this, please ignore this email. This link will expire in 1 hour.</p>
      <p>Best regards,<br/>The ${branding.name} Team</p>
    `;
    const htmlBody = this._getBaseTemplate(branding, innerContent);
    return this.sendEmail({ to: email, subject, htmlBody, branding });
  }

  async sendOrderConfirmation(order) {
    const branding = await this._getStoreBranding(order.storeName);
    const customerInfo = order.customerInfo || {};
    const toEmail = customerInfo.email || 'customer@example.com';
    const toName = customerInfo.firstName ? `${customerInfo.firstName} ${customerInfo.lastName}` : 'Valued Customer';
    
    const subject = `Order Confirmation - ${order.orderNumber}`;
    let itemsHtml = order.items.map(item => `
      <tr>
        <td>${item.quantity}x ${item.name}</td>
        <td style="text-align: right;">₹${item.price}</td>
      </tr>
    `).join('');
    
    const innerContent = `
      <h2>Thank you for your order!</h2>
      <p>Hello ${toName},</p>
      <p>Your order <strong>${order.orderNumber}</strong> has been successfully placed. We are preparing it for shipment.</p>
      
      <table class="order-table">
        <thead>
          <tr>
            <th>Item</th>
            <th style="text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
          <tr class="total-row">
            <td style="text-align: right; padding-right: 20px;">Total</td>
            <td style="text-align: right;">₹${order.total}</td>
          </tr>
        </tbody>
      </table>
      
      <p style="margin-top: 30px;">We will notify you once your order is shipped.</p>
      <p>Best regards,<br/>The ${branding.name} Team</p>
    `;
    const htmlBody = this._getBaseTemplate(branding, innerContent);
    return this.sendEmail({ to: toEmail, toName, subject, htmlBody, branding });
  }

  async sendOrderStatusUpdate(order) {
    const branding = await this._getStoreBranding(order.storeName);
    const customerInfo = order.customerInfo || {};
    const toEmail = customerInfo.email || 'customer@example.com';
    const toName = customerInfo.firstName ? `${customerInfo.firstName} ${customerInfo.lastName}` : 'Valued Customer';
    
    const statusLabel = order.orderStatus.replace(/_/g, ' ').toUpperCase();
    const subject = `Update on your order: ${order.orderNumber}`;
    
    let extraInfo = '';
    if (order.orderStatus === 'shipped') {
        const tracking = order.tracking || {};
        extraInfo = `
          <div class="info-block">
            <strong>Your order is on the way!</strong><br><br>
            ${tracking.courierName ? `Courier: ${tracking.courierName}<br>` : ''}
            ${tracking.trackingNumber ? `Tracking Number: ${tracking.trackingNumber}<br>` : ''}
            ${tracking.trackingUrl ? `<br><a href="${tracking.trackingUrl}" class="btn" style="color: #ffffff;">Track Order</a>` : ''}
          </div>
        `;
    }

    let itemsHtml = order.items.map(item => `
      <tr>
        <td>${item.quantity}x ${item.name}</td>
        <td style="text-align: right;">₹${item.price}</td>
      </tr>
    `).join('');

    const innerContent = `
      <h2>Order Status Update</h2>
      <p>Hello ${toName},</p>
      <p>The status of your order <strong>${order.orderNumber}</strong> has been updated to: <strong>${statusLabel}</strong></p>
      ${extraInfo}
      <table class="order-table">
        <thead>
          <tr>
            <th>Item</th>
            <th style="text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
          <tr class="total-row">
            <td style="text-align: right; padding-right: 20px;">Total</td>
            <td style="text-align: right;">₹${order.total}</td>
          </tr>
        </tbody>
      </table>
      <p>Best regards,<br/>The ${branding.name} Team</p>
    `;
    const htmlBody = this._getBaseTemplate(branding, innerContent);
    return this.sendEmail({ to: toEmail, toName, subject, htmlBody, branding });
  }

  async sendInvoiceEmail(order) {
    const branding = await this._getStoreBranding(order.storeName);
    const customerInfo = order.customerInfo || {};
    const toEmail = customerInfo.email || 'customer@example.com';
    const toName = customerInfo.firstName ? `${customerInfo.firstName} ${customerInfo.lastName}` : 'Valued Customer';
    
    const subject = `Invoice for your order: ${order.orderNumber}`;
    const invoiceNum = order.invoice?.invoiceNumber || 'N/A';
    
    let itemsHtml = order.items.map(item => `
      <tr>
        <td>${item.quantity}x ${item.name}</td>
        <td style="text-align: right;">₹${item.price}</td>
      </tr>
    `).join('');

    const innerContent = `
      <h2>Your Invoice is Ready</h2>
      <p>Hello ${toName},</p>
      <p>The invoice for your order <strong>${order.orderNumber}</strong> has been generated.</p>
      
      <div class="info-block">
        <strong>Invoice Number:</strong> ${invoiceNum}<br>
        <strong>Total Amount:</strong> ₹${order.total}
      </div>
      
      <table class="order-table">
        <thead>
          <tr>
            <th>Item</th>
            <th style="text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
          <tr class="total-row">
            <td style="text-align: right; padding-right: 20px;">Total</td>
            <td style="text-align: right;">₹${order.total}</td>
          </tr>
        </tbody>
      </table>

      <p>You can download it from your account dashboard.</p>
      <center>
        <a href="https://${branding.domain}/customer/orders/${order._id || order.id}" class="btn" style="color: #ffffff;">View Order</a>
      </center>
      <p>Best regards,<br/>The ${branding.name} Team</p>
    `;
    const htmlBody = this._getBaseTemplate(branding, innerContent);
    return this.sendEmail({ to: toEmail, toName, subject, htmlBody, branding });
  }

  async sendStaffWelcomeEmail(staff, rawPassword) {
    const branding = await this._getStoreBranding(staff.storeName);
    const subject = `Welcome to the Team, ${staff.name.split(' ')[0]}!`;
    const innerContent = `
      <h2>Welcome, ${staff.name.split(' ')[0]}!</h2>
      <p>Your staff account has been created for <strong>${branding.name}</strong>.</p>
      
      <div class="info-block">
        <strong>Login Email:</strong> ${staff.email}<br>
        <strong>Temporary Password:</strong> ${rawPassword}
      </div>
      
      <p>Please log in to the staff portal and change your password immediately.</p>
      <center>
        <a href="https://${branding.domain}/staff/login" class="btn" style="color: #ffffff;">Login to Portal</a>
      </center>
    `;
    const htmlBody = this._getBaseTemplate(branding, innerContent);
    return this.sendEmail({ to: staff.email, toName: staff.name, subject, htmlBody, branding });
  }

  async sendStaffRoleChangeEmail(staff) {
    const branding = await this._getStoreBranding(staff.storeName);
    const subject = `Role Update - ${branding.name}`;
    
    const portals = staff.portalAccess && staff.portalAccess.length > 0 
      ? staff.portalAccess.map(p => p.replace(/_/g, ' ').toUpperCase()).join(', ')
      : 'None';
      
    const innerContent = `
      <h2>Your Account has been Updated</h2>
      <p>Hello ${staff.name.split(' ')[0]},</p>
      <p>Your staff account permissions or roles have been updated by an administrator.</p>
      
      <div class="info-block">
        <strong>Role:</strong> ${staff.jobRoles && staff.jobRoles[0] ? staff.jobRoles[0].replace(/_/g, ' ').toUpperCase() : 'Staff'}<br>
        <strong>Portal Access:</strong> ${portals}
      </div>
      
      <p>If you have any questions, please contact your super admin.</p>
    `;
    const htmlBody = this._getBaseTemplate(branding, innerContent);
    return this.sendEmail({ to: staff.email, toName: staff.name, subject, htmlBody, branding });
  }

  async sendAbandonedCartEmail(cart, customer) {
    const branding = await this._getStoreBranding(cart.storeName);
    const toEmail = customer.email;
    const toName = customer.firstName ? `${customer.firstName} ${customer.lastName}` : 'Valued Customer';
    
    const subject = "Wait! You left items in your cart 🌿";
    
    const cartTotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const checkoutUrl = `https://${branding.domain}/checkout`;

    let itemsHtml = cart.items.map(item => `
      <div style="display: flex; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
        <img src="${item.image}" alt="${item.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; margin-right: 15px;" />
        <div>
          <h4 style="margin: 0 0 5px 0; color: #333;">${item.name}</h4>
          <p style="margin: 0; color: #666; font-size: 14px;">Variant: ${item.sizeVariant?.name || ''} - ${item.potVariant?.name || ''}</p>
          <p style="margin: 5px 0 0 0; color: ${branding.primaryColor}; font-weight: bold;">₹${item.totalPrice} (Qty: ${item.quantity})</p>
        </div>
      </div>
    `).join('');

    const innerContent = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: ${branding.primaryColor}; margin: 0;">You left something behind! 🛒</h2>
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
        <a href="${checkoutUrl}" class="btn" style="color: #ffffff;">Complete Your Purchase</a>
      </div>
    `;
    const htmlBody = this._getBaseTemplate(branding, innerContent);
    return this.sendEmail({ to: toEmail, toName, subject, htmlBody, branding });
  }
}

module.exports = new EmailService();
