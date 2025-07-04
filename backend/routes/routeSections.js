import express from 'express';
import RouteSection from '../models/RouteSection.js';
import BusRoute from '../models/BusRoute.js';
import Stop from '../models/Stop.js';
import Section from '../models/Section.js';
import { auth, adminAuth, busOwnerAuth } from '../middleware/auth.js';
const router = express.Router();

// Get route sections for a specific route and category
router.get('/route/:routeId/category/:category', auth, async (req, res) => {
  try {
    const { routeId, category } = req.params;
    
    const routeSections = await RouteSection.find({ 
      routeId, 
      category,
      isActive: true 
    })
    .populate('routeId', 'routeName routeNumber')
    .populate('stopId', 'stopName code')
    .sort({ order: 1 });

    res.json({ routeSections });
  } catch (error) {
    console.error('Get route sections error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all route sections for a specific route (all categories)
router.get('/route/:routeId', auth, async (req, res) => {
  try {
    const { routeId } = req.params;
    
    const routeSections = await RouteSection.find({ 
      routeId,
      isActive: true 
    })
    .populate('routeId', 'routeName routeNumber')
    .populate('stopId', 'stopName code')
    .sort({ category: 1, order: 1 });

    // Group by category
    const groupedSections = {};
    routeSections.forEach(section => {
      if (!groupedSections[section.category]) {
        groupedSections[section.category] = [];
      }
      groupedSections[section.category].push(section);
    });

    res.json({ 
      routeSections,
      groupedSections 
    });
  } catch (error) {
    console.error('Get route sections error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create route section (Admin only)
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const { 
      routeId, 
      stopId, 
      sectionNumber, 
      fare, 
      stopCode, 
      stopName, 
      order, 
      category 
    } = req.body;

    // Validation
    if (!routeId || !stopId || sectionNumber === undefined || !fare || !stopCode || !stopName || order === undefined || !category) {
      return res.status(400).json({ 
        message: 'Missing required fields: routeId, stopId, sectionNumber, fare, stopCode, stopName, order, and category are required',
        received: { routeId, stopId, sectionNumber, fare, stopCode, stopName, order, category }
      });
    }

    // Check if route section already exists for this route, stop, and category
    const existingRouteSection = await RouteSection.findOne({ 
      routeId, 
      stopId, 
      category,
      isActive: true 
    });

    if (existingRouteSection) {
      return res.status(400).json({ 
        message: `Route section already exists for this stop and category` 
      });
    }

    const routeSection = new RouteSection({
      routeId,
      stopId,
      sectionNumber: Number(sectionNumber),
      fare: Number(fare),
      stopCode,
      stopName,
      order: Number(order),
      category
    });

    await routeSection.save();
    await routeSection.populate('routeId', 'routeName routeNumber');
    await routeSection.populate('stopId', 'stopName code');

    res.status(201).json({
      message: 'Route section created successfully',
      routeSection
    });
  } catch (error) {
    console.error('Create route section error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors 
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Route section already exists for this stop and category' 
      });
    }
    
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Bulk create route sections for a route and category (Admin only)
router.post('/bulk', auth, adminAuth, async (req, res) => {
  try {
    const { routeId, category, sections } = req.body;

    if (!routeId || !category || !sections || !Array.isArray(sections)) {
      return res.status(400).json({ 
        message: 'Missing required fields: routeId, category, and sections array are required'
      });
    }

    const createdSections = [];
    const errors = [];

    for (const sectionData of sections) {
      try {
        const routeSection = new RouteSection({
          routeId,
          category,
          ...sectionData
        });

        await routeSection.save();
        await routeSection.populate('routeId', 'routeName routeNumber');
        await routeSection.populate('stopId', 'stopName code');
        
        createdSections.push(routeSection);
      } catch (error) {
        errors.push({
          section: sectionData,
          error: error.message
        });
      }
    }

    res.status(201).json({
      message: `Bulk creation completed. ${createdSections.length} sections created${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
      createdSections,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Bulk create route sections error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update route section (Admin only)
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const routeSection = await RouteSection.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('routeId', 'routeName routeNumber')
    .populate('stopId', 'stopName code');

    if (!routeSection) {
      return res.status(404).json({ message: 'Route section not found' });
    }

    res.json({
      message: 'Route section updated successfully',
      routeSection
    });
  } catch (error) {
    console.error('Update route section error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete route section (Admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const routeSection = await RouteSection.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!routeSection) {
      return res.status(404).json({ message: 'Route section not found' });
    }

    res.json({ message: 'Route section deleted successfully' });
  } catch (error) {
    console.error('Delete route section error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get available routes for route section management (Admin only)
router.get('/routes/available', auth, adminAuth, async (req, res) => {
  try {
    const routes = await BusRoute.find({ isActive: true })
      .select('routeName routeNumber startPoint endPoint')
      .sort({ routeName: 1 });

    res.json({ routes });
  } catch (error) {
    console.error('Get available routes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get stops for a specific route (Admin only)
router.get('/route/:routeId/stops', auth, adminAuth, async (req, res) => {
  try {
    const { routeId } = req.params;

    const stops = await Stop.find({ 
      routeId,
      isActive: true 
    })
    .select('stopName code order sectionNumber fare')
    .sort({ order: 1 });

    res.json({ stops });
  } catch (error) {
    console.error('Get route stops error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Auto-generate route sections from existing stops (Admin only)
router.post('/auto-generate/:routeId/:category', auth, adminAuth, async (req, res) => {
  try {
    const { routeId, category } = req.params;
    const { fareMultiplier = 1.0 } = req.body;

    // Get existing stops for the route
    const stops = await Stop.find({ 
      routeId,
      isActive: true 
    }).sort({ sectionNumber: 1 });

    if (stops.length === 0) {
      return res.status(400).json({ 
        message: 'No stops found for this route' 
      });
    }

    // Get section fares for the category
    const sections = await Section.find({ 
      category,
      isActive: true 
    }).sort({ sectionNumber: 1 });

    const createdSections = [];
    const errors = [];

    for (let i = 0; i < stops.length; i++) {
      const stop = stops[i];
      try {
        // Check if route section already exists
        const existingSection = await RouteSection.findOne({
          routeId,
          stopId: stop._id,
          category,
          isActive: true
        });

        if (existingSection) {
          continue; // Skip if already exists
        }

        // Find matching section by section number
        const section = sections.find(s => s.sectionNumber === stop.sectionNumber);
        const baseFare = section ? section.fare : (stop.sectionNumber * 10); // Default fare if section not found

        const routeSection = new RouteSection({
          routeId,
          stopId: stop._id,
          sectionNumber: stop.sectionNumber,
          fare: Math.round(baseFare * fareMultiplier),
          stopCode: stop.code,
          stopName: stop.stopName,
          order: i + 1, // Use array index as order
          category
        });

        await routeSection.save();
        await routeSection.populate('routeId', 'routeName routeNumber');
        await routeSection.populate('stopId', 'stopName code');
        
        createdSections.push(routeSection);
      } catch (error) {
        errors.push({
          stop: stop.stopName,
          error: error.message
        });
      }
    }

    res.status(201).json({
      message: `Auto-generation completed. ${createdSections.length} route sections created for ${category} category${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
      createdSections,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Auto-generate route sections error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
