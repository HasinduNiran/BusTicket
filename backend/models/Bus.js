import mongoose from 'mongoose';

const busSchema = new mongoose.Schema({
  busNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BusRoute',
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['normal', 'semi-luxury', 'luxury', 'super-luxury'],
    default: 'normal'
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
    default: 50
  },
  driverName: {
    type: String,
    trim: true
  },
  conductorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastMaintenanceDate: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Create indexes
busSchema.index({ routeId: 1, category: 1 });
busSchema.index({ busNumber: 1 });
busSchema.index({ conductorId: 1 });

export default mongoose.model('Bus', busSchema);
