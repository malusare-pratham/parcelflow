const express = require('express');
const router = express.Router();
const {
  register,
  login,
  refresh,
  logout,
  getMe,
  requestPhoneOtp,
  verifyPhoneOtp,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { authLimiter, registerLimiter, otpLimiter } = require('../middleware/rateLimits');
const { registerSchema, loginSchema, verifyOtpSchema } = require('../validation/schemas');

router.post('/register', registerLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.post('/phone/request-otp', protect, otpLimiter, requestPhoneOtp);
router.post('/phone/verify-otp', protect, otpLimiter, validate(verifyOtpSchema), verifyPhoneOtp);

module.exports = router;
