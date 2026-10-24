import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    city: { type: String, default: null },
    region: { type: String, default: null },
    country: { type: String, default: null },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    timezone: { type: String, default: null },
  },
  { _id: false }
);

const loginHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    userAgent: {
      type: String,
      default: 'Unknown User-Agent',
    },
    browser: {
      type: String,
      default: 'Unknown Browser',
    },
    os: {
      type: String,
      default: 'Unknown OS',
    },
    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      default: 'desktop',
    },
    deviceId: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'OTP_REQUIRED', 'FAILED', 'REVOKED'],
      default: 'SUCCESS',
      index: true,
    },
    isTrustedDevice: {
      type: Boolean,
      default: false,
    },
    sessionRevoked: {
      type: Boolean,
      default: false,
    },
    location: {
      type: locationSchema,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying a user's recent logins
loginHistorySchema.index({ userId: 1, timestamp: -1 });

export const LoginHistory = mongoose.model('LoginHistory', loginHistorySchema);
export default LoginHistory;
