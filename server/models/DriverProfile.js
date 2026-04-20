const mongoose = require('mongoose');

const driverProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    aadhaar: {
      type: String,
      default: null,
    },
    license: {
      type: String,
      default: null,
    },
    vehicleImage: {
      type: String,
      default: null,
    },
    selfie: {
      type: String,
      default: null,
    },
    vehicleNumber: {
      type: String,
      trim: true,
    },
    vehicleName: {
      type: String,
      trim: true,
      default: null,
    },
    vehicleColor: {
      type: String,
      trim: true,
      default: null,
    },
    vehicleType: {
      type: String,
      enum: ['bike', 'auto', 'car', 'van', 'truck'],
      default: 'bike',
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    totalTrips: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DriverProfile', driverProfileSchema);
