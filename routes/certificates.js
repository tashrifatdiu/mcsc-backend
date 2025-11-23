const express = require('express');
const router = express.Router();
const Certificate = require('../models/Certificate');

// Get all certificates
router.get('/', async (req, res) => {
  try {
    const certificates = await Certificate.find().sort({ createdAt: -1 }).lean();
    return res.json({ certificates });
  } catch (err) {
    console.error('Error fetching certificates', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get a certificate by search ID
router.get('/verify/:searchId', async (req, res) => {
  try {
    const { searchId } = req.params;
    const certificate = await Certificate.findOne({ searchId }).lean();

    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    return res.json({
      message: 'Verified certificate',
      certificate,
    });
  } catch (err) {
    console.error('Error verifying certificate', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Add a new certificate
router.post('/', async (req, res) => {
  try {
    const { searchId, name, servingEvent, code, class: className, hscBatch } = req.body;

    if (!searchId || !name || !servingEvent || !code || !className || !hscBatch) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existing = await Certificate.findOne({ searchId });
    if (existing) {
      return res.status(409).json({ error: 'Certificate with this search ID already exists' });
    }

    const certificate = new Certificate({ searchId, name, servingEvent, code, class: className, hscBatch });
    await certificate.save();

    return res.status(201).json({ message: 'Certificate added', certificate });
  } catch (err) {
    console.error('Error adding certificate', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Update a certificate
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const certificate = await Certificate.findByIdAndUpdate(id, updates, { new: true });
    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    return res.json({ message: 'Certificate updated', certificate });
  } catch (err) {
    console.error('Error updating certificate', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Delete a certificate
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const certificate = await Certificate.findByIdAndDelete(id);
    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    return res.json({ message: 'Certificate deleted' });
  } catch (err) {
    console.error('Error deleting certificate', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;