const crypto = require('crypto');

const hashOtp = (phone, code) => {
  const secret = process.env.JWT_SECRET || 'parcelflow-dev-secret';
  return crypto.createHmac('sha256', secret).update(`${phone}:${code}`).digest('hex');
};

const generateOtpCode = () => String(crypto.randomInt(100000, 999999));

module.exports = { generateOtpCode, hashOtp };
