const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  stopName: {
    type: String,
    required: true,
    trim: true
  },
  sectionNumber: {
    type: Number,
    required: true,
    min: 0
  },
  fare: {
    type: Number,
    required: true,
    min: 0
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BusRoute',
    required: true
  },
  coordinates: {
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

// Create compound index for route and section
stopSchema.index({ routeId: 1, sectionNumber: 1 });
stopSchema.index({ routeId: 1, order: 1 });

module.exports = mongoose.model('Stop', stopSchema);
