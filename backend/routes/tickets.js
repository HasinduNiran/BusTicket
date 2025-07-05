import express from 'express';
import Ticket from '../models/Ticket.js';
import Stop from '../models/Stop.js';
import BusRoute from '../models/BusRoute.js';
import { auth, conductorAuth } from '../middleware/auth.js';
const router = express.Router();

// Generate ticket
router.post('/generate', auth, conductorAuth, async (req, res) => {
  try {
    const { 
      fromSectionNumber, 
      toSectionNumber, 
      routeId, 
      busNumber, 
      passengerCount = 1,
      paymentMethod = 'cash',
      direction = 'forward'
    } = req.body;


    // Validate section numbers
    if (typeof fromSectionNumber !== 'number' || typeof toSectionNumber !== 'number' || fromSectionNumber < 0 || toSectionNumber <= fromSectionNumber) {
      return res.status(400).json({
        message: 'Invalid section numbers. From section must be less than to section and both must be valid numbers.',
        error: 'INVALID_SECTION_ORDER'
      });
    }

    // Get bus category for fare calculation
    const Bus = await import('../models/Bus.js').then(module => module.default);
    const bus = await Bus.findOne({ busNumber, isActive: true }).populate('routeId');
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found or inactive' });
    }

    // Calculate sections traveled
    const sectionsCount = toSectionNumber - fromSectionNumber;

    // Always use Section table for fare lookup
    const Section = await import('../models/Section.js').then(module => module.default);
    let fare = 0;
    const sectionFare = await Section.findOne({
      sectionNumber: sectionsCount,
      category: bus.category,
      isActive: true
    });
    if (sectionFare) {
      fare = sectionFare.fare * passengerCount;
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
      const multiplier = categoryMultipliers[bus.category] || 1.0;
      fare = Math.ceil((baseFare + (sectionsCount * perSectionFare)) * multiplier) * passengerCount;
    }

    // Get stops (for ticket info only, not for fare calculation)
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
    if (!fromStop || !toStop) {
      return res.status(404).json({ message: 'Stop(s) not found' });
    }

    // Create ticket
    const ticket = new Ticket({
      fromStop: {
        stopId: fromStop._id,
        stopName: fromStop.stopName,
        sectionNumber: fromStop.sectionNumber
      },
      toStop: {
        stopId: toStop._id,
        stopName: toStop.stopName,
        sectionNumber: toStop.sectionNumber
      },
      routeId,
      fare,
      conductorId: req.user._id,
      busNumber,
      passengerCount,
      paymentMethod,
      direction
    });

    await ticket.save();
    await ticket.populate([
      { path: 'routeId', select: 'routeName routeNumber' },
      { path: 'conductorId', select: 'username' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Ticket generated successfully',
      ticket
    });
  } catch (error) {
    console.error('Generate ticket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get conductor's tickets for today
router.get('/my-tickets', auth, conductorAuth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tickets = await Ticket.find({
      conductorId: req.user._id,
      issueDate: {
        $gte: today,
        $lt: tomorrow
      }
    })
    .populate('routeId', 'routeName routeNumber')
    .sort({ issueDate: -1 });

    // Calculate daily summary
    const totalTickets = tickets.length;
    const totalRevenue = tickets.reduce((sum, ticket) => sum + ticket.fare, 0);
    const ticketsByStatus = tickets.reduce((acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      tickets,
      summary: {
        totalTickets,
        totalRevenue,
        ticketsByStatus,
        date: today.toISOString().split('T')[0]
      }
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get ticket by number
router.get('/number/:ticketNumber', auth, async (req, res) => {
  try {
    const { ticketNumber } = req.params;

    const ticket = await Ticket.findOne({ ticketNumber })
      .populate([
        { path: 'routeId', select: 'routeName routeNumber' },
        { path: 'conductorId', select: 'username' }
      ]);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json({ ticket });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all tickets (Admin view)
router.get('/all', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      routeId, 
      conductorId, 
      startDate, 
      endDate,
      status
    } = req.query;

    // Build filter
    const filter = {};
    
    if (routeId) filter.routeId = routeId;
    if (conductorId) filter.conductorId = conductorId;
    if (status) filter.status = status;
    
    if (startDate || endDate) {
      filter.issueDate = {};
      if (startDate) filter.issueDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.issueDate.$lte = end;
      }
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { issueDate: -1 },
      populate: [
        { path: 'routeId', select: 'routeName routeNumber' },
        { path: 'conductorId', select: 'username' }
      ]
    };

    const tickets = await Ticket.paginate(filter, options);

    res.json({ tickets });
  } catch (error) {
    console.error('Get all tickets error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel ticket
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && ticket.conductorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (ticket.status === 'cancelled') {
      return res.status(400).json({ message: 'Ticket already cancelled' });
    }

    ticket.status = 'cancelled';
    await ticket.save();

    res.json({
      message: 'Ticket cancelled successfully',
      ticket
    });
  } catch (error) {
    console.error('Cancel ticket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
