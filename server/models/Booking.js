const mongoose = require('mongoose');

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
    amount: {
      type: Number,
      required: true,
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
  },
  { timestamps: true }
);

// Generate booking ID before saving
bookingSchema.pre('save', function (next) {
  if (!this.bookingId) {
    this.bookingId =
      'PF-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
