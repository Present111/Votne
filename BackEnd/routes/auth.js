const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const User = require('../models/User');
const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  const { username, password, email, phoneNumber, address, gender, dateOfBirth, role } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const newUser = new User({
      id: new mongoose.Types.ObjectId().toString(),
      username,
      password,
      email,
      phoneNumber,
      address,
      gender,
      dateOfBirth,
      role,
    });

    await newUser.save();
    return res.status(201).json({ message: 'Register success' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Frontend sends email in the `username` field; accept either email or username
    const identifier = email || username;
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Email/username and password are required' });
    }

    const user = await User.findOne({
      isActive: true,
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid email/username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email/username or password' });
    }

    const token = jwt.sign(
      { 
        userId: user._id,
        username: user.username,
        role: user.role,
        avatarUrl: user.avatarUrl || null  // ⬅ THÊM AVATAR VÀO TOKEN
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.status(200).json({ 
      token,
      avatarUrl: user.avatarUrl || null  // ⬅ TRẢ AVATAR RA NGOÀI
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
