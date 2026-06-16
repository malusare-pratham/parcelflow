const User = require('../models/User');
const DriverProfile = require('../models/DriverProfile');
const OtpToken = require('../models/OtpToken');
const {
  REFRESH_COOKIE_NAME,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
} = require('../utils/tokens');
const { generateOtpCode, hashOtp } = require('../utils/otp');

const MAX_FAILED_LOGIN_ATTEMPTS = Number(process.env.MAX_FAILED_LOGIN_ATTEMPTS || 5);
const LOGIN_LOCK_MINUTES = Number(process.env.LOGIN_LOCK_MINUTES || 15);
const OTP_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES || 10);

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  phone: user.phone,
  email: user.email,
  role: user.role,
  isVerified: user.isVerified,
  phoneVerified: !!user.phoneVerified,
});

const issueAuthSession = (res, user) => {
  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);
  setRefreshCookie(res, refreshToken);
  return accessToken;
};

const normalizeOptionalEmail = (email) => {
  if (!email) return undefined;
  const trimmed = String(email).trim();
  return trimmed ? trimmed : undefined;
};

const recordFailedLogin = async (user) => {
  const attempts = (user.failedLoginAttempts || 0) + 1;
  const update = { failedLoginAttempts: attempts };

  if (attempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
    update.lockUntil = new Date(Date.now() + LOGIN_LOCK_MINUTES * 60 * 1000);
  }

  await User.updateOne({ _id: user._id }, { $set: update });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, phone, email, password, role } = req.body;

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Phone number already registered.' });
    }

    const user = await User.create({
      name,
      phone,
      email: normalizeOptionalEmail(email),
      password,
      role: role || 'customer',
    });

    if (user.role === 'driver') {
      await DriverProfile.create({ userId: user._id });
    }

    const accessToken = issueAuthSession(res, user);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      accessToken,
      user: publicUser(user),
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Phone number already registered.',
      });
    }

    if (error?.name === 'ValidationError') {
      const first = Object.values(error.errors || {})[0];
      return res.status(400).json({
        success: false,
        message: first?.message || 'Invalid input.',
      });
    }

    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      return res.status(429).json({
        success: false,
        message: 'Account temporarily locked due to failed login attempts. Please try again later.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await recordFailedLogin(user);
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact support.' });
    }

    const accessToken = issueAuthSession(res, user);

    res.json({
      success: true,
      message: 'Login successful',
      accessToken,
      user: publicUser(user),
    });

    User.updateOne(
      { _id: user._id },
      { $set: { failedLoginAttempts: 0, lockUntil: null, lastLoginAt: new Date() } }
    ).catch((err) => console.error('Login metadata update failed:', err.message));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Refresh short-lived access token from HttpOnly refresh cookie
// @route   POST /api/auth/refresh
// @access  Public (cookie)
const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh session missing.' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ success: false, message: 'Invalid refresh session.' });
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      clearRefreshCookie(res);
      return res.status(401).json({ success: false, message: 'Session expired.' });
    }

    const accessToken = issueAuthSession(res, user);
    res.json({ success: true, accessToken, user: publicUser(user) });
  } catch (error) {
    clearRefreshCookie(res);
    res.status(401).json({ success: false, message: 'Session expired.' });
  }
};

// @desc    Logout and clear refresh cookie
// @route   POST /api/auth/logout
// @access  Public
const logout = async (req, res) => {
  clearRefreshCookie(res);
  res.json({ success: true, message: 'Logged out.' });
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ success: true, user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate OTP for authenticated user's phone
// @route   POST /api/auth/phone/request-otp
// @access  Private
const requestPhoneOtp = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.phoneVerified) {
      return res.json({ success: true, message: 'Phone already verified.' });
    }

    const code = generateOtpCode();
    await OtpToken.updateMany(
      { userId: user._id, purpose: 'phone-verification', consumedAt: null },
      { $set: { consumedAt: new Date() } }
    );
    await OtpToken.create({
      userId: user._id,
      phone: user.phone,
      purpose: 'phone-verification',
      codeHash: hashOtp(user.phone, code),
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
    });

    const response = {
      success: true,
      message: 'OTP generated for phone verification.',
    };

    // Wire an SMS provider here before production. Dev response keeps local testing possible.
    if ((process.env.NODE_ENV || 'development') !== 'production' || process.env.OTP_DEBUG_RESPONSE === 'true') {
      response.devOtp = code;
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify authenticated user's phone OTP
// @route   POST /api/auth/phone/verify-otp
// @access  Private
const verifyPhoneOtp = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const otp = await OtpToken.findOne({
      userId: user._id,
      phone: user.phone,
      purpose: 'phone-verification',
      consumedAt: null,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otp) {
      return res.status(400).json({ success: false, message: 'OTP expired or not requested.' });
    }

    if (otp.attempts >= 5) {
      return res.status(429).json({ success: false, message: 'Too many OTP attempts. Request a new OTP.' });
    }

    const expectedHash = hashOtp(user.phone, req.body.code);
    if (otp.codeHash !== expectedHash) {
      otp.attempts += 1;
      await otp.save();
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }

    otp.consumedAt = new Date();
    await otp.save();

    user.phoneVerified = true;
    await user.save();

    res.json({ success: true, message: 'Phone verified.', user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
  requestPhoneOtp,
  verifyPhoneOtp,
};
