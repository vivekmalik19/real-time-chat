import mongoose from 'mongoose';
import { EDIT_TIME_LIMIT_MINUTES, MODERATION_STATUSES } from '../config/commentRules.js';

const commentSchema = new mongoose.Schema(
  {
    videoId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
    },
    authorAvatar: {
      type: String,
      default: null,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
      index: true,
    },
    replyCount: {
      type: Number,
      default: 0,
    },
    content: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    originalLanguage: {
      type: String,
      default: 'auto',
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    // User location: ONLY if user explicitly consented / supplied location
    location: {
      type: String,
      default: null,
    },
    mentions: [
      {
        type: String,
        trim: true,
      },
    ],
    likeCount: {
      type: Number,
      default: 0,
    },
    dislikeCount: {
      type: Number,
      default: 0,
    },
    moderationStatus: {
      type: String,
      enum: Object.values(MODERATION_STATUSES),
      default: MODERATION_STATUSES.APPROVED,
      index: true,
    },
    reportCount: {
      type: Number,
      default: 0,
    },
    lastReportedAt: {
      type: Date,
      default: null,
    },
    contentFingerprint: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast feed querying and sorting
commentSchema.index({ videoId: 1, parentId: 1, createdAt: -1 });
commentSchema.index({ videoId: 1, parentId: 1, likeCount: -1 });
commentSchema.index({ authorId: 1, videoId: 1, createdAt: -1 });

/**
 * Checks if comment can still be edited (within configured time limit)
 */
commentSchema.methods.isEditable = function () {
  if (this.isDeleted) return false;
  const elapsedMinutes = (Date.now() - new Date(this.createdAt).getTime()) / (1000 * 60);
  return elapsedMinutes <= EDIT_TIME_LIMIT_MINUTES;
};

/**
 * Serializes comment for client delivery
 */
commentSchema.methods.toSafeClient = function (userReaction = null, isModerator = false) {
  // If deleted and has replies, show placeholder so child thread remains unbroken
  if (this.isDeleted) {
    return {
      id: this._id,
      videoId: this.videoId,
      parentId: this.parentId,
      authorId: null,
      authorName: '[Deleted User]',
      authorAvatar: null,
      content: '[This comment has been deleted by the author]',
      location: null,
      mentions: [],
      isEdited: false,
      editedAt: null,
      isDeleted: true,
      deletedAt: this.deletedAt,
      replyCount: this.replyCount,
      likeCount: 0,
      dislikeCount: 0,
      userReaction: null,
      createdAt: this.createdAt,
      canEdit: false,
      canDelete: false,
      moderationStatus: this.moderationStatus,
    };
  }

  // If hidden by moderator and viewing user is not a moderator
  if (this.moderationStatus === MODERATION_STATUSES.HIDDEN && !isModerator) {
    return {
      id: this._id,
      videoId: this.videoId,
      parentId: this.parentId,
      authorId: null,
      authorName: '[Moderated]',
      authorAvatar: null,
      content: '[This comment has been hidden by moderators for community guideline violations]',
      location: null,
      mentions: [],
      isEdited: false,
      isDeleted: false,
      replyCount: this.replyCount,
      likeCount: 0,
      dislikeCount: 0,
      userReaction: null,
      createdAt: this.createdAt,
      canEdit: false,
      canDelete: false,
      moderationStatus: this.moderationStatus,
    };
  }

  return {
    id: this._id,
    videoId: this.videoId,
    parentId: this.parentId,
    authorId: this.authorId,
    authorName: this.authorName,
    authorAvatar: this.authorAvatar,
    content: this.content,
    originalLanguage: this.originalLanguage,
    // Location is only returned if explicitly stored (never inferred)
    location: this.location || null,
    mentions: this.mentions || [],
    isEdited: this.isEdited,
    editedAt: this.editedAt,
    isDeleted: false,
    replyCount: this.replyCount,
    likeCount: Math.max(0, this.likeCount),
    dislikeCount: Math.max(0, this.dislikeCount),
    userReaction, // 'like' | 'dislike' | null
    canEdit: this.isEditable(),
    moderationStatus: this.moderationStatus,
    reportCount: isModerator ? this.reportCount : undefined,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const Comment = mongoose.model('Comment', commentSchema);
export default Comment;
