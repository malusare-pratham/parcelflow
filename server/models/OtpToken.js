const mongoose = require('mongoose');

const otpTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    purpose: {
      type: String,
      enum: ['phone-verification'],
      default: 'phone-verification',
    },
    codeHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    consumedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

otpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpTokenSchema.index({ userId: 1, purpose: 1, consumedAt: 1, createdAt: -1 });

module.exports = mongoose.model('OtpToken', otpTokenSchema);
