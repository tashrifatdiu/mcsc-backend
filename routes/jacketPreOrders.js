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
      quantity,
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

    const pricePerUnit = 999;
    const itemQuantity = quantity || 1;
    
    const preOrder = new JacketPreOrder({
      userId,
      userName,
      userEmail,
      userPhone,
      items: [{
        jacketType,
        size,
        quantity: itemQuantity,
        pricePerUnit
      }],
      totalAmount: pricePerUnit * itemQuantity,
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

// Get all pre-orders grouped by user (admin)
router.get('/', async (req, res) => {
  try {
    const { status, grouped } = req.query;
    const filter = status ? { status } : {};
    
    const preOrders = await JacketPreOrder.find(filter).sort({ createdAt: -1 });
    
    if (grouped === 'true') {
      // Group orders by userId
      const groupedOrders = {};
      
      preOrders.forEach(order => {
        if (!groupedOrders[order.userId]) {
          groupedOrders[order.userId] = {
            userId: order.userId,
            userName: order.userName,
            userEmail: order.userEmail,
            userPhone: order.userPhone,
            studentProfile: order.studentProfile,
            orders: [],
            totalOrders: 0,
            totalAmount: 0,
            statusCounts: {
              pending: 0,
              confirmed: 0,
              rejected: 0,
              delivered: 0
            }
          };
        }
        
        groupedOrders[order.userId].orders.push(order);
        groupedOrders[order.userId].totalOrders++;
        groupedOrders[order.userId].totalAmount += order.totalAmount;
        groupedOrders[order.userId].statusCounts[order.status]++;
      });
      
      res.json({ groupedOrders: Object.values(groupedOrders) });
    } else {
      res.json({ preOrders });
    }
  } catch (error) {
    console.error('Error fetching pre-orders:', error);
    res.status(500).json({ error: 'Failed to fetch pre-orders' });
  }
});

// Get user's pre-orders with summary
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const preOrders = await JacketPreOrder.find({ userId }).sort({ createdAt: -1 });
    
    // Calculate summary
    const summary = {
      totalOrders: preOrders.length,
      totalAmount: 0,
      totalItems: 0,
      statusCounts: {
        pending: 0,
        confirmed: 0,
        rejected: 0,
        delivered: 0
      },
      itemsBySize: {}
    };
    
    preOrders.forEach(order => {
      summary.totalAmount += order.totalAmount;
      summary.statusCounts[order.status]++;
      
      order.items.forEach(item => {
        summary.totalItems += item.quantity;
        
        const key = `${item.jacketType}-${item.size}`;
        if (!summary.itemsBySize[key]) {
          summary.itemsBySize[key] = {
            jacketType: item.jacketType,
            size: item.size,
            quantity: 0
          };
        }
        summary.itemsBySize[key].quantity += item.quantity;
      });
    });
    
    res.json({ preOrders, summary });
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
    } else if (status === 'delivered') {
      updateData.deliveredAt = new Date();
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

// Bulk update status (admin)
router.patch('/bulk/status', async (req, res) => {
  try {
    const { orderIds, status, rejectionReason } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ error: 'Invalid order IDs' });
    }

    const updateData = { status };
    
    if (status === 'confirmed') {
      updateData.confirmedAt = new Date();
    } else if (status === 'rejected') {
      updateData.rejectedAt = new Date();
      if (rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }
    } else if (status === 'delivered') {
      updateData.deliveredAt = new Date();
    }

    const result = await JacketPreOrder.updateMany(
      { _id: { $in: orderIds } },
      updateData
    );

    res.json({ 
      message: `${result.modifiedCount} orders updated successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error bulk updating status:', error);
    res.status(500).json({ error: 'Failed to update orders' });
  }
});

module.exports = router;
