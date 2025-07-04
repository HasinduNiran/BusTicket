const express = require('express');
const Section = require('../models/Section');
const { auth, adminAuth, busOwnerAuth } = require('../middleware/auth');
const router = express.Router();

// Get all sections by category
router.get('/category/:category', auth, async (req, res) => {
  try {
    const { category } = req.params;
    
    const sections = await Section.find({ 
      category, 
      isActive: true 
    })
    .sort({ sectionNumber: 1 });

    res.json({ sections });
  } catch (error) {
    console.error('Get sections by category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all sections
router.get('/', auth, async (req, res) => {
  try {
    const sections = await Section.find({ 
      isActive: true 
    })
    .sort({ category: 1, sectionNumber: 1 });

    res.json({ sections });
  } catch (error) {
    console.error('Get all sections error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get sections for a route (keeping for backward compatibility)
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
    const { sectionNumber, fare, category, description } = req.body;

    // Validation
    if (!sectionNumber || !fare || !category) {
      return res.status(400).json({ 
        message: 'Missing required fields: sectionNumber, fare, and category are required',
        received: { sectionNumber, fare, category, description }
      });
    }

    // Check if section already exists for this category
    const existingSection = await Section.findOne({ 
      sectionNumber, 
      category, 
      isActive: true 
    });

    if (existingSection) {
      return res.status(400).json({ 
        message: `Section ${sectionNumber} already exists for ${category} category` 
      });
    }

    const section = new Section({
      sectionNumber: Number(sectionNumber),
      fare: Number(fare),
      category,
      description: description || `Section ${sectionNumber} - Rs. ${fare} (${category})`
    });

    await section.save();

    res.status(201).json({
      message: 'Section created successfully',
      section
    });
  } catch (error) {
    console.error('Create section error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors 
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Section number already exists for this category' 
      });
    }
    
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
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
    );

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
