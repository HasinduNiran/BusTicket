const express = require('express');
const Section = require('../models/Section');
const { auth, adminAuth, busOwnerAuth } = require('../middleware/auth');
const router = express.Router();

// Get sections for a route
router.get('/route/:routeId', auth, async (req, res) => {
  try {
    const { routeId } = req.params;
    
    const sections = await Section.find({ 
      routeId, 
      isActive: true 
    })
    .populate('routeId', 'routeName routeNumber')
    .sort({ sectionNumber: 1 });

    res.json({ sections });
  } catch (error) {
    console.error('Get sections error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create section (Admin/Bus Owner)
router.post('/', auth, busOwnerAuth, async (req, res) => {
  try {
    const { sectionNumber, fare, routeId, description } = req.body;

    const section = new Section({
      sectionNumber,
      fare,
      routeId,
      description
    });

    await section.save();
    await section.populate('routeId', 'routeName routeNumber');

    res.status(201).json({
      message: 'Section created successfully',
      section
    });
  } catch (error) {
    console.error('Create section error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Section number already exists for this route' 
      });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Update section (Admin/Bus Owner)
router.put('/:id', auth, busOwnerAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const section = await Section.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('routeId', 'routeName routeNumber');

    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    res.json({
      message: 'Section updated successfully',
      section
    });
  } catch (error) {
    console.error('Update section error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete section (Admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const section = await Section.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    res.json({ message: 'Section deleted successfully' });
  } catch (error) {
    console.error('Delete section error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
