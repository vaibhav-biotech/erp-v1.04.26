const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['order_placed', 'payment_success', 'payment_failed', 'general'],
      default: 'general'
    },
    targetRoles: [
      {
        type: String,
        enum: ['superadmin', 'admin', 'accountant', 'customer']
      }
    ],
    targetStore: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: false
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // or Admin/StaffMember depending on auth structure
      }
    ],
    metadata: {
      type: mongoose.Schema.Types.Mixed // to store orderId, amount, etc.
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', NotificationSchema);
