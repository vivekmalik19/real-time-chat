const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 2,
      maxlength: 50
    },
    description: {
      type: String,
      trim: true,
      maxlength: 200,
      default: ''
    },
    isPrivate: {
      type: Boolean,
      default: false
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Channel', channelSchema);
