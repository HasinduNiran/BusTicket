const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  sectionNumber: {
    type: Number,
    required: true,
    min: 1
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
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create compound unique index
sectionSchema.index({ routeId: 1, sectionNumber: 1 }, { unique: true });

module.exports = mongoose.model('Section', sectionSchema);
