const express = require('express');
const Stop = require('../models/Stop');
const Ticket = require('../models/Ticket');
const Section = require('../models/Section');
const RouteSection = require('../models/RouteSection');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// Get fare between two stops using RouteSection model
router.post('/calculate', auth, async (req, res) => {
  try {
    const { routeId, fromSection, toSection, category = 'normal' } = req.body;

    if (fromSection >= toSection) {
      return res.status(400).json({ 
        message: 'Invalid section numbers. From section must be less than to section.' 
      });
    }

    // First, try to find route sections (new system)
    const fromRouteSection = await RouteSection.findOne({ 
      routeId, 
      sectionNumber: fromSection,
      category,
      isActive: true 
    }).populate('stopId', 'stopName code');

    const toRouteSection = await RouteSection.findOne({ 
      routeId, 
      sectionNumber: toSection,
      category,
      isActive: true 
    }).populate('stopId', 'stopName code');

    if (fromRouteSection && toRouteSection) {
      // Use new RouteSection system
      const fare = toRouteSection.fare - fromRouteSection.fare;

      return res.json({
        fromStop: {
          stopName: fromRouteSection.stopName,
          sectionNumber: fromRouteSection.sectionNumber,
          fare: fromRouteSection.fare
        },
        toStop: {
          stopName: toRouteSection.stopName,
          sectionNumber: toRouteSection.sectionNumber,
          fare: toRouteSection.fare
        },
        calculatedFare: fare,
        sections: toSection - fromSection,
        category: category,
        system: 'route-section'
      });
    }

    // Fallback to old Stop system
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
      return res.status(404).json({ message: 'Stop(s) not found in either system' });
    }

    const fare = toStop.fare - fromStop.fare;

    res.json({
      fromStop: {
        stopName: fromStop.stopName,
        sectionNumber: fromStop.sectionNumber,
        fare: fromStop.fare
      },
      toStop: {
        stopName: toStop.stopName,
        sectionNumber: toStop.sectionNumber,
        fare: toStop.fare
      },
      calculatedFare: fare,
      sections: toSection - fromSection,
      system: 'legacy-stop'
    });
  } catch (error) {
    console.error('Calculate fare error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get fare matrix for a route
router.get('/matrix/:routeId', auth, async (req, res) => {
  try {
    const { routeId } = req.params;
    
    const stops = await Stop.find({ 
      routeId, 
      isActive: true 
    }).sort({ sectionNumber: 1 });

    const fareMatrix = [];
    
    for (let i = 0; i < stops.length; i++) {
      const row = [];
      for (let j = 0; j < stops.length; j++) {
        if (i >= j) {
          row.push(null); // No fare for same or backward direction
        } else {
          const fare = stops[j].fare - stops[i].fare;
          row.push({
            from: stops[i].stopName,
            to: stops[j].stopName,
            fare: fare,
            sections: stops[j].sectionNumber - stops[i].sectionNumber
          });
        }
      }
      fareMatrix.push(row);
    }

    res.json({
      stops: stops.map(stop => ({
        id: stop._id,
        code: stop.code,
        stopName: stop.stopName,
        sectionNumber: stop.sectionNumber,
        fare: stop.fare
      })),
      fareMatrix
    });
  } catch (error) {
    console.error('Get fare matrix error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get revenue report (Admin only)
router.get('/revenue-report', auth, adminAuth, async (req, res) => {
  try {
    const { startDate, endDate, routeId } = req.query;
    
    const filter = {};
    
    if (startDate || endDate) {
      filter.issueDate = {};
      if (startDate) filter.issueDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.issueDate.$lte = end;
      }
    }
    
    if (routeId) filter.routeId = routeId;

    const tickets = await Ticket.find(filter)
      .populate('routeId', 'routeName routeNumber')
      .populate('conductorId', 'username');

    const totalRevenue = tickets.reduce((sum, ticket) => sum + ticket.fare, 0);
    const totalTickets = tickets.length;
    
    // Group by route
    const revenueByRoute = tickets.reduce((acc, ticket) => {
      const routeId = ticket.routeId._id.toString();
      if (!acc[routeId]) {
        acc[routeId] = {
          routeName: ticket.routeId.routeName,
          routeNumber: ticket.routeId.routeNumber,
          totalRevenue: 0,
          totalTickets: 0
        };
      }
      acc[routeId].totalRevenue += ticket.fare;
      acc[routeId].totalTickets += 1;
      return acc;
    }, {});

    // Group by conductor
    const revenueByConductor = tickets.reduce((acc, ticket) => {
      const conductorId = ticket.conductorId._id.toString();
      if (!acc[conductorId]) {
        acc[conductorId] = {
          conductorName: ticket.conductorId.username,
          totalRevenue: 0,
          totalTickets: 0
        };
      }
      acc[conductorId].totalRevenue += ticket.fare;
      acc[conductorId].totalTickets += 1;
      return acc;
    }, {});

    res.json({
      summary: {
        totalRevenue,
        totalTickets,
        averageFare: totalTickets > 0 ? totalRevenue / totalTickets : 0
      },
      revenueByRoute: Object.values(revenueByRoute),
      revenueByConductor: Object.values(revenueByConductor),
      period: {
        startDate: startDate || 'N/A',
        endDate: endDate || 'N/A'
      }
    });
  } catch (error) {
    console.error('Get revenue report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all sections for a route (for conductor quick reference)
router.get('/sections/:routeId', auth, async (req, res) => {
  try {
    const { routeId } = req.params;
    
    const sections = await Section.find({ 
      routeId, 
      isActive: true 
    })
    .select('sectionNumber fare description')
    .sort({ sectionNumber: 1 });

    // Format for conductor app
    const fareStructure = sections.map(section => ({
      section: section.sectionNumber,
      fare: section.fare,
      description: section.description
    }));

    res.json({ 
      success: true,
      fareStructure,
      totalSections: sections.length
    });
  } catch (error) {
    console.error('Get fare structure error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
