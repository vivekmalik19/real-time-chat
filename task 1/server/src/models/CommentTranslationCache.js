import mongoose from 'mongoose';

const commentTranslationCacheSchema = new mongoose.Schema(
  {
    commentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      required: true,
      index: true,
    },
    sourceHash: {
      type: String,
      required: true,
      index: true,
    },
    sourceLanguage: {
      type: String,
      default: 'auto',
    },
    targetLanguage: {
      type: String,
      required: true,
    },
    translatedText: {
      type: String,
      required: true,
    },
    detectedLanguage: {
      type: String,
      default: null,
    },
    provider: {
      type: String,
      default: 'mymemory',
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index so we don't duplicate identical translations
commentTranslationCacheSchema.index(
  { commentId: 1, targetLanguage: 1, sourceHash: 1 },
  { unique: true }
);

export const CommentTranslationCache = mongoose.model(
  'CommentTranslationCache',
  commentTranslationCacheSchema
);

export default CommentTranslationCache;
