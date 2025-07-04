const express = require('express');
const Bus = require('../models/Bus');
const BusRoute = require('../models/BusRoute');
const User = require('../models/User');
const { auth, adminAuth, busOwnerAuth } = require('../middleware/auth');
const router = express.Router();

// Get all buses
router.get('/', auth, async (req, res) => {
  try {
    const { routeId, category, isActive } = req.query;
    
    let filter = {};
    if (routeId) filter.routeId = routeId;
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const buses = await Bus.find(filter)
      .populate('routeId', 'routeName routeNumber startPoint endPoint')
      .populate('conductorId', 'username email profile.fullName')
      .sort({ busNumber: 1 });

    res.json({ buses });
  } catch (error) {
    console.error('Get buses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get bus by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id)
      .populate('routeId', 'routeName routeNumber startPoint endPoint')
      .populate('conductorId', 'username email profile.fullName');

    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    res.json({ bus });
  } catch (error) {
    console.error('Get bus error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new bus (Admin only)
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const {
      busNumber,
      routeId,
      category,
      capacity,
      driverName,
      conductorId,
      notes
    } = req.body;

    // Check if route exists
    const route = await BusRoute.findById(routeId);
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    // Check if bus number already exists
    const existingBus = await Bus.findOne({ busNumber });
    if (existingBus) {
      return res.status(400).json({ message: 'Bus number already exists' });
    }

    // Check if conductor exists and is available
    if (conductorId) {
      const conductor = await User.findById(conductorId);
      if (!conductor || conductor.role !== 'conductor') {
        return res.status(400).json({ message: 'Invalid conductor selected' });
      }

      // Check if conductor is already assigned to another bus
      const existingAssignment = await Bus.findOne({ 
        conductorId, 
        isActive: true 
      });
      if (existingAssignment) {
        return res.status(400).json({ 
          message: 'Conductor is already assigned to another bus' 
        });
      }
    }

    const bus = new Bus({
      busNumber,
      routeId,
      category,
      capacity: capacity || 50,
      driverName,
      conductorId: conductorId || null,
      notes
    });

    await bus.save();
    await bus.populate('routeId', 'routeName routeNumber startPoint endPoint');
    if (bus.conductorId) {
      await bus.populate('conductorId', 'username email profile.fullName');
    }

    res.status(201).json({
      message: 'Bus created successfully',
      bus
    });
  } catch (error) {
    console.error('Create bus error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update bus (Admin only)
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if route exists if routeId is being updated
    if (updateData.routeId) {
      const route = await BusRoute.findById(updateData.routeId);
      if (!route) {
        return res.status(404).json({ message: 'Route not found' });
      }
    }

    // Check if bus number is unique if being updated
    if (updateData.busNumber) {
      const existingBus = await Bus.findOne({ 
        busNumber: updateData.busNumber,
        _id: { $ne: id }
      });
      if (existingBus) {
        return res.status(400).json({ message: 'Bus number already exists' });
      }
    }

    // Check conductor availability if being updated
    if (updateData.conductorId) {
      const conductor = await User.findById(updateData.conductorId);
      if (!conductor || conductor.role !== 'conductor') {
        return res.status(400).json({ message: 'Invalid conductor selected' });
      }

      const existingAssignment = await Bus.findOne({ 
        conductorId: updateData.conductorId, 
        isActive: true,
        _id: { $ne: id }
      });
      if (existingAssignment) {
        return res.status(400).json({ 
          message: 'Conductor is already assigned to another bus' 
        });
      }
    }

    const bus = await Bus.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('routeId', 'routeName routeNumber startPoint endPoint')
    .populate('conductorId', 'username email profile.fullName');

    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    res.json({
      message: 'Bus updated successfully',
      bus
    });
  } catch (error) {
    console.error('Update bus error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete bus (Admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const bus = await Bus.findByIdAndDelete(req.params.id);
    
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    res.json({ message: 'Bus deleted successfully' });
  } catch (error) {
    console.error('Delete bus error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get available conductors for assignment
router.get('/conductors/available', auth, adminAuth, async (req, res) => {
  try {
    // Get all active buses with assigned conductors
    const assignedConductors = await Bus.find({ 
      isActive: true, 
      conductorId: { $ne: null } 
    }).distinct('conductorId');

    // Find conductors not assigned to any active bus
    const availableConductors = await User.find({
      role: 'conductor',
      isActive: true,
      _id: { $nin: assignedConductors }
    }).select('username email profile.fullName profile.phone');

    res.json({ conductors: availableConductors });
  } catch (error) {
    console.error('Get available conductors error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get buses for a specific route and category
router.get('/route/:routeId/category/:category', auth, async (req, res) => {
  try {
    const { routeId, category } = req.params;
    
    const buses = await Bus.find({ 
      routeId, 
      category,
      isActive: true 
    })
    .populate('routeId', 'routeName routeNumber')
    .populate('conductorId', 'username profile.fullName')
    .sort({ busNumber: 1 });

    res.json({ buses });
  } catch (error) {
    console.error('Get buses by route and category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
