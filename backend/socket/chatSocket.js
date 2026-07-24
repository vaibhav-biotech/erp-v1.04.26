const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

// Key: userId string, Value: Set of socketIds
const onlineUsers = new Map();

module.exports = (io) => {
  io.on('connection', (socket) => {
    // console.log(`New socket connected: ${socket.id}`);

    socket.on('join', (userId) => {
      if (!userId) return;
      socket.userId = userId;
      
      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }
      onlineUsers.get(userId).add(socket.id);

      // Broadcast online status to all
      io.emit('user_status_change', { userId, status: 'online' });
    });

    socket.on('send_message', async (data, callback) => {
      try {
        const { conversationId, senderId, senderModel, content, attachments, receiverId } = data;
        
        let targetConversationId = conversationId;
        
        // Ensure conversation exists if it wasn't provided (new chat)
        if (!targetConversationId && receiverId) {
          let conv = await Conversation.findOne({
            'participants.userId': { $all: [senderId, receiverId] }
          });
          
          if (!conv) {
             const { receiverName, receiverModel, senderName } = data;
             if (!receiverName || !receiverModel || !senderName) {
               if (callback) callback({ success: false, error: 'Conversation not found' });
               return;
             }
             conv = new Conversation({
               participants: [
                 { userId: senderId, userModel: senderModel, name: senderName },
                 { userId: receiverId, userModel: receiverModel, name: receiverName }
               ]
             });
             await conv.save();
          }
          targetConversationId = conv._id;
        }

        if (!targetConversationId) {
          if (callback) callback({ success: false, error: 'Missing conversationId' });
          return;
        }

        const newMessage = new Message({
          conversationId: targetConversationId,
          senderId,
          senderModel,
          content: content || '',
          attachments: attachments || [],
          isReadBy: [senderId] // Sender has read their own message
        });

        await newMessage.save();

        // Update conversation's last message
        await Conversation.findByIdAndUpdate(targetConversationId, {
          lastMessage: newMessage._id,
          lastMessageContent: content || (attachments?.length ? 'Attachment' : ''),
          // We could increment unread counts here via a MongoDB aggregation, or do it on the client
        });

        // Find participants to send to
        const conv = await Conversation.findById(targetConversationId);
        if (conv) {
          conv.participants.forEach(p => {
            const pId = p.userId.toString();
            if (onlineUsers.has(pId)) {
               onlineUsers.get(pId).forEach(sId => {
                 io.to(sId).emit('receive_message', newMessage);
               });
            }
          });
        }

        if (callback) callback({ success: true, message: newMessage });
      } catch (error) {
        console.error('Send message error:', error);
        if (callback) callback({ success: false, error: error.message });
      }
    });

    socket.on('typing', ({ conversationId, userId, isTyping }) => {
      // Broadcast typing to everyone in conversation (handled via room or just broad to all for now)
      // For a scalable app, we should use socket.join(conversationId)
      socket.broadcast.emit('user_typing', { conversationId, userId, isTyping });
    });

    socket.on('mark_as_read', async ({ conversationId, userId, messageIds }) => {
      try {
        await Message.updateMany(
          { _id: { $in: messageIds } },
          { $addToSet: { isReadBy: userId } }
        );
        // Broadcast read receipt
        socket.broadcast.emit('messages_read', { conversationId, userId, messageIds });
      } catch (error) {
        console.error('Mark read error:', error);
      }
    });

    socket.on('disconnect', () => {
      if (socket.userId && onlineUsers.has(socket.userId)) {
        const userSockets = onlineUsers.get(socket.userId);
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(socket.userId);
          io.emit('user_status_change', { userId: socket.userId, status: 'offline' });
        }
      }
    });
  });
};
