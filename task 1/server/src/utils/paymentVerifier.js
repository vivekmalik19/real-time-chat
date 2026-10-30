import crypto from 'crypto';

export const RAZORPAY_TEST_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_meetflow2026';
export const RAZORPAY_TEST_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_meetflow2026_test';

// Plan pricing in INR (Indian Rupees)
export const PLAN_PRICING = {
  bronze: { amount: 19900, currency: 'INR', name: 'Bronze Plan' }, // 199.00 INR
  silver: { amount: 49900, currency: 'INR', name: 'Silver Plan' }, // 499.00 INR
  gold: { amount: 99900, currency: 'INR', name: 'Gold Plan' }, // 999.00 INR
};

/**
 * Generates an HMAC-SHA256 signature for test/simulation
 */
export function generateRazorpaySignature(orderId, paymentId, secret = RAZORPAY_TEST_KEY_SECRET) {
  return crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
}

/**
 * Validates Razorpay signature using constant-time comparison
 */
export function verifyRazorpaySignature(orderId, paymentId, signature, secret = RAZORPAY_TEST_KEY_SECRET) {
  if (!orderId || !paymentId || !signature) return false;

  const expectedSignature = generateRazorpaySignature(orderId, paymentId, secret);

  try {
    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const actualBuf = Buffer.from(signature, 'utf8');

    if (expectedBuf.length !== actualBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  } catch {
    return false;
  }
}
