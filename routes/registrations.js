// routes/registrations.js (Full Fixed - Corrected `createTransport` Typo)
const express = require('express');
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const Registration = require('../models/Registration');
const router = express.Router();

const generateUniqueCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const generateUniqueId = () => 'REG-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();

// Nodemailer transporter (Gmail - use app password)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// POST /api/register - Create reg (Due) + send due email (no QR)
router.post('/', async (req, res) => {
  try {
    const submission = { ...req.body, uniqueCode: generateUniqueCode(), uniqueId: generateUniqueId(), status: 'Due' };
    const registration = new Registration(submission);
    const saved = await registration.save();

    // Send due email (no QR)
    const dueMailOptions = {
      from: process.env.EMAIL_USER,
      to: submission.email,
      subject: 'Registration Confirmation - Due Bill',
      html: `
        <h2>Dear ${submission.name},</h2>
        <p>Thank you for registering for the ${submission.eventTitle}!</p>
        <p>Your Selected Activities: ${submission.selectedActivities}</p>
        <p>Total Amount: ${submission.totalCost} TK</p>
        <p>Payment Instructions: Please pay ${submission.totalCost} TK in cash to the Science Club Coordinator at Milestone College. Upon payment, you will receive your official Payment Slip.</p>
        <p>Payment Status: ${submission.status}</p>
        <h3>Your Details:</h3>
        <ul>
          <li>Contact Number: ${submission.contactNumber}</li>
          <li>Parents Contact: ${submission.parentsContact}</li>
          <li>WhatsApp: ${submission.whatsapp || 'N/A'}</li>
          <li>Email: ${submission.email}</li>
          <li>Class: ${submission.class}</li>
          <li>Group: ${submission.group}</li>
          <li>Version: ${submission.version}</li>
          <li>Section: ${submission.section}</li>
          <li>ID No: ${submission.idNo}</li>
          <li>Form Teacher: ${submission.formTeacher || 'N/A'}</li>
          <li>Unique Code: <strong>${saved.uniqueCode}</strong> (Show at booth)</li>
        </ul>
        <p>If questions, contact Science Club at tashrifatwork@gmail.com or +8801315087951.</p>
        <p>Best regards,<br>Milestone College Science Club</p>
        <p><small>Automated. Do not reply.</small></p>
      `
    };
    await transporter.sendMail(dueMailOptions);
    console.log('Due email sent for:', submission.email);

    res.status(201).json({ message: 'Created (Due) + email sent.', data: saved });
  } catch (error) {
    console.error('POST error:', error);
    res.status(400).json({ message: 'Error', error: error.message });
  }
});

// PUT /api/register/:uniqueCode/verify - Verify + send paid QR email
router.put('/:uniqueCode/verify', async (req, res) => {
  try {
    const { uniqueCode } = req.params;
    const { status = 'Paid' } = req.body;

    const registration = await Registration.findOneAndUpdate(
      { uniqueCode },
      { status },
      { new: true }
    );

    if (!registration) {
      return res.status(404).json({ message: 'Invalid code' });
    }

    if (status === 'Paid') {
      // Generate QR base64 with unique code
      const qrData = registration.uniqueCode;
      const qrBase64 = await QRCode.toDataURL(qrData);

      // Send paid QR email
      const paidMailOptions = {
        from: process.env.EMAIL_USER,
        to: registration.email,
        subject: 'Payment Confirmed - Your QR Code',
        html: `
          <h2>Congratulations, ${registration.name}!</h2>
          <p>Payment verified for ${registration.eventTitle}!</p>
          <p>Your Selected Activities: ${registration.selectedActivities}</p>
          <p>Total Amount: ${registration.totalCost} TK</p>
          <p>Payment Status: ${registration.status}</p>
          <h3>Your Details:</h3>
          <ul>
            <li>Contact Number: ${registration.contactNumber}</li>
            <li>Parents Contact: ${registration.parentsContact}</li>
            <li>WhatsApp: ${registration.whatsapp || 'N/A'}</li>
            <li>Email: ${registration.email}</li>
            <li>Class: ${registration.class}</li>
            <li>Group: ${registration.group}</li>
            <li>Version: ${registration.version}</li>
            <li>Section: ${registration.section}</li>
            <li>ID No: ${registration.idNo}</li>
            <li>Form Teacher: ${registration.formTeacher || 'N/A'}</li>
            <li>Unique Code: <strong>${registration.uniqueCode}</strong></li>
          </ul>
          <h3>Your Entry QR Code (Data: ${registration.uniqueCode}):</h3>
          <p>Scan this at the event booth or print the email.</p>
          <img src="${qrBase64}" alt="QR Code for Entry" style="border: 1px solid #000; margin: 10px 0; width: 200px; height: 200px;">
          <p>If questions, contact Science Club at tashrifatwork@gmail.com or +8801315087951.</p>
          <p>Best regards,<br>Milestone College Science Club</p>
          <p><small>Automated. Do not reply.</small></p>
        `
      };
      await transporter.sendMail(paidMailOptions);
      console.log('Paid QR email sent for:', registration.email);
    }

    res.json({ message: `${status}. Unique ID: ${registration.uniqueId}`, data: registration });
  } catch (error) {
    console.error('PUT error:', error);
    res.status(500).json({ message: 'Error', error: error.message });
  }
});

// GET /api/register - All for admin
router.get('/', async (req, res) => {
  try {
    const registrations = await Registration.find().sort({ createdAt: -1 });
    res.json({ message: 'All registrations', data: registrations });
  } catch (error) {
    res.status(500).json({ message: 'Error', error: error.message });
  }
});

module.exports = router;