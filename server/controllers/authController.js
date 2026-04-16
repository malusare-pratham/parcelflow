const jwt = require('jsonwebtoken');
const User = require('../models/User');
const DriverProfile = require('../models/DriverProfile');

const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set on the server.');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, phone, email, password, role } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Name, phone, and password are required.' });
    }

    if (role === 'admin') {
      return res.status(403).json({ success: false, message: 'Admin registration not allowed.' });
    }

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Phone number already registered.' });
    }

    const user = await User.create({ name, phone, email, password, role: role || 'customer' });

    // If driver, create empty profile
    if (user.role === 'driver') {
      await DriverProfile.create({ userId: user._id });
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    // Friendly, consistent errors for common Mongo/Mongoose failures
    if (error?.code === 11000) {
      // Duplicate key (ex: phone unique)
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

    if (!phone || !password) {
      return res.status(400).json({ success: false, message: 'Phone and password are required.' });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact support.' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { register, login, getMe };
