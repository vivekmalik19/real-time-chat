import mongoose from 'mongoose';

const userDownloadQuotaSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    periodKey: {
      type: String,
      required: true, // e.g. "daily:2026-10-30" or "monthly:2026-10"
      index: true,
    },
    type: {
      type: String,
      enum: ['daily', 'monthly'],
      required: true,
    },
    count: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring atomic reservation per user per period
userDownloadQuotaSchema.index({ userId: 1, periodKey: 1 }, { unique: true });

export const UserDownloadQuota = mongoose.model('UserDownloadQuota', userDownloadQuotaSchema);
export default UserDownloadQuota;
