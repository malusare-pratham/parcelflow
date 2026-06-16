const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_TTL || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_TTL || '7d';
const REFRESH_COOKIE_NAME = 'pf_refresh';
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set on the server.');
  }
  return process.env.JWT_SECRET;
};

const getRefreshSecret = () => process.env.JWT_REFRESH_SECRET || getJwtSecret();

const signAccessToken = (id) =>
  jwt.sign({ id, type: 'access' }, getJwtSecret(), { expiresIn: ACCESS_TOKEN_EXPIRES_IN });

const signRefreshToken = (id) =>
  jwt.sign({ id, type: 'refresh' }, getRefreshSecret(), { expiresIn: REFRESH_TOKEN_EXPIRES_IN });

const verifyRefreshToken = (token) => jwt.verify(token, getRefreshSecret());

const getCookieOptions = () => {
  const isProduction = (process.env.NODE_ENV || 'development') === 'production';
  return {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : isProduction,
    sameSite: process.env.COOKIE_SAMESITE || (isProduction ? 'none' : 'lax'),
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    path: '/api/auth',
  };
};

const setRefreshCookie = (res, token) => {
  res.cookie(REFRESH_COOKIE_NAME, token, getCookieOptions());
};

const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, { ...getCookieOptions(), maxAge: undefined });
};

module.exports = {
  REFRESH_COOKIE_NAME,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
};
