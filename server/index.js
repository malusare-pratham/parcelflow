const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
// Always load env from the server folder (robust even if started from repo root)
require('dotenv').config({ path: path.join(__dirname, '.env') });

const authRoutes = require('./routes/auth');
const driverRoutes = require('./routes/driver');
const customerRoutes = require('./routes/customer');
const adminRoutes = require('./routes/admin');

const app = express();

// Middleware
const allowedOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const tryParseUrl = (value) => {
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

const isOriginAllowed = (origin) => {
  if (!origin) return true;

  // In dev, allow any origin to avoid Vite port / LAN IP headaches.
  if ((process.env.NODE_ENV || 'development') !== 'production') return true;

  if (!allowedOrigins.length) return false;
  if (allowedOrigins.includes(origin)) return true;

  const parsed = tryParseUrl(origin);
  if (!parsed) return false;

  const host = parsed.hostname;
  return allowedOrigins.some((entry) => {
    if (!entry) return false;
    if (entry === origin) return true;

    // Support wildcard hostnames like "*.vercel.app" in CLIENT_URLS.
    if (entry.startsWith('*.')) {
      const suffix = entry.slice(1); // ".vercel.app"
      return host.endsWith(suffix);
    }

    // Support bare hostnames like "example.com" in CLIENT_URLS.
    if (!entry.startsWith('http://') && !entry.startsWith('https://')) {
      return host === entry;
    }

    return false;
  });
};

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow non-browser tools (curl/postman) and same-origin.
      if (!origin) return cb(null, true);

      if (isOriginAllowed(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ParcelFlow API running' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!mongoUri) {
  console.error(
    '❌ Missing MongoDB URI. Set MONGO_URI in server/.env (copy from server/.env.example).'
  );
  process.exit(1);
}

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
