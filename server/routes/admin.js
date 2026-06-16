const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { idParamSchema, adminDriverVerifySchema, adminTripStatusSchema } = require('../validation/schemas');
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
router.get('/drivers/:id', validate(idParamSchema, 'params'), getDriverDetails);
router.put('/verify-driver/:id', validate(idParamSchema, 'params'), validate(adminDriverVerifySchema), verifyDriver);
router.get('/trips', getAllTrips);
router.put('/trips/:id/status', validate(idParamSchema, 'params'), validate(adminTripStatusSchema), updateTripStatus);
router.get('/bookings', getAllBookings);
router.get('/customers', getAllCustomers);
router.put('/users/:id/toggle', validate(idParamSchema, 'params'), toggleUserStatus);

module.exports = router;
