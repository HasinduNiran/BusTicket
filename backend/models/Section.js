import mongoose from 'mongoose';

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
  category: {
    type: String,
    required: true,
    enum: ['normal', 'semi-luxury', 'luxury', 'super-luxury'],
    default: 'normal'
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

// Create compound unique index for section number and category
sectionSchema.index({ category: 1, sectionNumber: 1 }, { unique: true });

export default mongoose.model('Section', sectionSchema);
