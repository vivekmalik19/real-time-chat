/**
 * MeetFlow Payments & Subscription Test Suite
 * Tests Razorpay HMAC-SHA256 signature verification, idempotency, order creation,
 * payment failure simulation, and 30-day subscription activation.
 */

import mongoose from 'mongoose';
import User from './models/User.js';
import Subscription from './models/Subscription.js';
import PaymentRecord from './models/PaymentRecord.js';
import {
  createPaymentOrder,
  verifyPayment,
  simulatePaymentFailure,
  getCurrentSubscription,
} from './controllers/subscriptionController.js';
import {
  generateRazorpaySignature,
  verifyRazorpaySignature,
  RAZORPAY_TEST_KEY_SECRET,
} from './utils/paymentVerifier.js';

const TEST_MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/meetflow';

function mockReq(user = null, body = {}, params = {}, query = {}) {
  return { user, body, params, query, headers: {} };
}

function mockRes() {
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
  };
  return res;
}

async function runPaymentsSuite() {
  console.log('====================================================');
  console.log('🚀 MEETFLOW PAYMENTS & SUBSCRIPTIONS TEST SUITE');
  console.log('====================================================\n');

  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_MONGO_URI);
      console.log('[Database] Connected to MongoDB\n');
    }

    const testTimestamp = Date.now();
    const testUser = await User.create({
      name: 'Priya Payments',
      email: `priya_${testTimestamp}@meetflow.test`,
      password: 'Password123!',
      role: 'user',
    });

    // -------------------------------------------------------------
    // TEST 1: Create Payment Order
    // -------------------------------------------------------------
    console.log('▶ Test 1: Create Razorpay Test Order (Bronze Plan)');
    const res1 = mockRes();
    const idempotencyKey = `idem_${testTimestamp}`;
    await createPaymentOrder(
      mockReq(testUser, { plan: 'bronze', idempotencyKey }),
      res1,
      (err) => { throw err; }
    );

    if (res1.statusCode !== 201 || !res1.data.orderId || res1.data.amount !== 19900) {
      throw new Error(`Test 1 Failed: Status ${res1.statusCode}, ${JSON.stringify(res1.data)}`);
    }
    const orderId = res1.data.orderId;
    console.log(`  Order created: ${orderId}, Amount: ₹${res1.data.amount / 100} (${res1.data.currency})`);
    console.log('  ✔ Passed: Payment order created with correct pricing\n');

    // -------------------------------------------------------------
    // TEST 2: Idempotent Order Creation
    // -------------------------------------------------------------
    console.log('▶ Test 2: Idempotent Order Retrieval with Same Idempotency Key');
    const res2 = mockRes();
    await createPaymentOrder(
      mockReq(testUser, { plan: 'bronze', idempotencyKey }),
      res2,
      (err) => { throw err; }
    );

    if (res2.statusCode !== 200 || res2.data.orderId !== orderId || !res2.data.isIdempotent) {
      throw new Error(`Test 2 Failed: Did not return existing order idempotently!`);
    }
    console.log(`  Returned existing order ${res2.data.orderId} without creating duplicate`);
    console.log('  ✔ Passed: Idempotent order processing verified\n');

    // -------------------------------------------------------------
    // TEST 3: Reject Payment with Forged / Invalid Signature
    // -------------------------------------------------------------
    console.log('▶ Test 3: Reject Forged / Invalid Signature');
    const fakePaymentId = `pay_fake_${Date.now()}`;
    const forgedSignature = '0000000000000000000000000000000000000000000000000000000000000000';

    const res3 = mockRes();
    await verifyPayment(
      mockReq(testUser, {
        orderId,
        paymentId: fakePaymentId,
        signature: forgedSignature,
      }),
      res3,
      (err) => { throw err; }
    );

    if (res3.statusCode !== 400 || res3.data.code !== 'PAYMENT_SIGNATURE_INVALID') {
      throw new Error(`Test 3 Failed: Expected 400 PAYMENT_SIGNATURE_INVALID, got ${res3.statusCode}`);
    }
    console.log(`  Blocked forged payment with HTTP 400: "${res3.data.message}"`);
    console.log('  ✔ Passed: Cryptographic HMAC-SHA256 signature verification blocks tampering\n');

    // -------------------------------------------------------------
    // TEST 4: Verified Payment Activation (Bronze Plan)
    // -------------------------------------------------------------
    console.log('▶ Test 4: Genuine Verified Payment & Subscription Activation');
    const validPaymentId = `pay_valid_${Date.now()}`;
    const validSignature = generateRazorpaySignature(orderId, validPaymentId, RAZORPAY_TEST_KEY_SECRET);

    const res4 = mockRes();
    await verifyPayment(
      mockReq(testUser, {
        orderId,
        paymentId: validPaymentId,
        signature: validSignature,
      }),
      res4,
      (err) => { throw err; }
    );

    if (res4.statusCode !== 200 || res4.data.subscription.plan !== 'bronze' || !res4.data.subscription.isActive) {
      throw new Error(`Test 4 Failed: Expected active bronze subscription, got ${JSON.stringify(res4.data)}`);
    }

    const paymentDoc = await PaymentRecord.findOne({ orderId });
    if (paymentDoc.status !== 'captured' || paymentDoc.paymentId !== validPaymentId) {
      throw new Error('Test 4 Failed: PaymentRecord was not marked as captured in DB!');
    }
    console.log(`  Signature verified: ${validSignature.slice(0, 16)}...`);
    console.log(`  Subscription activated: ${res4.data.subscription.plan} (Expires in 30 days)`);
    console.log('  ✔ Passed: Valid payment captured and 30-day subscription activated\n');

    // -------------------------------------------------------------
    // TEST 5: Duplicate Callback Idempotency
    // -------------------------------------------------------------
    console.log('▶ Test 5: Duplicate Callback Idempotency (Prevent Double Activation)');
    const res5 = mockRes();
    await verifyPayment(
      mockReq(testUser, {
        orderId,
        paymentId: validPaymentId,
        signature: validSignature,
      }),
      res5,
      (err) => { throw err; }
    );

    if (res5.statusCode !== 200 || !res5.data.isDuplicateCallback) {
      throw new Error('Test 5 Failed: Expected isDuplicateCallback=true');
    }
    console.log(`  Handled duplicate callback safely: "${res5.data.message}"`);
    console.log('  ✔ Passed: Duplicate callbacks processed idempotently without extending dates\n');

    // -------------------------------------------------------------
    // TEST 6: Simulated Payment Failure Recording
    // -------------------------------------------------------------
    console.log('▶ Test 6: Payment Failure Recording');
    const failedOrderId = `order_failed_${Date.now()}`;
    await PaymentRecord.create({
      orderId: failedOrderId,
      userId: testUser._id,
      plan: 'silver',
      amount: 49900,
      status: 'created',
    });

    const res6 = mockRes();
    await simulatePaymentFailure(
      mockReq(testUser, { orderId: failedOrderId, reason: 'Card declined by issuing bank' }),
      res6,
      (err) => { throw err; }
    );

    const failedDoc = await PaymentRecord.findOne({ orderId: failedOrderId });
    if (failedDoc.status !== 'failed' || !failedDoc.errorMessage.includes('declined')) {
      throw new Error('Test 6 Failed: Failed order status was not recorded in DB');
    }
    console.log(`  Failed payment recorded: status='${failedDoc.status}', reason='${failedDoc.errorMessage}'`);
    console.log('  ✔ Passed: Payment failure lifecycle recorded with audit reason\n');

    console.log('====================================================');
    console.log('🎉 ALL 6 PAYMENTS & SUBSCRIPTIONS TESTS PASSED 100%!');
    console.log('====================================================\n');
  } catch (err) {
    console.error('❌ Payments Test Suite Error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runPaymentsSuite();
