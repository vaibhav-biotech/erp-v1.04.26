const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      unique: true,
      default: 'global' // ensures only one global settings doc
    },
    emails: {
      orderAlertsEnabled: { type: Boolean, default: true },
      accountantEmails: [{ type: String, trim: true }],
      superadminEmails: [{ type: String, trim: true }]
    },
    paymentGateway: {
      allowOnlinePayments: { type: Boolean, default: true }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', SettingsSchema);
