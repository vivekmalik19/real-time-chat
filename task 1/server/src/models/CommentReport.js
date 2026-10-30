import mongoose from 'mongoose';
import { REPORT_REASONS } from '../config/commentRules.js';

const commentReportSchema = new mongoose.Schema(
  {
    commentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      required: true,
      index: true,
    },
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reason: {
      type: String,
      enum: REPORT_REASONS,
      required: [true, 'Please specify a report reason'],
    },
    details: {
      type: String,
      maxlength: 500,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'dismissed', 'action_taken'],
      default: 'pending',
      index: true,
    },
    actionTaken: {
      type: String,
      enum: ['none', 'approved', 'hidden', 'deleted', 'warned'],
      default: 'none',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: prevents duplicate reports from the same user for the same comment
commentReportSchema.index({ commentId: 1, reporterId: 1 }, { unique: true });

export const CommentReport = mongoose.model('CommentReport', commentReportSchema);
export default CommentReport;
