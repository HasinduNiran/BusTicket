import express from 'express';
import Stop from '../models/Stop.js';
import BusRoute from '../models/BusRoute.js';
import RouteSection from '../models/RouteSection.js';
import Section from '../models/Section.js';
import { auth, adminAuth, busOwnerAuth } from '../middleware/auth.js';
const router = express.Router();

// Get all stops for a route with direction support
router.get('/route/:routeId', auth, async (req, res) => {
  try {
    const { routeId } = req.params;
    const { direction = 'forward', category = 'normal' } = req.query;
    
    // Get route sections with fare information
    const routeSections = await RouteSection.find({ 
      routeId, 
      category,
      isActive: true 
    })
    .populate('stopId', 'stopName code coordinates')
    .sort({ sectionNumber: direction === 'forward' ? 1 : -1 });

    if (routeSections.length === 0) {
      // Use Stop data (which has fare information)
      const stops = await Stop.find({ 
        routeId, 
        isActive: true 
      })
      .populate('routeId', 'routeName routeNumber startPoint endPoint')
      .sort({ sectionNumber: direction === 'forward' ? 1 : -1 });

      console.log(`Found ${stops.length} stops for route ${routeId}, category ${category}`);

      const processedStops = stops.map((stop, index) => ({
        ...stop.toObject(),
        displaySectionNumber: direction === 'return' ? (stops.length - 1 - stop.sectionNumber) : stop.sectionNumber,
        originalSectionNumber: stop.sectionNumber,
        order: index,
        fare: stop.fare || 0 // Use actual fare from Stop data
      }));

      return res.json({ 
        stops: processedStops,
        direction,
        totalStops: stops.length,
        hasFareData: true // Stop data has fare information
      });
    }

    // Process route sections with fare data
    const processedStops = routeSections.map((routeSection, index) => {
      const baseData = {
        _id: routeSection.stopId?._id || routeSection._id,
        code: routeSection.stopCode,
        stopName: routeSection.stopName,
        sectionNumber: routeSection.sectionNumber,
        fare: routeSection.fare, // This is the cumulative fare from start point
        routeId: routeSection.routeId,
        category: routeSection.category,
        order: routeSection.order,
        coordinates: routeSection.stopId?.coordinates || { latitude: null, longitude: null },
        isActive: routeSection.isActive
      };

      if (direction === 'return') {
        return {
          ...baseData,
          displaySectionNumber: routeSections.length - 1 - routeSection.sectionNumber,
          originalSectionNumber: routeSection.sectionNumber,
          order: index
        };
      }
      
      return {
        ...baseData,
        displaySectionNumber: routeSection.sectionNumber,
        originalSectionNumber: routeSection.sectionNumber,
        order: index
      };
    });

    res.json({ 
      stops: processedStops,
      direction,
      totalStops: routeSections.length,
      category,
      hasFareData: true
    });
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
      routeId, 
      coordinates
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

    // Check if section number already exists for this route
    const existingSection = await Stop.findOne({ 
      routeId, 
      sectionNumber 
    });
    if (existingSection) {
      return res.status(400).json({ 
        message: 'Section number already exists for this route' 
      });
    }

    const stop = new Stop({
      code,
      stopName,
      sectionNumber,
      routeId,
      coordinates
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

// Calculate fare between two stops based on section count
router.post('/calculate-fare', auth, async (req, res) => {
  try {
    const { routeId, fromSection, toSection, category = 'normal' } = req.body;

    // Validate input
    if (fromSection === undefined || toSection === undefined || !routeId) {
      return res.status(400).json({ 
        message: 'Missing required parameters: routeId, fromSection, toSection' 
      });
    }

    const fromSectionNumber = Number(fromSection);
    const toSectionNumber = Number(toSection);

    if (isNaN(fromSectionNumber) || isNaN(toSectionNumber)) {
      return res.status(400).json({ message: 'Section numbers must be valid numbers.' });
    }

    // Calculate the number of sections traveled
    const sectionsCount = Math.abs(toSectionNumber - fromSectionNumber);

    // Handle the case where passenger gets off at the same section
    if (sectionsCount === 0) {
      return res.json({
        fare: 0,
        calculatedFare: 0,
        sections: 0,
        message: 'Same section travel has no cost.'
      });
    }

    let fare = 0;
    let system = 'calculated';

    // Always use Section table for fare lookup
    const sectionFare = await Section.findOne({
      sectionNumber: sectionsCount,
      category,
      isActive: true
    });

    if (sectionFare) {
      fare = sectionFare.fare;
      system = 'section-based';
    } else {
      // Fallback to a default formula if not found
      const baseFare = 25;
      const perSectionFare = 15;
      const categoryMultipliers = {
        'normal': 1.0,
        'semi-luxury': 1.3,
        'luxury': 1.6,
        'super-luxury': 2.0
      };
      const multiplier = categoryMultipliers[category] || 1.0;
      fare = Math.ceil((baseFare + (sectionsCount * perSectionFare)) * multiplier);
      system = 'calculated-fallback';
    }

    // Get stop information for response (not for fare calculation)
    const fromStop = await Stop.findOne({
      routeId,
      sectionNumber: fromSectionNumber,
      isActive: true
    });
    const toStop = await Stop.findOne({
      routeId,
      sectionNumber: toSectionNumber,
      isActive: true
    });

    res.json({
      fromStop: fromStop ? { stopName: fromStop.stopName, sectionNumber: fromStop.sectionNumber } : { stopName: `Section ${fromSectionNumber}`, sectionNumber: fromSectionNumber },
      toStop: toStop ? { stopName: toStop.stopName, sectionNumber: toStop.sectionNumber } : { stopName: `Section ${toSectionNumber}`, sectionNumber: toSectionNumber },
      fare: fare,
      calculatedFare: fare,
      sections: sectionsCount,
      category: category,
      dataSource: system
    });

  } catch (error) {
    console.error('Calculate fare error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Debug endpoint to check RouteSection data
router.get('/debug/route-sections/:routeId', auth, async (req, res) => {
  try {
    const { routeId } = req.params;
    const { category = 'normal' } = req.query;
    
    const routeSections = await RouteSection.find({ 
      routeId, 
      category,
      isActive: true 
    }).sort({ sectionNumber: 1 });

    res.json({ 
      routeId,
      category,
      count: routeSections.length,
      sections: routeSections.map(rs => ({
        id: rs._id,
        sectionNumber: rs.sectionNumber,
        stopName: rs.stopName,
        fare: rs.fare,
        category: rs.category
      }))
    });
  } catch (error) {
    console.error('Debug route sections error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Debug endpoint to check stop data
router.get('/debug/route/:routeId', auth, async (req, res) => {
  try {
    const { routeId } = req.params;
    
    const stops = await Stop.find({ routeId, isActive: true })
      .sort({ sectionNumber: 1 });
    
    const routeSections = await RouteSection.find({ routeId, isActive: true })
      .sort({ sectionNumber: 1 });
    
    res.json({
      route: routeId,
      stops: stops.map(stop => ({
        id: stop._id,
        sectionNumber: stop.sectionNumber,
        stopName: stop.stopName,
        code: stop.code,
        fare: stop.fare
      })),
      routeSections: routeSections.map(rs => ({
        id: rs._id,
        sectionNumber: rs.sectionNumber,
        stopName: rs.stopName,
        category: rs.category,
        fare: rs.fare
      })),
      stopCount: stops.length,
      routeSectionCount: routeSections.length
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Debug endpoint to list all routes
router.get('/debug/routes', auth, async (req, res) => {
  try {
    const routes = await BusRoute.find({ isActive: true });
    res.json({
      routes: routes.map(route => ({
        id: route._id,
        routeName: route.routeName,
        routeNumber: route.routeNumber,
        startPoint: route.startPoint,
        endPoint: route.endPoint
      }))
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
