import mongoose from 'mongoose';

const commentModerationLogSchema = new mongoose.Schema(
  {
    commentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      required: true,
      index: true,
    },
    moderatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    moderatorName: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      enum: ['approve', 'hide', 'delete', 'restore', 'dismiss_reports'],
      required: true,
    },
    previousStatus: {
      type: String,
    },
    newStatus: {
      type: String,
    },
    reason: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const CommentModerationLog = mongoose.model(
  'CommentModerationLog',
  commentModerationLogSchema
);
export default CommentModerationLog;
