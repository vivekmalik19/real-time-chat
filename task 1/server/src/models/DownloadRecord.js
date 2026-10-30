import mongoose from 'mongoose';

const downloadRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    videoId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    videoTitle: {
      type: String,
      required: true,
      trim: true,
    },
    videoThumbnail: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: 'General',
    },
    quality: {
      type: String,
      default: '720p HD',
    },
    status: {
      type: String,
      enum: ['pending', 'authorized', 'completed', 'failed', 'interrupted'],
      default: 'pending',
      index: true,
    },
    planSnapshot: {
      plan: { type: String, required: true },
      dailyLimit: { type: Number, required: true },
      monthlyLimit: { type: Number, required: true },
    },
    fileSize: {
      type: Number,
      default: 0, // bytes
    },
    fileSizeFormatted: {
      type: String,
      default: 'Unknown size',
    },
    mimeType: {
      type: String,
      default: 'video/mp4',
    },
    requestId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    downloadToken: {
      type: String,
      index: true,
    },
    tokenExpiresAt: {
      type: Date,
      index: true,
    },
    initiatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    failedReason: {
      type: String,
      default: null,
    },
    countsTowardsQuota: {
      type: Boolean,
      default: true,
      index: true,
    },
    isDeduplicated: {
      type: Boolean,
      default: false,
    },
    audit: {
      ip: { type: String, default: '127.0.0.1' },
      userAgent: { type: String, default: 'Unknown' },
      deviceType: { type: String, default: 'desktop' },
      browser: { type: String, default: 'Unknown' },
      os: { type: String, default: 'Unknown' },
      deviceId: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast quota and deduplication checks
downloadRecordSchema.index({ userId: 1, videoId: 1, initiatedAt: -1 });
downloadRecordSchema.index({ userId: 1, countsTowardsQuota: 1, initiatedAt: -1 });

export const DownloadRecord = mongoose.model('DownloadRecord', downloadRecordSchema);
export default DownloadRecord;
