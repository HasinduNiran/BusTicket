import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const ticketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    required: true,
    unique: true
  },
  fromStop: {
    stopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stop',
      required: true
    },
    stopName: {
      type: String,
      required: true
    },
    sectionNumber: {
      type: Number,
      required: true
    }
  },
  toStop: {
    stopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stop',
      required: true
    },
    stopName: {
      type: String,
      required: true
    },
    sectionNumber: {
      type: Number,
      required: true
    }
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BusRoute',
    required: true
  },
  fare: {
    type: Number,
    required: true,
    min: 0
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  conductorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  busNumber: {
    type: String,
    required: true
  },
  passengerCount: {
    type: Number,
    default: 1,
    min: 1
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'mobile'],
    default: 'cash'
  },
  status: {
    type: String,
    enum: ['active', 'used', 'cancelled'],
    default: 'active'
  },
  direction: {
    type: String,
    enum: ['forward', 'return'],
    required: true,
    default: 'forward'
  },
  qrCode: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
ticketSchema.index({ conductorId: 1, issueDate: -1 });
ticketSchema.index({ routeId: 1, issueDate: -1 });
ticketSchema.index({ ticketNumber: 1 });

// Add pagination plugin
ticketSchema.plugin(mongoosePaginate);

// Generate ticket number before saving
ticketSchema.pre('save', async function(next) {
  if (!this.ticketNumber) {
    const count = await this.constructor.countDocuments();
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    this.ticketNumber = `TKT${dateStr}${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export default mongoose.model('Ticket', ticketSchema);
