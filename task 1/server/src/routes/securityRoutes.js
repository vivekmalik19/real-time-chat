import express from 'express';
import {
  getLoginHistory,
  getTrustedDevices,
  revokeDevice,
  revokeAllOtherDevices,
} from '../controllers/securityController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All security routes require authentication
router.use(authenticateToken);

router.get('/history', getLoginHistory);
router.get('/devices', getTrustedDevices);
router.delete('/devices/:deviceId', revokeDevice);
router.delete('/devices', revokeAllOtherDevices);

export default router;
