const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Create if missing (see below)
const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { name, phone, bio, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, profile: { name, phone, bio } });
    await user.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ message: 'User created', user: { id: user._id, email, profile: user.profile }, token });
  } catch (error) {
    res.status(400).json({ message: 'Signup failed', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Logged in', user: { id: user._id, email, profile: user.profile }, token });
  } catch (error) {
    res.status(400).json({ message: 'Login failed', error: error.message });
  }
});

module.exports = router;