const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  uploadDocs,
  getProfile,
  createTrip,
  getMyTrips,
  updateTripStatus,
  getTripBookings,
  updateBookingStatus,
  getEarnings,
} = require('../controllers/driverController');

const docUpload = upload.fields([
  { name: 'aadhaar', maxCount: 1 },
  { name: 'license', maxCount: 1 },
  { name: 'vehicleImage', maxCount: 1 },
  { name: 'selfie', maxCount: 1 },
]);

router.use(protect, authorize('driver'));

router.get('/profile', getProfile);
router.post('/upload-docs', docUpload, uploadDocs);
router.post('/create-trip', createTrip);
router.get('/trips', getMyTrips);
router.put('/trips/:id/status', updateTripStatus);
router.get('/bookings', getTripBookings);
router.put('/booking/:id/status', updateBookingStatus);
router.get('/earnings', getEarnings);

module.exports = router;
