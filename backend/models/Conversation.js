const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  userModel: {
    type: String,
    required: true,
    enum: ['Admin', 'StaffMember']
  },
  name: {
    type: String,
    required: true
  }
}, { _id: false });

const ConversationSchema = new mongoose.Schema(
  {
    participants: [participantSchema],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null
    },
    lastMessageContent: {
      type: String,
      default: ''
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: {} // Keyed by userId string
    }
  },
  {
    timestamps: true,
    collection: 'conversations'
  }
);

module.exports = mongoose.model('Conversation', ConversationSchema);
