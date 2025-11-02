// routes/olympiad.js (Full Fixed - Corrected `createTransport` Typo)
const express = require('express');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const OlympiadUser = require('../models/OlympiadUser');
const OlympiadReg = require('../models/OlympiadRegistration');
const router = express.Router();

// Nodemailer transporter (Gmail - use app password)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const generateOTP = () => crypto.randomBytes(3).toString('hex').toUpperCase().substring(0, 6);

// POST /api/olympiad/login - Send OTP to email
router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email required' });
    }
    let user = await OlympiadUser.findOne({ email });
    if (!user) {
      user = new OlympiadUser({ email });
    }
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5min expiry
    await user.save();

    // Send OTP email
    const otpMailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your Olympiad OTP - MCSC',
      html: `
        <h2>Dear User,</h2>
        <p>Your OTP for Olympiad login: <strong>${otp}</strong></p>
        <p>Valid for 5 minutes. If not you, ignore.</p>
        <p>Best,<br>Milestone Science Club</p>
      `
    };
    await transporter.sendMail(otpMailOptions);
    console.log('OTP sent to:', email);

    res.json({ message: 'OTP sent to email' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ message: 'Login error', error: error.message });
  }
});

// POST /api/olympiad/verify-otp - Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP required' });
    }
    const user = await OlympiadUser.findOne({ email });
    if (!user || user.otp !== otp || user.otpExpiry < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();
    res.json({ message: 'OTP verified - proceed to reg' });
  } catch (error) {
    console.error('OTP verify error:', error);
    res.status(400).json({ message: 'OTP verify error', error: error.message });
  }
});

// POST /api/olympiad/register - Enhanced reg
router.post('/register', async (req, res) => {
  try {
    const { email, name, contactNumber, school, class: className, group, version, section, district, division, upazila } = req.body;
    if (!email || !name || !contactNumber || !school || !className || !group || !version || !section || !district || !division || !upazila) {
      return res.status(400).json({ message: 'All fields required' });
    }
    let user = await OlympiadUser.findOne({ email });
    if (!user || user.otp) {
      return res.status(400).json({ message: 'Verify OTP first' });
    }
    user.profile = {
      name,
      contactNumber,
      school,
      class: className,
      group,
      version,
      section,
      district,
      division,
      upazila
    };
    user.isRegistered = true;
    await user.save();

    // Send confirmation email
    const confirmMailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Olympiad Registration Confirmed - MCSC',
      html: `
        <h2>Dear ${name},</h2>
        <p>Thank you for registering for the Online Olympiad with Prothom Alo Kishor Alo & MCSC!</p>
        <p>Event Date: November 17, 2025</p>
        <p>Your School: ${school}</p>
        <p>Class: ${className}</p>
        <p>Login with ${email} on Nov 17 to start the quiz (5 MCQs, 15s each).</p>
        <p>Nationwide, free! Contact: tashrifatwork@gmail.com or +8801315087951</p>
        <p>Best regards,<br>Milestone College Science Club</p>
        <p><small>Automated. Do not reply.</small></p>
      `
    };
    await transporter.sendMail(confirmMailOptions);
    console.log('Confirmation email sent to:', email);

    res.status(201).json({ message: 'Registered! Quiz ready.', data: user });
  } catch (error) {
    console.error('Reg error:', error);
    res.status(400).json({ message: 'Reg error', error: error.message });
  }
});

// PUT /api/olympiad/profile - Edit profile
router.put('/profile', async (req, res) => {
  try {
    const { email, ...profileUpdates } = req.body;
    const user = await OlympiadUser.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.profile = { ...user.profile, ...profileUpdates };
    await user.save();
    res.json({ message: 'Profile updated', data: user });
  } catch (error) {
    console.error('Edit error:', error);
    res.status(400).json({ message: 'Edit error', error: error.message });
  }
});

// GET /api/olympiad/profile - Get profile
router.get('/profile', async (req, res) => {
  try {
    const { email } = req.query;
    const user = await OlympiadUser.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json({ message: 'Profile fetched', data: user });
  } catch (error) {
    res.status(500).json({ message: 'Error', error: error.message });
  }
});

// POST /api/olympiad/submit - Submit quiz (update profile)
router.post('/submit', async (req, res) => {
  try {
    const { email, answers } = req.body;
    if (!email || !answers) {
      return res.status(400).json({ message: 'Email and answers required' });
    }
    const user = await OlympiadUser.findOne({ email });
    if (!user || !user.isRegistered) {
      return res.status(400).json({ message: 'Register first' });
    }
    user.profile.quizAnswers = answers;
    // Calculate score (example - match correct answers)
    user.profile.quizScore = Object.keys(answers).reduce((score, qId) => {
      const correct = questions.find(q => q.id == qId)?.correct;
      return score + (answers[qId] === correct ? 1 : 0);
    }, 0);
    await user.save();
    res.json({ message: 'Quiz submitted & score saved to profile!' });
  } catch (error) {
    console.error('Submit error:', error);
    res.status(500).json({ message: 'Submit error', error: error.message });
  }
});

// GET /api/olympiad - All for admin
router.get('/', async (req, res) => {
  try {
    const users = await OlympiadUser.find().sort({ createdAt: -1 });
    res.json({ message: 'All Olympiad users', data: users });
  } catch (error) {
    res.status(500).json({ message: 'Error', error: error.message });
  }
});

module.exports = router;