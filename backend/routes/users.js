import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import BusRoute from '../models/BusRoute.js';
import { auth, adminAuth } from '../middleware/auth.js';
const router = express.Router();

// Get all users (Admin only)
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const { role, search, page = 1, limit = 10 } = req.query;
    
    let query = {};
    
    // Filter by role if specified
    if (role && role !== 'all') {
      query.role = role;
    }
    
    // Search by username or email
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const users = await User.find(query)
      .select('-password')
      .populate('conductorDetails.routeId', 'routeName routeNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalUsers: total,
        hasNext: skip + parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user by ID (Admin only)
router.get('/:id', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id)
      .select('-password')
      .populate('conductorDetails.routeId', 'routeName routeNumber');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new user (Admin only)
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      role,
      busOwnerDetails,
      conductorDetails
    } = req.body;

    // Validation
    if (!username || !email || !password || !role) {
      return res.status(400).json({
        message: 'Missing required fields: username, email, password, and role are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email or username already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user object
    const userData = {
      username,
      email,
      password: hashedPassword,
      role
    };

    // Add role-specific details
    if (role === 'bus_owner' && busOwnerDetails) {
      userData.busOwnerDetails = busOwnerDetails;
    }

    if (role === 'conductor' && conductorDetails) {
      userData.conductorDetails = conductorDetails;
    }

    const user = new User(userData);
    await user.save();

    // Return user without password
    const userResponse = await User.findById(user._id)
      .select('-password')
      .populate('conductorDetails.routeId', 'routeName routeNumber');

    res.status(201).json({
      message: 'User created successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Create user error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Validation error',
        errors
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'User with this email or username already exists'
      });
    }
    
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update user (Admin only)
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Remove password from update data (handle separately)
    delete updateData.password;

    // If password is being updated, hash it
    if (req.body.password) {
      updateData.password = await bcrypt.hash(req.body.password, 10);
    }

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .select('-password')
      .populate('conductorDetails.routeId', 'routeName routeNumber');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Validation error',
        errors
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'User with this email or username already exists'
      });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle user active status (Admin only)
router.patch('/:id/toggle-status', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: user.isActive
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user (Admin only) - Soft delete by setting isActive to false
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user statistics (Admin only)
router.get('/stats/overview', auth, adminAuth, async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalUsers = await User.countDocuments({ isActive: true });
    const totalInactiveUsers = await User.countDocuments({ isActive: false });

    const roleStats = {};
    stats.forEach(stat => {
      roleStats[stat._id] = stat.count;
    });

    res.json({
      totalUsers,
      totalInactiveUsers,
      roleBreakdown: {
        admin: roleStats.admin || 0,
        bus_owner: roleStats.bus_owner || 0,
        conductor: roleStats.conductor || 0
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get available routes for conductor assignment (Admin only)
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

export default router;
