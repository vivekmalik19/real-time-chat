const express = require('express');
const router = express.Router();
const Channel = require('../models/Channel');
const { protect } = require('../middleware/auth');

// @route   GET /api/channels
// @desc    Get all public channels (or channels user is member of)
router.get('/', protect, async (req, res) => {
  try {
    const channels = await Channel.find({
      $or: [{ isPrivate: false }, { members: req.user._id }]
    }).sort({ createdAt: 1 });

    return res.json(channels);
  } catch (error) {
    console.error('Fetch channels error:', error);
    return res.status(500).json({ message: 'Failed to fetch channels' });
  }
});

// @route   POST /api/channels
// @desc    Create a new channel
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, isPrivate } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Channel name is required' });
    }

    const cleanName = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
    if (cleanName.length < 2) {
      return res.status(400).json({ message: 'Channel name must be at least 2 characters long' });
    }

    const existingChannel = await Channel.findOne({ name: cleanName });
    if (existingChannel) {
      return res.status(400).json({ message: `Channel #${cleanName} already exists` });
    }

    const channel = await Channel.create({
      name: cleanName,
      description: (description || '').trim(),
      isPrivate: !!isPrivate,
      createdBy: req.user._id,
      members: [req.user._id]
    });

    return res.status(201).json(channel);
  } catch (error) {
    console.error('Create channel error:', error);
    return res.status(500).json({ message: 'Failed to create channel' });
  }
});

// @route   GET /api/channels/:id
// @desc    Get single channel details
router.get('/:id', protect, async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id).populate('members', 'username avatar status');
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }
    return res.json(channel);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch channel' });
  }
});

module.exports = router;
