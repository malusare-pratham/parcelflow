const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const { bookingLimiter } = require('../middleware/rateLimits');
const { tripSearchSchema, cancelBookingSchema, idParamSchema } = require('../validation/schemas');
const { getTrips, getTripById, createBooking, getMyBookings, cancelBooking } = require('../controllers/customerController');

// Public routes
router.get('/trips', validate(tripSearchSchema, 'query'), getTrips);
router.get('/trips/:id', validate(idParamSchema, 'params'), getTripById);

// Protected customer routes
router.post('/bookings', bookingLimiter, protect, authorize('customer'), upload.array('parcelImages', 5), createBooking);
router.get('/bookings/my', protect, authorize('customer'), getMyBookings);
router.put('/bookings/:id/cancel', protect, authorize('customer'), validate(idParamSchema, 'params'), validate(cancelBookingSchema), cancelBooking);

module.exports = router;
