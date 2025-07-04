const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'bus_owner', 'conductor'],
    default: 'conductor'
  },
  busOwnerDetails: {
    companyName: String,
    licenseNumber: String,
    contactNumber: String,
    address: String
  },
  conductorDetails: {
    employeeId: String,
    busNumber: String,
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BusRoute'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
