const Trip = require('../models/Trip');
const Booking = require('../models/Booking');
const DriverProfile = require('../models/DriverProfile');

const VEHICLE_TYPE_INFO = {
  bike: 'Best for small parcels (lightweight).',
  auto: 'Good for small–medium parcels.',
  car: 'Good for medium parcels; safer handling vs two-wheelers.',
  van: 'Suitable for medium–heavy parcels; higher capacity.',
  truck: 'Best for heavy/bulky parcels; highest capacity.',
};

// @desc    Search/get available trips
// @route   GET /api/trips
// @access  Public/Private
const getTrips = async (req, res) => {
  try {
    const { from, to, date } = req.query;
    const filter = { status: 'approved', availableSlots: { $gt: 0 } };

    if (from) filter.from = { $regex: from, $options: 'i' };
    if (to) filter.to = { $regex: to, $options: 'i' };
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    } else {
      // Only future trips
      filter.date = { $gte: new Date() };
    }

    const trips = await Trip.find(filter)
      .populate('driverId', 'name phone')
      .sort({ date: 1, time: 1 });

    res.json({ success: true, trips });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single trip details
// @route   GET /api/trips/:id
// @access  Public
const getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id).populate('driverId', 'name phone email');
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }
    const profile = await DriverProfile.findOne({ userId: trip.driverId?._id }).lean();
    const vehicleType = profile?.vehicleType || 'bike';

    res.json({
      success: true,
      trip,
      driverVehicle: profile
        ? {
            vehicleType,
            vehicleTypeDescription: VEHICLE_TYPE_INFO[vehicleType] || '',
            vehicleNumber: profile.vehicleNumber || null,
            vehicleName: profile.vehicleName || null,
            vehicleColor: profile.vehicleColor || null,
          }
        : null,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Book a parcel slot
// @route   POST /api/bookings
// @access  Private (Customer)
const createBooking = async (req, res) => {
  try {
    const { tripId, parcelDetails } = req.body;

    if (!tripId || !parcelDetails) {
      return res.status(400).json({ success: false, message: 'Trip ID and parcel details are required.' });
    }

    const weight = Number(parcelDetails.weight);
    if (!Number.isFinite(weight) || weight <= 0) {
      return res.status(400).json({ success: false, message: 'Parcel weight must be a valid number.' });
    }

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    if (trip.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'This trip is not available for booking.' });
    }

    if (trip.availableSlots <= 0) {
      return res.status(400).json({ success: false, message: 'No capacity available on this trip.' });
    }

    if (weight > trip.availableSlots) {
      return res.status(400).json({
        success: false,
        message: `Only ${trip.availableSlots}kg capacity available.`,
      });
    }

    // Check if customer already has a booking on this trip
    const existingBooking = await Booking.findOne({ tripId, customerId: req.user.id, status: { $ne: 'cancelled' } });
    if (existingBooking) {
      return res.status(409).json({ success: false, message: 'You already have a booking on this trip.' });
    }

    const pricePerKg = Number(trip.pricePerKg ?? trip.pricePerSlot);
    if (!Number.isFinite(pricePerKg) || pricePerKg < 0) {
      return res.status(500).json({ success: false, message: 'Trip pricing is not configured properly.' });
    }

    const amount = Number((weight * pricePerKg).toFixed(2));
    const booking = await Booking.create({
      tripId,
      customerId: req.user.id,
      parcelDetails: { ...parcelDetails, weight },
      amount,
    });

    // Reduce available slots
    await Trip.findByIdAndUpdate(tripId, { $inc: { availableSlots: -weight } });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('tripId', 'from to date time driverId')
      .populate('customerId', 'name phone');

    res.status(201).json({
      success: true,
      message: 'Parcel booked successfully!',
      booking: populatedBooking,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get customer bookings
// @route   GET /api/bookings/my
// @access  Private (Customer)
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ customerId: req.user.id })
      .populate({
        path: 'tripId',
        populate: { path: 'driverId', select: 'name phone' },
      })
      .sort({ createdAt: -1 })
      .lean();

    const driverIds = Array.from(
      new Set(
        bookings
          .map((b) => b.tripId?.driverId?._id)
          .filter(Boolean)
          .map((id) => id.toString())
      )
    );

    const profiles = await DriverProfile.find({ userId: { $in: driverIds } }).lean();
    const byUserId = new Map(profiles.map((p) => [p.userId.toString(), p]));

    const enriched = bookings.map((b) => {
      const driverId = b.tripId?.driverId?._id?.toString();
      const profile = driverId ? byUserId.get(driverId) : null;
      const vehicleType = profile?.vehicleType || null;
      return {
        ...b,
        driverVehicle: profile
          ? {
              vehicleType,
              vehicleTypeDescription: VEHICLE_TYPE_INFO[vehicleType] || '',
              vehicleNumber: profile.vehicleNumber || null,
              vehicleName: profile.vehicleName || null,
              vehicleColor: profile.vehicleColor || null,
            }
          : null,
      };
    });

    res.json({ success: true, bookings: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel a booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private (Customer)
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.customerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    if (['delivered', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel a ${booking.status} booking.` });
    }

    booking.status = 'cancelled';
    booking.cancellationReason = req.body.reason || 'Customer cancelled';
    await booking.save();

    // Restore available slots
    await Trip.findByIdAndUpdate(booking.tripId, {
      $inc: { availableSlots: booking.parcelDetails.weight },
    });

    res.json({ success: true, message: 'Booking cancelled.', booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getTrips, getTripById, createBooking, getMyBookings, cancelBooking };
