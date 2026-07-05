const express = require('express');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc Get all users (admin)
router.get('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

// @desc Update user role/status (admin)
router.put('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { role, isActive } = req.body;
    if (role) user.role = role;
    if (typeof isActive === 'boolean') user.isActive = isActive;

    const updated = await user.save();
    res.json(updated.toSafeObject());
  } catch (err) {
    next(err);
  }
});

module.exports = router;
