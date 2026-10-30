import Subscription, { getEffectiveSubscription } from '../models/Subscription.js';
import PaymentRecord from '../models/PaymentRecord.js';
import { PLAN_LIMITS } from '../config/downloadPlans.js';
import {
  PLAN_PRICING,
  RAZORPAY_TEST_KEY_ID,
  verifyRazorpaySignature,
  generateRazorpaySignature,
} from '../utils/paymentVerifier.js';

/**
 * Get current active subscription details
 * GET /api/subscription/current
 */
export async function getCurrentSubscription(req, res, next) {
  try {
    const userId = req.user._id;
    const effective = await getEffectiveSubscription(userId);

    res.status(200).json({
      success: true,
      subscription: effective,
      availablePlans: PLAN_LIMITS,
      pricing: PLAN_PRICING,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new payment order (Razorpay Test Mode / Simulated Order)
 * POST /api/subscription/create-order
 */
export async function createPaymentOrder(req, res, next) {
  try {
    const userId = req.user._id;
    const { plan, idempotencyKey = null } = req.body;

    const pricing = PLAN_PRICING[plan];
    if (!pricing) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan selected. Must be bronze, silver, or gold.',
      });
    }

    // Check if idempotent order already exists
    if (idempotencyKey) {
      const existing = await PaymentRecord.findOne({ userId, idempotencyKey });
      if (existing && existing.status === 'created') {
        return res.status(200).json({
          success: true,
          orderId: existing.orderId,
          amount: existing.amount,
          currency: existing.currency,
          plan: existing.plan,
          keyId: RAZORPAY_TEST_KEY_ID,
          isIdempotent: true,
        });
      }
    }

    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const record = await PaymentRecord.create({
      orderId,
      userId,
      plan,
      amount: pricing.amount,
      currency: pricing.currency,
      status: 'created',
      idempotencyKey,
    });

    res.status(201).json({
      success: true,
      orderId: record.orderId,
      amount: record.amount,
      currency: record.currency,
      plan: record.plan,
      keyId: RAZORPAY_TEST_KEY_ID,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Verify Razorpay payment signature and activate subscription idempotently
 * POST /api/subscription/verify-payment
 */
export async function verifyPayment(req, res, next) {
  try {
    const userId = req.user._id;
    const { orderId, paymentId, signature } = req.body;

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({
        success: false,
        message: 'orderId, paymentId, and signature are required for payment verification',
      });
    }

    const paymentRecord = await PaymentRecord.findOne({ orderId, userId });
    if (!paymentRecord) {
      return res.status(404).json({
        success: false,
        message: 'Payment order record not found',
      });
    }

    // Idempotency: If this order has already been captured, return existing success without re-processing
    if (paymentRecord.status === 'captured') {
      const currentSub = await getEffectiveSubscription(userId);
      return res.status(200).json({
        success: true,
        message: 'Payment already processed and verified (idempotent response).',
        isDuplicateCallback: true,
        subscription: currentSub,
      });
    }

    // Verify cryptographic HMAC-SHA256 signature
    const isValidSignature = verifyRazorpaySignature(orderId, paymentId, signature);
    if (!isValidSignature) {
      paymentRecord.status = 'failed';
      paymentRecord.paymentId = paymentId;
      paymentRecord.signature = signature;
      paymentRecord.errorMessage = 'Invalid Razorpay HMAC-SHA256 signature';
      await paymentRecord.save();

      return res.status(400).json({
        success: false,
        code: 'PAYMENT_SIGNATURE_INVALID',
        message: 'Cryptographic signature verification failed. Payment cannot be verified.',
      });
    }

    // Signature verified! Mark payment as captured
    paymentRecord.status = 'captured';
    paymentRecord.paymentId = paymentId;
    paymentRecord.signature = signature;
    await paymentRecord.save();

    // Activate subscription for 30 days
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await Subscription.findOneAndUpdate(
      { userId },
      {
        $set: {
          plan: paymentRecord.plan,
          status: 'active',
          startDate: new Date(),
          expiresAt,
          billingCycle: 'monthly',
          paymentReference: paymentId,
        },
      },
      { upsert: true, new: true }
    );

    const updatedSub = await getEffectiveSubscription(userId);

    res.status(200).json({
      success: true,
      message: `Payment verified successfully! You have upgraded to the ${PLAN_LIMITS[paymentRecord.plan]?.name || paymentRecord.plan}.`,
      subscription: updatedSub,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle simulated payment failure callback
 * POST /api/subscription/simulate-failure
 */
export async function simulatePaymentFailure(req, res, next) {
  try {
    const userId = req.user._id;
    const { orderId, reason = 'User cancelled or transaction declined by bank' } = req.body;

    const paymentRecord = await PaymentRecord.findOne({ orderId, userId });
    if (paymentRecord) {
      paymentRecord.status = 'failed';
      paymentRecord.errorMessage = reason;
      await paymentRecord.save();
    }

    res.status(200).json({
      success: true,
      message: 'Payment failure recorded successfully.',
      status: 'failed',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Change / test subscription plan (Free, Bronze, Silver, Gold, or Expired)
 * POST /api/subscription/change
 */
export async function changeSubscriptionPlan(req, res, next) {
  try {
    const userId = req.user._id;
    const { plan = 'free', status = 'active', expiresInDays = null } = req.body;

    const validPlans = ['free', 'bronze', 'silver', 'gold'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({
        success: false,
        message: `Invalid plan. Must be one of: ${validPlans.join(', ')}`,
      });
    }

    let expiresAt = null;
    if (status === 'expired') {
      expiresAt = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day in past
    } else if (expiresInDays !== null && expiresInDays > 0) {
      expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
    }

    await Subscription.findOneAndUpdate(
      { userId },
      {
        $set: {
          plan,
          status,
          expiresAt,
          startDate: new Date(),
          billingCycle: plan === 'free' ? 'lifetime' : 'monthly',
          paymentReference: plan === 'free' ? null : `TXN_DEMO_${Date.now()}`,
        },
      },
      { upsert: true, new: true }
    );

    const effective = await getEffectiveSubscription(userId);

    res.status(200).json({
      success: true,
      message: `Subscription plan updated to ${PLAN_LIMITS[plan]?.name || plan} (${status}).`,
      subscription: effective,
    });
  } catch (error) {
    next(error);
  }
}
