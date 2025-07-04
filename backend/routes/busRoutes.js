const express = require('express');
const BusRoute = require('../models/BusRoute');
const { auth, adminAuth, busOwnerAuth } = require('../middleware/auth');
const router = express.Router();

// Get all routes
router.get('/', auth, async (req, res) => {
  try {
    const routes = await BusRoute.find({ isActive: true })
      .populate('createdBy', 'username email')
      .sort({ routeNumber: 1 });

    res.json({ routes });
  } catch (error) {
    console.error('Get routes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get route by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const route = await BusRoute.findById(req.params.id)
      .populate('createdBy', 'username email');

    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    res.json({ route });
  } catch (error) {
    console.error('Get route error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new route (Admin/Bus Owner)
router.post('/', auth, busOwnerAuth, async (req, res) => {
  try {
    const {
      routeName,
      routeNumber,
      startPoint,
      endPoint,
      distance,
      estimatedDuration
    } = req.body;

    // Check if route number exists
    const existingRoute = await BusRoute.findOne({ routeNumber });
    if (existingRoute) {
      return res.status(400).json({ message: 'Route number already exists' });
    }

    const route = new BusRoute({
      routeName,
      routeNumber,
      startPoint: startPoint || 'Embilipitiya',
      endPoint,
      distance,
      estimatedDuration,
      createdBy: req.user._id
    });

    await route.save();
    await route.populate('createdBy', 'username email');

    res.status(201).json({
      message: 'Route created successfully',
      route
    });
  } catch (error) {
    console.error('Create route error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update route (Admin/Bus Owner)
router.put('/:id', auth, busOwnerAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const route = await BusRoute.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'username email');

    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    res.json({
      message: 'Route updated successfully',
      route
    });
  } catch (error) {
    console.error('Update route error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete route (Admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const route = await BusRoute.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    res.json({ message: 'Route deleted successfully' });
  } catch (error) {
    console.error('Delete route error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
