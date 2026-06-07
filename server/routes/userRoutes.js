const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Fetch all registered users (excluding password)
router.get('/', async (req, res) => {
  try {
    const users = await User.find({}, 'firstName lastName username email');
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

module.exports = router;
