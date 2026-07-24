const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  type: {
    type: String, // 'image', 'pdf', 'document'
    required: true
  },
  name: {
    type: String,
    required: true
  }
}, { _id: false });

const MessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    senderModel: {
      type: String,
      required: true,
      enum: ['Admin', 'StaffMember']
    },
    content: {
      type: String,
      default: ''
    },
    attachments: [attachmentSchema],
    isReadBy: {
      type: [String], // Array of user IDs who have read this message
      default: []
    }
  },
  {
    timestamps: true,
    collection: 'messages'
  }
);

// Index for efficient querying by conversation
MessageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', MessageSchema);
