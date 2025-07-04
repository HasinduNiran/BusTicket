import mongoose from 'mongoose';

const routeSectionSchema = new mongoose.Schema({
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BusRoute',
    required: true
  },
  stopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stop',
    required: true
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
  stopCode: {
    type: String,
    required: true,
    trim: true
  },
  stopName: {
    type: String,
    required: true,
    trim: true
  },
  order: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['normal', 'semi-luxury', 'luxury', 'super-luxury'],
    default: 'normal'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create compound unique index for route, stop, and category
routeSectionSchema.index({ routeId: 1, stopId: 1, category: 1 }, { unique: true });

// Create index for route and category for efficient querying
routeSectionSchema.index({ routeId: 1, category: 1, order: 1 });

export default mongoose.model('RouteSection', routeSectionSchema);
