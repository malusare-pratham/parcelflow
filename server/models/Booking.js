const mongoose = require('mongoose');
const crypto = require('crypto');

const bookingSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bookingId: {
      type: String,
      unique: true,
    },
    parcelDetails: {
      description: {
        type: String,
        required: [true, 'Parcel description is required'],
      },
      weight: {
        type: Number,
        required: [true, 'Parcel weight is required'],
        min: 0.1,
      },
      receiverName: {
        type: String,
        required: [true, 'Receiver name is required'],
      },
      receiverPhone: {
        type: String,
        required: [true, 'Receiver phone is required'],
      },
      deliveryAddress: {
        type: String,
        required: [true, 'Delivery address is required'],
      },
    },
    parcelImages: {
      type: [String],
      default: [],
    },
    amount: {
      type: Number,
      required: true,
    },
    confirmationStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected'],
      default: 'pending',
    },
    status: {
      type: String,
      enum: ['booked', 'picked', 'in-transit', 'delivered', 'cancelled'],
      default: 'booked',
    },
    paymentMethod: {
      type: String,
      default: 'cash-on-delivery',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'collected'],
      default: 'pending',
    },
    cancellationReason: {
      type: String,
      default: null,
    },
    decisionAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Generate booking ID before saving
bookingSchema.pre('save', function (next) {
  if (!this.bookingId) {
    // More collision-resistant than Date.now + Math.random (still short & readable).
    const rand = crypto.randomBytes(5).toString('hex').toUpperCase(); // 10 chars
    this.bookingId = `PF-${rand}`;
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
