const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 2,
      maxlength: 30
    },
    email: {
      type: String,
      sparse: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      minlength: 4
    },
    avatar: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['online', 'away', 'busy', 'offline'],
      default: 'online'
    },
    customStatus: {
      type: String,
      maxlength: 100,
      default: ''
    },
    isGuest: {
      type: Boolean,
      default: false
    },
    lastSeen: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// Return safe user object without password
userSchema.methods.toSafeObject = function () {
  return {
    _id: this._id,
    id: this._id,
    username: this.username,
    email: this.email,
    avatar: this.avatar,
    status: this.status,
    customStatus: this.customStatus,
    isGuest: this.isGuest,
    lastSeen: this.lastSeen,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('User', userSchema);
