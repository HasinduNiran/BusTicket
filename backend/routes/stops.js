const express = require('express');
const Stop = require('../models/Stop');
const BusRoute = require('../models/BusRoute');
const { auth, adminAuth, busOwnerAuth } = require('../middleware/auth');
const router = express.Router();

// Get all stops for a route
router.get('/route/:routeId', auth, async (req, res) => {
  try {
    const { routeId } = req.params;
    
    const stops = await Stop.find({ 
      routeId, 
      isActive: true 
    })
    .populate('routeId', 'routeName routeNumber')
    .sort({ order: 1 });

    res.json({ stops });
  } catch (error) {
    console.error('Get stops error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get stop by section number
router.get('/route/:routeId/section/:sectionNumber', auth, async (req, res) => {
  try {
    const { routeId, sectionNumber } = req.params;
    
    const stop = await Stop.findOne({ 
      routeId, 
      sectionNumber: parseInt(sectionNumber),
      isActive: true 
    }).populate('routeId', 'routeName routeNumber');

    if (!stop) {
      return res.status(404).json({ message: 'Stop not found' });
    }

    res.json({ stop });
  } catch (error) {
    console.error('Get stop error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new stop (Admin/Bus Owner)
router.post('/', auth, busOwnerAuth, async (req, res) => {
  try {
    const { 
      code, 
      stopName, 
      sectionNumber, 
      fare, 
      routeId, 
      coordinates, 
      order 
    } = req.body;

    // Check if route exists
    const route = await BusRoute.findById(routeId);
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    // Check if stop code already exists
    const existingStop = await Stop.findOne({ code });
    if (existingStop) {
      return res.status(400).json({ message: 'Stop code already exists' });
    }

    const stop = new Stop({
      code,
      stopName,
      sectionNumber,
      fare,
      routeId,
      coordinates,
      order
    });

    await stop.save();
    await stop.populate('routeId', 'routeName routeNumber');

    res.status(201).json({ 
      message: 'Stop created successfully', 
      stop 
    });
  } catch (error) {
    console.error('Create stop error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update stop (Admin/Bus Owner)
router.put('/:id', auth, busOwnerAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const stop = await Stop.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    ).populate('routeId', 'routeName routeNumber');

    if (!stop) {
      return res.status(404).json({ message: 'Stop not found' });
    }

    res.json({ 
      message: 'Stop updated successfully', 
      stop 
    });
  } catch (error) {
    console.error('Update stop error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete stop (Admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const stop = await Stop.findByIdAndUpdate(
      id, 
      { isActive: false }, 
      { new: true }
    );

    if (!stop) {
      return res.status(404).json({ message: 'Stop not found' });
    }

    res.json({ message: 'Stop deleted successfully' });
  } catch (error) {
    console.error('Delete stop error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Calculate fare between two stops
router.post('/calculate-fare', auth, async (req, res) => {
  try {
    const { routeId, fromSection, toSection } = req.body;

    if (fromSection >= toSection) {
      return res.status(400).json({ 
        message: 'Invalid section numbers. From section must be less than to section.' 
      });
    }

    const fromStop = await Stop.findOne({ 
      routeId, 
      sectionNumber: fromSection,
      isActive: true 
    });

    const toStop = await Stop.findOne({ 
      routeId, 
      sectionNumber: toSection,
      isActive: true 
    });

    if (!fromStop || !toStop) {
      return res.status(404).json({ message: 'Stop(s) not found' });
    }

    // Calculate fare (difference between sections)
    const fare = toStop.fare - fromStop.fare;

    res.json({
      fromStop,
      toStop,
      fare,
      sections: toSection - fromSection
    });
  } catch (error) {
    console.error('Calculate fare error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
