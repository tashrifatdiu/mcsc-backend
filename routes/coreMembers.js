const express = require('express');
const router = express.Router();
const CoreMember = require('../models/CoreMember');

// Get all core members
router.get('/', async (req, res) => {
  try {
    const members = await CoreMember.find({ isActive: true }).sort({ order: 1 });
    res.json({ members });
  } catch (error) {
    console.error('Error fetching core members:', error);
    res.status(500).json({ error: 'Failed to fetch core members' });
  }
});

// Get single core member by ID
router.get('/:id', async (req, res) => {
  try {
    const member = await CoreMember.findById(req.params.id);
    
    if (!member) {
      return res.status(404).json({ error: 'Core member not found' });
    }
    
    res.json({ member });
  } catch (error) {
    console.error('Error fetching core member:', error);
    res.status(500).json({ error: 'Failed to fetch core member' });
  }
});

// Create new core member (admin only)
router.post('/', async (req, res) => {
  try {
    const { name, role, designation, image, order } = req.body;

    const member = new CoreMember({
      name,
      role,
      designation,
      image: image || '',
      order: order || 0
    });

    await member.save();
    res.status(201).json({ member, message: 'Core member created successfully' });
  } catch (error) {
    console.error('Error creating core member:', error);
    res.status(500).json({ error: 'Failed to create core member' });
  }
});

// Update core member (admin only)
router.put('/:id', async (req, res) => {
  try {
    const member = await CoreMember.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!member) {
      return res.status(404).json({ error: 'Core member not found' });
    }

    res.json({ member, message: 'Core member updated successfully' });
  } catch (error) {
    console.error('Error updating core member:', error);
    res.status(500).json({ error: 'Failed to update core member' });
  }
});

// Delete core member (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const member = await CoreMember.findByIdAndDelete(req.params.id);

    if (!member) {
      return res.status(404).json({ error: 'Core member not found' });
    }

    res.json({ message: 'Core member deleted successfully' });
  } catch (error) {
    console.error('Error deleting core member:', error);
    res.status(500).json({ error: 'Failed to delete core member' });
  }
});

module.exports = router;
