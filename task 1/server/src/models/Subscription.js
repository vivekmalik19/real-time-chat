import mongoose from 'mongoose';
import { PLAN_LIMITS } from '../config/downloadPlans.js';

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    plan: {
      type: String,
      enum: ['free', 'bronze', 'silver', 'gold'],
      default: 'free',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'canceled'],
      default: 'active',
      required: true,
      index: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: null, // null indicates lifetime or free tier
      index: true,
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'annual', 'lifetime'],
      default: 'monthly',
    },
    paymentReference: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Checks whether subscription is currently valid and active
 */
subscriptionSchema.methods.isValidActive = function () {
  if (this.status !== 'active') return false;
  if (this.expiresAt && new Date() > this.expiresAt) return false;
  return true;
};

/**
 * Returns effective subscription plan and active state for a user
 * If no subscription record exists, returns a safe default Free Tier
 */
export async function getEffectiveSubscription(userId) {
  let sub;
  try {
    sub = await Subscription.findOneAndUpdate(
      { userId },
      {
        $setOnInsert: {
          userId,
          plan: 'free',
          status: 'active',
          startDate: new Date(),
          expiresAt: null,
          billingCycle: 'lifetime',
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (err) {
    // If duplicate key race condition happened on upsert, fetch the created doc
    if (err.code === 11000) {
      sub = await Subscription.findOne({ userId });
    } else {
      throw err;
    }
  }

  // Check expiration if expiresAt is set
  const isExpired = sub.status === 'expired' || (sub.expiresAt && new Date() > sub.expiresAt);
  const effectiveStatus = isExpired ? 'expired' : sub.status;

  const planConfig = PLAN_LIMITS[sub.plan] || PLAN_LIMITS.free;

  return {
    subscriptionId: sub._id,
    plan: sub.plan,
    status: effectiveStatus,
    isActive: effectiveStatus === 'active',
    isExpired,
    startDate: sub.startDate,
    expiresAt: sub.expiresAt,
    billingCycle: sub.billingCycle,
    paymentReference: sub.paymentReference,
    limits: planConfig,
  };
}

export const Subscription = mongoose.model('Subscription', subscriptionSchema);
export default Subscription;
