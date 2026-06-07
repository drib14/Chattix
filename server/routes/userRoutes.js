const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Fetch all registered users (excluding password)
router.get('/', async (req, res) => {
  try {
    const users = await User.find({}, 'firstName lastName username email lastActive profilePic');
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// Update user profile
router.put('/:id', async (req, res) => {
  try {
    const { firstName, lastName, profilePic } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, profilePic },
      { new: true, select: '-password' }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Error updating profile', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

module.exports = router;
