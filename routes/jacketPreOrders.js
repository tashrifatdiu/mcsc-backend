const express = require('express');
const router = express.Router();
const JacketPreOrder = require('../models/JacketPreOrder');

// Create new pre-order
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      userName,
      userEmail,
      userPhone,
      jacketType,
      size,
      amount,
      transactionId,
      bkashNumber,
      studentProfile,
      deliveryAddress,
      notes
    } = req.body;

    // Validate required fields
    if (!userId || !userName || !userEmail || !transactionId || !bkashNumber) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if transaction ID already exists
    const existingOrder = await JacketPreOrder.findOne({ transactionId });
    if (existingOrder) {
      return res.status(400).json({ error: 'This transaction ID has already been used' });
    }

    const preOrder = new JacketPreOrder({
      userId,
      userName,
      userEmail,
      userPhone,
      jacketType,
      size,
      amount: amount || 950,
      transactionId,
      bkashNumber,
      studentProfile,
      deliveryAddress,
      notes,
      status: 'pending'
    });

    await preOrder.save();

    res.status(201).json({
      message: 'Pre-order submitted successfully! We will confirm your payment soon.',
      preOrder
    });
  } catch (error) {
    console.error('Pre-order error:', error);
    res.status(500).json({ error: 'Failed to submit pre-order' });
  }
});

// Get all pre-orders (admin)
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    
    const preOrders = await JacketPreOrder.find(filter).sort({ createdAt: -1 });
    res.json({ preOrders });
  } catch (error) {
    console.error('Error fetching pre-orders:', error);
    res.status(500).json({ error: 'Failed to fetch pre-orders' });
  }
});

// Get user's pre-orders
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const preOrders = await JacketPreOrder.find({ userId }).sort({ createdAt: -1 });
    res.json({ preOrders });
  } catch (error) {
    console.error('Error fetching user pre-orders:', error);
    res.status(500).json({ error: 'Failed to fetch pre-orders' });
  }
});

// Update pre-order status (admin)
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    const updateData = { status };
    
    if (status === 'confirmed') {
      updateData.confirmedAt = new Date();
    } else if (status === 'rejected') {
      updateData.rejectedAt = new Date();
      updateData.rejectionReason = rejectionReason;
    }

    const preOrder = await JacketPreOrder.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!preOrder) {
      return res.status(404).json({ error: 'Pre-order not found' });
    }

    res.json({ message: 'Status updated successfully', preOrder });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;
