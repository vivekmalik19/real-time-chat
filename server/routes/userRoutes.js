const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @route   GET /api/users
// @desc    Get all users or search users
router.get('/', protect, async (req, res) => {
  try {
    const { search } = req.query;
    let query = { _id: { $ne: req.user._id } };

    if (search) {
      query.username = { $regex: search.trim(), $options: 'i' };
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ status: 1, lastSeen: -1 })
      .limit(50);

    return res.json(users);
  } catch (error) {
    console.error('Fetch users error:', error);
    return res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user profile by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch user' });
  }
});

module.exports = router;
