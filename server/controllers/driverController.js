const Trip = require('../models/Trip');
const DriverProfile = require('../models/DriverProfile');
const Booking = require('../models/Booking');
const path = require('path');

// @desc    Upload KYC documents
// @route   POST /api/driver/upload-docs
// @access  Private (Driver)
const uploadDocs = async (req, res) => {
  try {
    const files = req.files;
    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded.' });
    }

    const updateData = {};
    if (files.aadhaar) updateData.aadhaar = files.aadhaar[0].filename;
    if (files.license) updateData.license = files.license[0].filename;
    if (files.vehicleImage) updateData.vehicleImage = files.vehicleImage[0].filename;
    if (files.selfie) updateData.selfie = files.selfie[0].filename;

    const { vehicleNumber, vehicleType } = req.body;
    if (vehicleNumber) updateData.vehicleNumber = vehicleNumber;
    if (vehicleType) updateData.vehicleType = vehicleType;

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

    const { from, to, date, time, capacity, pricePerSlot, notes } = req.body;

    if (!from || !to || !date || !time || !capacity || !pricePerSlot) {
      return res.status(400).json({ success: false, message: 'All trip fields are required.' });
    }

    if (new Date(date) < new Date()) {
      return res.status(400).json({ success: false, message: 'Trip date must be in the future.' });
    }

    const trip = await Trip.create({
      driverId: req.user.id,
      from,
      to,
      date,
      time,
      capacity: Number(capacity),
      availableSlots: Number(capacity),
      pricePerSlot: Number(pricePerSlot),
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

// @desc    Get bookings on driver's trips
// @route   GET /api/driver/bookings
// @access  Private (Driver)
const getTripBookings = async (req, res) => {
  try {
    const trips = await Trip.find({ driverId: req.user.id });
    const tripIds = trips.map((t) => t._id);

    const bookings = await Booking.find({ tripId: { $in: tripIds } })
      .populate('tripId', 'from to date time')
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

module.exports = { uploadDocs, getProfile, createTrip, getMyTrips, getTripBookings, updateBookingStatus, getEarnings };
