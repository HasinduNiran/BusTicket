import express from 'express';
import Stop from '../models/Stop.js';
import BusRoute from '../models/BusRoute.js';
import RouteSection from '../models/RouteSection.js';
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
      // Fallback to basic stops if no route sections found
      const stops = await Stop.find({ 
        routeId, 
        isActive: true 
      })
      .populate('routeId', 'routeName routeNumber startPoint endPoint')
      .sort({ sectionNumber: direction === 'forward' ? 1 : -1 });

      const processedStops = stops.map((stop, index) => ({
        ...stop.toObject(),
        displaySectionNumber: direction === 'return' ? (stops.length - 1 - stop.sectionNumber) : stop.sectionNumber,
        originalSectionNumber: stop.sectionNumber,
        order: index,
        fare: 0 // No fare data available
      }));

      return res.json({ 
        stops: processedStops,
        direction,
        totalStops: stops.length,
        hasFareData: false
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
    const { routeId, fromSection, toSection, category = 'normal', direction = 'forward' } = req.body;

    console.log('Calculate fare request:', { routeId, fromSection, toSection, category, direction });

    // Calculate the number of sections traveled (absolute value to handle both directions)
    const sectionCount = Math.abs(toSection - fromSection);

    // Handle the case where passenger gets off at the same section (0 sections)
    if (sectionCount === 0) {
      return res.json({
        fromStop: null,
        toStop: null,
        fare: 0,
        calculatedFare: 0,
        sectionCount: 0,
        sections: 0,
        category: category,
        calculation: `Same section (0 sections) = Rs. 0`
      });
    }

    // Get route sections for the specific category from database
    const fromRouteSection = await RouteSection.findOne({ 
      routeId, 
      sectionNumber: fromSection,
      category,
      isActive: true 
    });

    const toRouteSection = await RouteSection.findOne({ 
      routeId, 
      sectionNumber: toSection,
      category,
      isActive: true 
    });

    let fare = 0;

    if (fromRouteSection && toRouteSection) {
      // Calculate fare using actual RouteSection data
      fare = Math.abs(toRouteSection.fare - fromRouteSection.fare);
      console.log(`Using RouteSection data: From fare ${fromRouteSection.fare}, To fare ${toRouteSection.fare}, Calculated fare: ${fare}`);
    } else {
      // Fallback: Use fare table if RouteSection data not available
      const getFareBySection = (sections, busCategory) => {
        // Base fare table for normal category
        const baseFareTable = {
          1: 12, 2: 17, 3: 22, 4: 27, 5: 32, 6: 37, 7: 42, 8: 47, 9: 52, 10: 57,
          11: 62, 12: 67, 13: 72, 14: 77, 15: 82, 16: 87, 17: 92, 18: 97, 19: 102, 20: 107,
          21: 112, 22: 117, 23: 127, 24: 189, 25: 194, 26: 199, 27: 204, 28: 209, 29: 214, 30: 219,
          31: 224, 32: 229, 33: 234, 34: 239, 35: 244, 36: 249, 37: 254, 38: 259, 39: 264, 40: 269
        };

        let fare = baseFareTable[sections] || (sections * 5 + 7); // Default calculation if not in table

        // Apply category multipliers only for fallback
        switch (busCategory) {
          case 'semi-luxury':
            fare = Math.round(fare * 1.2);
            break;
          case 'luxury':
            fare = Math.round(fare * 1.5);
            break;
          case 'super-luxury':
            fare = Math.round(fare * 2.0);
            break;
          default:
            // normal category, no change
            break;
        }

        return fare;
      };

      fare = getFareBySection(sectionCount, category);
      console.log(`Using fallback fare table: ${sectionCount} sections = Rs.${fare}`);
    }

    // Get stop information for response (try RouteSection first, then Stop)
    const fromStop = fromRouteSection || await Stop.findOne({ 
      routeId, 
      sectionNumber: fromSection,
      isActive: true 
    });

    const toStop = toRouteSection || await Stop.findOne({ 
      routeId, 
      sectionNumber: toSection,
      isActive: true 
    });

    res.json({
      fromStop: fromStop ? {
        stopName: fromStop.stopName,
        sectionNumber: fromStop.sectionNumber,
        fare: fromStop.fare || 0
      } : null,
      toStop: toStop ? {
        stopName: toStop.stopName,
        sectionNumber: toStop.sectionNumber,
        fare: toStop.fare || 0
      } : null,
      fare: fare,
      calculatedFare: fare,
      sectionCount: sectionCount,
      sections: sectionCount,
      category: category,
      calculation: `Section count: ${sectionCount} sections = Rs. ${fare}`,
      dataSource: (fromRouteSection && toRouteSection) ? 'RouteSection' : 'FallbackTable'
    });
  } catch (error) {
    console.error('Calculate fare error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
