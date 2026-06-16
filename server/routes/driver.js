const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const { uploadLimiter } = require('../middleware/rateLimits');
const {
  createTripSchema,
  uploadDocsSchema,
  driverTripStatusSchema,
  bookingStatusSchema,
  bookingDecisionSchema,
  idParamSchema,
} = require('../validation/schemas');
const {
  uploadDocs,
  getProfile,
  createTrip,
  getMyTrips,
  updateTripStatus,
  getTripBookings,
  updateBookingStatus,
  decideBookingRequest,
  getEarnings,
} = require('../controllers/driverController');

const docUpload = upload.fields([
  { name: 'aadhaar', maxCount: 1 },
  { name: 'license', maxCount: 1 },
  { name: 'vehicleRC', maxCount: 1 },
  { name: 'vehicleInsurance', maxCount: 1 },
  { name: 'pucCertificate', maxCount: 1 },
  { name: 'vehicleImage', maxCount: 1 },
  { name: 'selfie', maxCount: 1 },
]);

router.use(protect, authorize('driver'));

router.get('/profile', getProfile);
router.post('/upload-docs', uploadLimiter, docUpload, validate(uploadDocsSchema), uploadDocs);
router.post('/create-trip', validate(createTripSchema), createTrip);
router.get('/trips', getMyTrips);
router.put('/trips/:id/status', validate(idParamSchema, 'params'), validate(driverTripStatusSchema), updateTripStatus);
router.get('/bookings', getTripBookings);
router.put('/booking/:id/decision', validate(idParamSchema, 'params'), validate(bookingDecisionSchema), decideBookingRequest);
router.put('/booking/:id/status', validate(idParamSchema, 'params'), validate(bookingStatusSchema), updateBookingStatus);
router.get('/earnings', getEarnings);

module.exports = router;
