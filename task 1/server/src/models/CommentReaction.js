import mongoose from 'mongoose';

const commentReactionSchema = new mongoose.Schema(
  {
    commentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['like', 'dislike'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index prevents multiple reactions from same user
commentReactionSchema.index({ commentId: 1, userId: 1 }, { unique: true });

export const CommentReaction = mongoose.model('CommentReaction', commentReactionSchema);
export default CommentReaction;
