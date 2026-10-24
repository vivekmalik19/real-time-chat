import express from 'express';
import {
  listVideos,
  getWatchHistory,
  getVideoById,
  saveProgress,
  getProgress,
  deleteProgress,
} from '../controllers/videoController.js';
import { optionalAuthenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes (with optional user context for progress)
router.get('/', optionalAuthenticateToken, listVideos);
router.get('/history', optionalAuthenticateToken, getWatchHistory);
router.get('/:id', optionalAuthenticateToken, getVideoById);

// Progress routes with graceful guest / anonymous support
router.get('/:id/progress', optionalAuthenticateToken, getProgress);
router.post('/:id/progress', optionalAuthenticateToken, saveProgress);
router.delete('/:id/progress', optionalAuthenticateToken, deleteProgress);

export default router;
