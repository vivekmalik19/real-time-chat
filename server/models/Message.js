const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel',
      default: null,
      index: true
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    content: {
      type: String,
      trim: true,
      default: ''
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'file', 'system'],
      default: 'text'
    },
    attachment: {
      url: { type: String, default: '' },
      filename: { type: String, default: '' },
      fileType: { type: String, default: '' },
      fileSize: { type: Number, default: 0 }
    },
    reactions: [
      {
        emoji: { type: String, required: true },
        users: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
          }
        ]
      }
    ],
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Compound index for efficient DM fetching
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, sender: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
