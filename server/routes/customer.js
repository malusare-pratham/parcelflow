const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getTrips, getTripById, createBooking, getMyBookings, cancelBooking } = require('../controllers/customerController');

// Public routes
router.get('/trips', getTrips);
router.get('/trips/:id', getTripById);

// Protected customer routes
router.post('/bookings', protect, authorize('customer'), createBooking);
router.get('/bookings/my', protect, authorize('customer'), getMyBookings);
router.put('/bookings/:id/cancel', protect, authorize('customer'), cancelBooking);

module.exports = router;
