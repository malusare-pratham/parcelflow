const User = require('../models/User');
const DriverProfile = require('../models/DriverProfile');
const Trip = require('../models/Trip');
const Booking = require('../models/Booking');

// @desc    Get all drivers with profiles
// @route   GET /api/admin/drivers
// @access  Private (Admin)
const getAllDrivers = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { role: 'driver' };

    const drivers = await User.find(filter).select('-password').lean();

    const driversWithProfiles = await Promise.all(
      drivers.map(async (driver) => {
        const profile = await DriverProfile.findOne({ userId: driver._id });
        return { ...driver, profile };
      })
    );

    const filtered = status
      ? driversWithProfiles.filter((d) => d.profile?.verificationStatus === status)
      : driversWithProfiles;

    res.json({ success: true, drivers: filtered });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get driver details
// @route   GET /api/admin/drivers/:id
// @access  Private (Admin)
const getDriverDetails = async (req, res) => {
  try {
    const driver = await User.findById(req.params.id).select('-password');
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found.' });

    const profile = await DriverProfile.findOne({ userId: driver._id });
    const trips = await Trip.find({ driverId: driver._id });

    res.json({ success: true, driver, profile, trips });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify or reject driver
// @route   PUT /api/admin/verify-driver/:id
// @access  Private (Admin)
const verifyDriver = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const profile = await DriverProfile.findOneAndUpdate(
      { userId: req.params.id },
      { verificationStatus: status, rejectionReason: rejectionReason || null },
      { new: true }
    );

    if (!profile) return res.status(404).json({ success: false, message: 'Driver profile not found.' });

    // Update user isVerified flag
    await User.findByIdAndUpdate(req.params.id, { isVerified: status === 'approved' });

    res.json({
      success: true,
      message: `Driver ${status === 'approved' ? 'verified' : 'rejected'} successfully.`,
      profile,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all trips
// @route   GET /api/admin/trips
// @access  Private (Admin)
const getAllTrips = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const trips = await Trip.find(filter)
      .populate('driverId', 'name phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, trips });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve or reject trip
// @route   PUT /api/admin/trips/:id/status
// @access  Private (Admin)
const updateTripStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const trip = await Trip.findByIdAndUpdate(
      req.params.id,
      { status, rejectionReason: rejectionReason || null },
      { new: true }
    ).populate('driverId', 'name phone');

    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });

    res.json({ success: true, message: `Trip ${status}.`, trip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all bookings
// @route   GET /api/admin/bookings
// @access  Private (Admin)
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate({ path: 'tripId', populate: { path: 'driverId', select: 'name phone' } })
      .populate('customerId', 'name phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all customers
// @route   GET /api/admin/customers
// @access  Private (Admin)
const getAllCustomers = async (req, res) => {
  try {
    const customers = await User.find({ role: 'customer' }).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle user active status
// @route   PUT /api/admin/users/:id/toggle
// @access  Private (Admin)
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot modify admin.' });

    user.isActive = !user.isActive;
    await user.save();

    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}.`, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalDrivers,
      pendingDrivers,
      approvedDrivers,
      totalCustomers,
      totalTrips,
      pendingTrips,
      approvedTrips,
      totalBookings,
      deliveredBookings,
    ] = await Promise.all([
      User.countDocuments({ role: 'driver' }),
      DriverProfile.countDocuments({ verificationStatus: 'pending' }),
      DriverProfile.countDocuments({ verificationStatus: 'approved' }),
      User.countDocuments({ role: 'customer' }),
      Trip.countDocuments(),
      Trip.countDocuments({ status: 'pending' }),
      Trip.countDocuments({ status: 'approved' }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'delivered' }),
    ]);

    const revenueData = await Booking.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.json({
      success: true,
      stats: {
        drivers: { total: totalDrivers, pending: pendingDrivers, approved: approvedDrivers },
        customers: { total: totalCustomers },
        trips: { total: totalTrips, pending: pendingTrips, approved: approvedTrips },
        bookings: { total: totalBookings, delivered: deliveredBookings },
        revenue: revenueData[0]?.total || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllDrivers,
  getDriverDetails,
  verifyDriver,
  getAllTrips,
  updateTripStatus,
  getAllBookings,
  getAllCustomers,
  toggleUserStatus,
  getDashboardStats,
};
