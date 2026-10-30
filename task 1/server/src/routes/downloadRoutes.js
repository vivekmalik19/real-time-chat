import express from 'express';
import {
  getDownloadQuota,
  requestDownload,
  streamDownload,
  getDownloadHistory,
  deleteDownloadRecord,
} from '../controllers/downloadController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Quota and history (authenticated)
router.get('/quota', authenticateToken, getDownloadQuota);
router.get('/history', authenticateToken, getDownloadHistory);

// Download request authorization (authenticated)
router.post('/request', authenticateToken, requestDownload);

// Controlled secure server delivery via short-lived signed token
router.get('/stream/:token', streamDownload);

// Delete record from history
router.delete('/records/:id', authenticateToken, deleteDownloadRecord);

export default router;
