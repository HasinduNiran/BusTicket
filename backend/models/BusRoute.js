const mongoose = require('mongoose');

const busRouteSchema = new mongoose.Schema({
  routeName: {
    type: String,
    required: true,
    trim: true
  },
  routeNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  startPoint: {
    type: String,
    required: true,
    default: 'Embilipitiya'
  },
  endPoint: {
    type: String,
    required: true
  },
  distance: {
    type: Number,
    required: true
  },
  estimatedDuration: {
    type: Number, // in minutes
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('BusRoute', busRouteSchema);
