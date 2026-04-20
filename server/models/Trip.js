const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    from: {
      type: String,
      required: [true, 'Origin is required'],
      trim: true,
    },
    to: {
      type: String,
      required: [true, 'Destination is required'],
      trim: true,
    },
    pickupLocation: {
      type: String,
      required: [true, 'Pickup location is required'],
      trim: true,
    },
    dropLocation: {
      type: String,
      required: [true, 'Drop location is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Trip date is required'],
    },
    time: {
      type: String,
      required: [true, 'Trip time is required'],
    },
    arrivalTime: {
      type: String,
      default: null,
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity in kg is required'],
      min: 1,
    },
    availableSlots: {
      type: Number,
      required: true,
    },
    // New pricing model: price per kg
    pricePerKg: {
      type: Number,
      required: [true, 'Price per kg is required'],
      min: 0,
    },
    // Backward-compat (old field). Kept to avoid breaking older seeded data or clients.
    pricePerSlot: {
      type: Number,
      default: null,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Index for search
tripSchema.index({ from: 1, to: 1, date: 1, status: 1 });

module.exports = mongoose.model('Trip', tripSchema);
