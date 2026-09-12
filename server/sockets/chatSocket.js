const User = require('../models/User');
const Message = require('../models/Message');
const Channel = require('../models/Channel');

// Map: userId -> Set of socketIds
const onlineUsers = new Map();

const setupChatSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`[Socket] New connection: ${socket.id}`);

    // Register user presence
    socket.on('user:join', async (userData) => {
      try {
        if (!userData || !userData._id) return;
        const userId = userData._id.toString();
        socket.userId = userId;

        if (!onlineUsers.has(userId)) {
          onlineUsers.set(userId, new Set());
        }
        onlineUsers.get(userId).add(socket.id);

        // Join personal user room for direct messages and targeted alerts
        socket.join(`user:${userId}`);

        // Update user status in DB
        await User.findByIdAndUpdate(userId, {
          status: 'online',
          lastSeen: new Date()
        });

        // Broadcast current online user IDs to everyone
        const onlineUserIds = Array.from(onlineUsers.keys());
        io.emit('presence:online_list', onlineUserIds);
        io.emit('user:status_updated', { userId, status: 'online' });
      } catch (err) {
        console.error('[Socket] user:join error:', err);
      }
    });

    // Join Channel
    socket.on('channel:join', ({ channelId }) => {
      if (!channelId) return;
      socket.join(`channel:${channelId}`);
      console.log(`[Socket] Socket ${socket.id} joined channel:${channelId}`);
    });

    // Leave Channel
    socket.on('channel:leave', ({ channelId }) => {
      if (!channelId) return;
      socket.leave(`channel:${channelId}`);
      console.log(`[Socket] Socket ${socket.id} left channel:${channelId}`);
    });

    // Send Message (Channel or Direct)
    socket.on('message:send', async (data, callback) => {
      try {
        const { channelId, recipientId, senderId, content, attachment, replyToId } = data;

        if (!senderId || (!content && !attachment)) {
          if (typeof callback === 'function') callback({ error: 'Message content or attachment required' });
          return;
        }

        const messageData = {
          sender: senderId,
          content: content || '',
          channel: channelId || null,
          recipient: recipientId || null,
          replyTo: replyToId || null,
          messageType: attachment ? (attachment.messageType || 'file') : 'text'
        };

        if (attachment) {
          messageData.attachment = {
            url: attachment.url,
            filename: attachment.filename,
            fileType: attachment.fileType,
            fileSize: attachment.fileSize
          };
        }

        const newMessage = await Message.create(messageData);

        // Populate details for client rendering
        const populatedMessage = await Message.findById(newMessage._id)
          .populate('sender', 'username avatar status')
          .populate({
            path: 'replyTo',
            select: 'content sender attachment',
            populate: { path: 'sender', select: 'username' }
          })
          .populate('reactions.users', 'username avatar');

        if (channelId) {
          io.to(`channel:${channelId}`).emit('message:new', populatedMessage);
        } else if (recipientId) {
          // Send to recipient's room and sender's room
          io.to(`user:${recipientId}`).emit('message:new', populatedMessage);
          io.to(`user:${senderId}`).emit('message:new', populatedMessage);
        }

        if (typeof callback === 'function') {
          callback({ success: true, message: populatedMessage });
        }
      } catch (err) {
        console.error('[Socket] message:send error:', err);
        if (typeof callback === 'function') callback({ error: 'Failed to send message' });
      }
    });

    // Typing Indicators
    socket.on('typing:start', ({ channelId, recipientId, username, userId }) => {
      if (channelId) {
        socket.to(`channel:${channelId}`).emit('typing:update', {
          channelId,
          userId,
          username,
          isTyping: true
        });
      } else if (recipientId) {
        socket.to(`user:${recipientId}`).emit('typing:update', {
          recipientId,
          fromUserId: userId,
          username,
          isTyping: true
        });
      }
    });

    socket.on('typing:stop', ({ channelId, recipientId, username, userId }) => {
      if (channelId) {
        socket.to(`channel:${channelId}`).emit('typing:update', {
          channelId,
          userId,
          username,
          isTyping: false
        });
      } else if (recipientId) {
        socket.to(`user:${recipientId}`).emit('typing:update', {
          recipientId,
          fromUserId: userId,
          username,
          isTyping: false
        });
      }
    });

    // Add / Toggle Reaction
    socket.on('message:react', async ({ messageId, emoji, userId }) => {
      try {
        if (!messageId || !emoji || !userId) return;

        const message = await Message.findById(messageId);
        if (!message) return;

        let reactionEntry = message.reactions.find((r) => r.emoji === emoji);

        if (reactionEntry) {
          const userIdx = reactionEntry.users.findIndex((u) => u.toString() === userId.toString());
          if (userIdx > -1) {
            // Remove reaction (toggle off)
            reactionEntry.users.splice(userIdx, 1);
            if (reactionEntry.users.length === 0) {
              message.reactions = message.reactions.filter((r) => r.emoji !== emoji);
            }
          } else {
            // Add reaction
            reactionEntry.users.push(userId);
          }
        } else {
          // New emoji reaction
          message.reactions.push({
            emoji,
            users: [userId]
          });
        }

        await message.save();

        const updated = await Message.findById(messageId)
          .populate('reactions.users', 'username avatar')
          .select('reactions channel recipient');

        const payload = {
          messageId,
          reactions: updated.reactions
        };

        if (updated.channel) {
          io.to(`channel:${updated.channel}`).emit('message:reaction_updated', payload);
        } else if (updated.recipient) {
          io.to(`user:${updated.recipient}`).emit('message:reaction_updated', payload);
          io.to(`user:${userId}`).emit('message:reaction_updated', payload);
        }
      } catch (err) {
        console.error('[Socket] reaction error:', err);
      }
    });

    // Delete message
    socket.on('message:delete', async ({ messageId, userId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;
        if (message.sender.toString() !== userId.toString()) return;

        message.isDeleted = true;
        message.content = 'This message was deleted';
        message.attachment = undefined;
        await message.save();

        const payload = {
          messageId: message._id,
          isDeleted: true,
          content: message.content
        };

        if (message.channel) {
          io.to(`channel:${message.channel}`).emit('message:deleted', payload);
        } else if (message.recipient) {
          io.to(`user:${message.recipient}`).emit('message:deleted', payload);
          io.to(`user:${message.sender}`).emit('message:deleted', payload);
        }
      } catch (err) {
        console.error('[Socket] delete error:', err);
      }
    });

    // Custom status change
    socket.on('user:status_change', async ({ userId, status, customStatus }) => {
      try {
        if (!userId) return;
        await User.findByIdAndUpdate(userId, { status, customStatus });
        io.emit('user:status_updated', { userId, status, customStatus });
      } catch (err) {
        console.error('[Socket] status change error:', err);
      }
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
      const userId = socket.userId;
      if (userId && onlineUsers.has(userId)) {
        const userSockets = onlineUsers.get(userId);
        userSockets.delete(socket.id);

        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          try {
            await User.findByIdAndUpdate(userId, {
              status: 'offline',
              lastSeen: new Date()
            });
            io.emit('presence:online_list', Array.from(onlineUsers.keys()));
            io.emit('user:status_updated', { userId, status: 'offline' });
          } catch (err) {
            console.error('[Socket] disconnect DB error:', err);
          }
        }
      }
    });
  });
};

module.exports = { setupChatSocket };
