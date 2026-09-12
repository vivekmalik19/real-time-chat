const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, generateToken } = require('../middleware/auth');

// Default avatar generator
const getDefaultAvatar = (seed) => {
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed)}`;
};

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, avatar } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const trimmedUsername = username.trim();
    const existingUser = await User.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${trimmedUsername}$`, 'i') } },
        ...(email ? [{ email: email.toLowerCase().trim() }] : [])
      ]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Username or email is already taken' });
    }

    const user = await User.create({
      username: trimmedUsername,
      email: email ? email.toLowerCase().trim() : undefined,
      password,
      avatar: avatar || getDefaultAvatar(trimmedUsername),
      status: 'online',
      isGuest: false
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      token,
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user with username/email & password
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const trimmed = username.trim();
    const user = await User.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${trimmed}$`, 'i') } },
        { email: trimmed.toLowerCase() }
      ]
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    user.status = 'online';
    user.lastSeen = new Date();
    await user.save();

    const token = generateToken(user._id);

    return res.json({
      token,
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   POST /api/auth/guest
// @desc    Quick guest login without password
router.post('/guest', async (req, res) => {
  try {
    const { username, avatar } = req.body;
    const baseName = (username && username.trim()) || `Guest_${Math.floor(1000 + Math.random() * 9000)}`;
    let finalUsername = baseName;

    // Ensure unique username
    let counter = 1;
    while (await User.findOne({ username: finalUsername })) {
      finalUsername = `${baseName}_${counter++}`;
    }

    const user = await User.create({
      username: finalUsername,
      avatar: avatar || getDefaultAvatar(finalUsername),
      status: 'online',
      isGuest: true
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      token,
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error('Guest login error:', error);
    return res.status(500).json({ message: 'Server error during guest join' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
router.get('/me', protect, async (req, res) => {
  return res.json({ user: req.user.toSafeObject() });
});

// @route   PUT /api/auth/profile
// @desc    Update user profile (avatar, custom status)
router.put('/profile', protect, async (req, res) => {
  try {
    const { avatar, customStatus, status } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (avatar !== undefined) user.avatar = avatar;
    if (customStatus !== undefined) user.customStatus = customStatus;
    if (status !== undefined && ['online', 'away', 'busy', 'offline'].includes(status)) {
      user.status = status;
    }

    await user.save();
    return res.json({ user: user.toSafeObject() });
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({ message: 'Server error updating profile' });
  }
});

module.exports = router;
