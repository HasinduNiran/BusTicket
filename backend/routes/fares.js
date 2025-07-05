import express from 'express';
import Stop from '../models/Stop.js';
import Ticket from '../models/Ticket.js';
import Section from '../models/Section.js';
import RouteSection from '../models/RouteSection.js';
import { auth, adminAuth } from '../middleware/auth.js';
const router = express.Router();

// Get fare between two stops using RouteSection model
router.post('/calculate', auth, async (req, res) => {
  try {
    const { routeId, fromSection, toSection, category = 'normal' } = req.body;

    // Validation
    if (fromSection >= toSection) {
      return res.status(400).json({ 
        message: 'Invalid section numbers. From section must be less than to section.',
        error: 'INVALID_SECTION_ORDER'
      });
    }

    if (fromSection < 0 || toSection < 0) {
      return res.status(400).json({ 
        message: 'Section numbers must be non-negative.',
        error: 'NEGATIVE_SECTION'
      });
    }

    const sectionsCount = toSection - fromSection;


    // Always use Section table for fare calculation
    const sectionFare = await Section.findOne({ 
      sectionNumber: sectionsCount,
      category,
      isActive: true 
    });

    if (sectionFare) {
      return res.json({
        fromStop: {
          stopName: `Section ${fromSection}`,
          sectionNumber: fromSection,
          fare: 0
        },
        toStop: {
          stopName: `Section ${toSection}`,
          sectionNumber: toSection,
          fare: sectionFare.fare
        },
        calculatedFare: sectionFare.fare,
        sections: sectionsCount,
        category: category,
        system: 'section-based'
      });
    }

    // Fallback: use formula if section fare not found
    const baseFare = 25; // Base fare
    const perSectionFare = 15; // Per section fare
    // Category multipliers
    const categoryMultipliers = {
      'normal': 1.0,
      'semi-luxury': 1.3,
      'luxury': 1.6,
      'super-luxury': 2.0
    };
    const multiplier = categoryMultipliers[category] || 1.0;
    const calculatedFare = Math.ceil((baseFare + (sectionsCount * perSectionFare)) * multiplier);
    return res.json({
      fromStop: {
        stopName: `Section ${fromSection}`,
        sectionNumber: fromSection,
        fare: 0
      },
      toStop: {
        stopName: `Section ${toSection}`,
        sectionNumber: toSection,
        fare: calculatedFare
      },
      calculatedFare: calculatedFare,
      sections: sectionsCount,
      category: category,
      system: 'calculated'
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

    // Build fare matrix using Section table for each section count
    const fareMatrix = [];
    for (let i = 0; i < stops.length; i++) {
      const row = [];
      for (let j = 0; j < stops.length; j++) {
        if (i >= j) {
          row.push(null); // No fare for same or backward direction
        } else {
          const sectionsCount = stops[j].sectionNumber - stops[i].sectionNumber;
          // Always use Section table for fare
          // Default to 'normal' category for matrix
          // (Optionally, could allow category as query param)
          // eslint-disable-next-line no-await-in-loop
          const sectionFare = await Section.findOne({ sectionNumber: sectionsCount, category: 'normal', isActive: true });
          let fare = sectionFare ? sectionFare.fare : null;
          if (fare === null) {
            // Fallback formula
            const baseFare = 25;
            const perSectionFare = 15;
            fare = Math.ceil(baseFare + (sectionsCount * perSectionFare));
          }
          row.push({
            from: stops[i].stopName,
            to: stops[j].stopName,
            fare: fare,
            sections: sectionsCount
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

export default router;
