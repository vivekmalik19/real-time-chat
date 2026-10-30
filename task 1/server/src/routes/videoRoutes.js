import express from 'express';
import {
  listVideos,
  getWatchHistory,
  getVideoById,
  saveProgress,
  getProgress,
  deleteProgress,
} from '../controllers/videoController.js';
import { getVideoComments, createComment } from '../controllers/commentController.js';
import { authenticateToken, optionalAuthenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes (with optional user context for progress)
router.get('/', optionalAuthenticateToken, listVideos);
router.get('/history', optionalAuthenticateToken, getWatchHistory);
router.get('/:id', optionalAuthenticateToken, getVideoById);

// Comments for video
router.get('/:videoId/comments', optionalAuthenticateToken, getVideoComments);
router.post('/:videoId/comments', authenticateToken, createComment);

// Progress routes with graceful guest / anonymous support
router.get('/:id/progress', optionalAuthenticateToken, getProgress);
router.post('/:id/progress', optionalAuthenticateToken, saveProgress);
router.delete('/:id/progress', optionalAuthenticateToken, deleteProgress);

export default router;
