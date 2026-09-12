const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');

// @route   GET /api/messages/channel/:channelId
// @desc    Get message history for a channel
router.get('/channel/:channelId', protect, async (req, res) => {
  try {
    const { limit = 50, before } = req.query;
    const query = {
      channel: req.params.channelId
    };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('sender', 'username avatar status')
      .populate({
        path: 'replyTo',
        select: 'content sender attachment',
        populate: { path: 'sender', select: 'username' }
      })
      .populate('reactions.users', 'username avatar');

    // Return in chronological order
    return res.json(messages.reverse());
  } catch (error) {
    console.error('Fetch channel messages error:', error);
    return res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// @route   GET /api/messages/direct/:userId
// @desc    Get 1-on-1 direct messages between logged-in user and specified user
router.get('/direct/:userId', protect, async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const currentUserId = req.user._id;
    const { limit = 50, before } = req.query;

    const query = {
      channel: null,
      $or: [
        { sender: currentUserId, recipient: otherUserId },
        { sender: otherUserId, recipient: currentUserId }
      ]
    };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('sender', 'username avatar status')
      .populate({
        path: 'replyTo',
        select: 'content sender attachment',
        populate: { path: 'sender', select: 'username' }
      })
      .populate('reactions.users', 'username avatar');

    return res.json(messages.reverse());
  } catch (error) {
    console.error('Fetch direct messages error:', error);
    return res.status(500).json({ message: 'Failed to fetch direct messages' });
  }
});

// @route   POST /api/messages/upload
// @desc    Upload file or image attachment
router.post('/upload', protect, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const isImage = req.file.mimetype.startsWith('image/');
    const fileUrl = `/uploads/${req.file.filename}`;

    return res.json({
      url: fileUrl,
      filename: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      messageType: isImage ? 'image' : 'file'
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ message: 'File upload failed' });
  }
});

// @route   DELETE /api/messages/:id
// @desc    Delete a message
router.delete('/:id', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    message.isDeleted = true;
    message.content = 'This message was deleted';
    message.attachment = undefined;
    await message.save();

    return res.json({ message: 'Message deleted successfully', id: message._id });
  } catch (error) {
    console.error('Delete message error:', error);
    return res.status(500).json({ message: 'Failed to delete message' });
  }
});

module.exports = router;
