import mongoose from 'mongoose';

const videoProgressSchema = new mongoose.Schema(
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
    currentTime: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    duration: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    completed: {
      type: Boolean,
      default: false,
      index: true,
    },
    lastWatched: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring one progress record per user per video
videoProgressSchema.index({ userId: 1, videoId: 1 }, { unique: true });

const VideoProgress = mongoose.model('VideoProgress', videoProgressSchema);

export default VideoProgress;
