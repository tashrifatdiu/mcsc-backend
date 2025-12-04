const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

// Get all events (with optional status filter)
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    
    const events = await Event.find(filter).sort({ date: -1 });
    res.json({ events });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get past events
router.get('/past', async (req, res) => {
  try {
    // Sort by createdAt descending (latest first)
    const events = await Event.find({ status: 'past' }).sort({ createdAt: -1 });
    res.json({ events });
  } catch (error) {
    console.error('Error fetching past events:', error);
    res.status(500).json({ error: 'Failed to fetch past events' });
  }
});

// Get upcoming events
router.get('/upcoming', async (req, res) => {
  try {
    const events = await Event.find({ status: 'upcoming' }).sort({ date: 1 });
    res.json({ events });
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming events' });
  }
});

// Get single event by slug
router.get('/:slug', async (req, res) => {
  try {
    const event = await Event.findOne({ slug: req.params.slug });
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json({ event });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Create new event (admin only - add auth middleware as needed)
router.post('/', async (req, res) => {
  try {
    const {
      title,
      slug,
      date,
      location,
      shortDescription,
      description,
      coverImage,
      images,
      color,
      glow,
      status
    } = req.body;

    const event = new Event({
      title,
      slug,
      date,
      location,
      shortDescription,
      description,
      coverImage,
      images: images || [],
      color: color || 'from-indigo-400 to-purple-600',
      glow: glow || 'shadow-indigo-500/50',
      status: status || 'upcoming'
    });

    await event.save();
    res.status(201).json({ event, message: 'Event created successfully' });
  } catch (error) {
    console.error('Error creating event:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Event with this slug already exists' });
    }
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update event (admin only - add auth middleware as needed)
router.put('/:slug', async (req, res) => {
  try {
    const event = await Event.findOneAndUpdate(
      { slug: req.params.slug },
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ event, message: 'Event updated successfully' });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete event (admin only - add auth middleware as needed)
router.delete('/:slug', async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({ slug: req.params.slug });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

module.exports = router;
