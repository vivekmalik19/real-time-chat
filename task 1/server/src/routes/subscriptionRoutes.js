import express from 'express';
import {
  getCurrentSubscription,
  createPaymentOrder,
  verifyPayment,
  simulatePaymentFailure,
  changeSubscriptionPlan,
} from '../controllers/subscriptionController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/current', authenticateToken, getCurrentSubscription);
router.post('/create-order', authenticateToken, createPaymentOrder);
router.post('/verify-payment', authenticateToken, verifyPayment);
router.post('/simulate-failure', authenticateToken, simulatePaymentFailure);
router.post('/change', authenticateToken, changeSubscriptionPlan);

export default router;
