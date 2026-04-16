const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllDrivers,
  getDriverDetails,
  verifyDriver,
  getAllTrips,
  updateTripStatus,
  getAllBookings,
  getAllCustomers,
  toggleUserStatus,
  getDashboardStats,
} = require('../controllers/adminController');

router.use(protect, authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/drivers', getAllDrivers);
router.get('/drivers/:id', getDriverDetails);
router.put('/verify-driver/:id', verifyDriver);
router.get('/trips', getAllTrips);
router.put('/trips/:id/status', updateTripStatus);
router.get('/bookings', getAllBookings);
router.get('/customers', getAllCustomers);
router.put('/users/:id/toggle', toggleUserStatus);

module.exports = router;
