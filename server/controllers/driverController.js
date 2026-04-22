const Trip = require('../models/Trip');
const DriverProfile = require('../models/DriverProfile');
const Booking = require('../models/Booking');
const path = require('path');
const mongoose = require('mongoose');
const { isCloudinaryEnabled, uploadBuffer } = require('../services/cloudinary');

// @desc    Upload KYC documents
// @route   POST /api/driver/upload-docs
// @access  Private (Driver)
const uploadDocs = async (req, res) => {
  try {
    const files = req.files;
    const hasFiles = !!files && Object.keys(files).length > 0;

    const updateData = {};
    if (hasFiles) {
      const fields = ['aadhaar', 'license', 'vehicleImage', 'selfie'];
      const enabled = isCloudinaryEnabled();

      for (const field of fields) {
        const file = files?.[field]?.[0];
        if (!file) continue;

        if (enabled) {
          const result = await uploadBuffer(file.buffer, {
            folder: `parcelflow/kyc/${req.user.id}`,
            public_id: `${field}-${Date.now()}`,
            resource_type: 'auto',
          });
          updateData[field] = result.secure_url;
        } else {
          updateData[field] = file.filename;
        }
      }
    }

    const { vehicleNumber, vehicleType, vehicleName, vehicleColor } = req.body;
    if (vehicleNumber) updateData.vehicleNumber = vehicleNumber;
    if (vehicleType) updateData.vehicleType = vehicleType;
    if (vehicleName !== undefined) updateData.vehicleName = vehicleName || null;
    if (vehicleColor !== undefined) updateData.vehicleColor = vehicleColor || null;

    const hasUpdates = hasFiles || Object.keys(updateData).length > 0;
    if (!hasUpdates) {
      return res.status(400).json({ success: false, message: 'Please upload at least one document or update vehicle info.' });
    }

    updateData.verificationStatus = 'pending';

    const profile = await DriverProfile.findOneAndUpdate(
      { userId: req.user.id },
      updateData,
      { new: true, upsert: true }
    );

    res.json({ success: true, message: 'Documents uploaded. Awaiting admin verification.', profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get driver profile
// @route   GET /api/driver/profile
// @access  Private (Driver)
const getProfile = async (req, res) => {
  try {
    const profile = await DriverProfile.findOne({ userId: req.user.id }).populate('userId', 'name phone email');
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Driver profile not found.' });
    }
    res.json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create trip
// @route   POST /api/driver/create-trip
// @access  Private (Driver)
const createTrip = async (req, res) => {
  try {
    const profile = await DriverProfile.findOne({ userId: req.user.id });
    if (!profile || profile.verificationStatus !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'You must be verified by admin before creating trips.',
      });
    }

    const raw = req.body || {};
    const norm = (value) => (typeof value === 'string' ? value.trim() : value);

    // Allow a few aliases so older clients / renamed form fields don't break trip creation.
    const from = norm(raw.from ?? raw.origin);
    const to = norm(raw.to ?? raw.destination);
    const pickupLocation = norm(raw.pickupLocation ?? raw.pickup_location ?? raw.pickup);
    const dropLocation = norm(raw.dropLocation ?? raw.dropOffLocation ?? raw.dropoffLocation ?? raw.drop);
    const date = raw.date;
    const time = norm(raw.time);
    const arrivalTime = norm(raw.arrivalTime) || null; // optional
    const capacityRaw = raw.capacity;
    const notes = norm(raw.notes);

    const resolvedPricePerKgRaw = raw.pricePerKg ?? raw.pricePerSlot;

    const missing = [];
    if (!from) missing.push('from');
    if (!to) missing.push('to');
    if (!pickupLocation) missing.push('pickupLocation');
    if (!dropLocation) missing.push('dropLocation');
    if (!date) missing.push('date');
    if (!time) missing.push('time');
    if (capacityRaw === undefined || capacityRaw === null || capacityRaw === '') missing.push('capacity');
    if (resolvedPricePerKgRaw === undefined || resolvedPricePerKgRaw === null || resolvedPricePerKgRaw === '')
      missing.push('pricePerKg');

    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: `All trip fields are required: ${missing.join(', ')}.`,
        missingFields: missing,
      });
    }

    const tripDate = new Date(date);
    if (Number.isNaN(tripDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Trip date must be a valid date.' });
    }

    // Match UI validation: allow today, block only past dates.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    tripDate.setHours(0, 0, 0, 0);
    if (tripDate < today) {
      return res.status(400).json({ success: false, message: 'Trip date must be today or in the future.' });
    }

    const capacity = Number(capacityRaw);
    if (!Number.isFinite(capacity) || capacity < 1) {
      return res.status(400).json({ success: false, message: 'Capacity must be a valid number (min 1).' });
    }

    const pricePerKg = Number(resolvedPricePerKgRaw);
    if (!Number.isFinite(pricePerKg) || pricePerKg < 0) {
      return res.status(400).json({ success: false, message: 'Price per kg must be a valid number.' });
    }

    const trip = await Trip.create({
      driverId: req.user.id,
      from,
      to,
      pickupLocation,
      dropLocation,
      date: tripDate,
      time,
      arrivalTime,
      capacity,
      availableSlots: capacity,
      pricePerKg,
      // Also fill old field for compatibility.
      pricePerSlot: pricePerKg,
      notes,
    });

    res.status(201).json({ success: true, message: 'Trip created. Awaiting admin approval.', trip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get driver's trips
// @route   GET /api/driver/trips
// @access  Private (Driver)
const getMyTrips = async (req, res) => {
  try {
    const trips = await Trip.find({ driverId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, trips });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update trip status (cancel/complete)
// @route   PUT /api/driver/trips/:id/status
// @access  Private (Driver)
const updateTripStatus = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { status } = req.body;
    if (!['cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const tripId = req.params.id;
    if (!mongoose.isValidObjectId(tripId)) {
      return res.status(400).json({ success: false, message: 'Invalid trip id.' });
    }

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }
    if (trip.driverId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    if (trip.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Trip is already cancelled.' });
    }
    if (trip.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Trip is already completed.' });
    }
    if (trip.status === 'rejected') {
      return res.status(400).json({ success: false, message: 'Rejected trips cannot be updated.' });
    }

    if (status === 'completed') {
      if (trip.status !== 'approved') {
        return res.status(400).json({ success: false, message: 'Only approved trips can be completed.' });
      }
      trip.status = 'completed';
      await trip.save();
      return res.json({ success: true, message: 'Trip marked as completed.', trip });
    }

    // status === 'cancelled'
    if (!['pending', 'approved'].includes(trip.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel a ${trip.status} trip.` });
    }

    await session.withTransaction(async () => {
      // Disallow cancelling if delivery is already in progress/completed.
      const progressed = await Booking.countDocuments(
        { tripId: trip._id, status: { $in: ['picked', 'in-transit', 'delivered'] } },
        { session }
      );
      if (progressed > 0) {
        throw Object.assign(new Error('Cannot cancel trip with pickups/in-transit/delivered bookings.'), { status: 400 });
      }

      const activeBookings = await Booking.find(
        { tripId: trip._id, status: { $ne: 'cancelled' } },
        null,
        { session }
      );

      // Restore capacity for any non-cancelled booking weights
      const restoreKg = activeBookings.reduce((sum, b) => sum + (Number(b.parcelDetails?.weight) || 0), 0);
      if (restoreKg > 0) {
        await Trip.updateOne({ _id: trip._id }, { $inc: { availableSlots: restoreKg } }, { session });
      }

      // Cancel all those bookings
      if (activeBookings.length > 0) {
        await Booking.updateMany(
          { _id: { $in: activeBookings.map((b) => b._id) } },
          { $set: { status: 'cancelled', cancellationReason: 'Trip cancelled by driver' } },
          { session }
        );
      }

      await Trip.updateOne({ _id: trip._id }, { $set: { status: 'cancelled' } }, { session });
    });

    const updated = await Trip.findById(trip._id);
    res.json({
      success: true,
      message: 'Trip cancelled. All bookings were cancelled automatically.',
      trip: updated,
    });
  } catch (error) {
    const httpStatus = error?.status || 500;
    res.status(httpStatus).json({ success: false, message: error.message || 'Server error' });
  } finally {
    session.endSession();
  }
};

// @desc    Get bookings on driver's trips
// @route   GET /api/driver/bookings
// @access  Private (Driver)
const getTripBookings = async (req, res) => {
  try {
    const trips = await Trip.find({ driverId: req.user.id });
    const tripIds = trips.map((t) => t._id);

    const bookings = await Booking.find({ tripId: { $in: tripIds } })
      .populate('tripId', 'from to pickupLocation dropLocation date time')
      .populate('customerId', 'name phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update booking status
// @route   PUT /api/driver/booking/:id/status
// @access  Private (Driver)
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['picked', 'in-transit', 'delivered'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const booking = await Booking.findById(req.params.id).populate('tripId');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.tripId.driverId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    booking.status = status;
    if (status === 'delivered') {
      booking.paymentStatus = 'collected';
      // Update driver earnings
      await DriverProfile.findOneAndUpdate(
        { userId: req.user.id },
        { $inc: { totalEarnings: booking.amount } }
      );
    }
    await booking.save();

    res.json({ success: true, message: `Booking marked as ${status}`, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get driver earnings summary
// @route   GET /api/driver/earnings
// @access  Private (Driver)
const getEarnings = async (req, res) => {
  try {
    const profile = await DriverProfile.findOne({ userId: req.user.id });
    const trips = await Trip.find({ driverId: req.user.id });
    const tripIds = trips.map((t) => t._id);
    const deliveredBookings = await Booking.find({ tripId: { $in: tripIds }, status: 'delivered' });

    const totalEarnings = deliveredBookings.reduce((sum, b) => sum + b.amount, 0);
    const totalBookings = await Booking.countDocuments({ tripId: { $in: tripIds } });

    res.json({
      success: true,
      earnings: {
        total: totalEarnings,
        totalTrips: trips.length,
        totalBookings,
        deliveredCount: deliveredBookings.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { uploadDocs, getProfile, createTrip, getMyTrips, updateTripStatus, getTripBookings, updateBookingStatus, getEarnings };
