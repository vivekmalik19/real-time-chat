import express from 'express';
import {
  getVideoComments,
  createComment,
  editComment,
  deleteComment,
  reactToComment,
  translateCommentHandler,
  reportComment,
  getModerationQueue,
  takeModerationAction,
  switchUserRole,
} from '../controllers/commentController.js';
import {
  authenticateToken,
  optionalAuthenticateToken,
  requireRole,
} from '../middleware/auth.js';

const router = express.Router();

// Moderation routes (Protected by role check)
router.get(
  '/moderation/queue',
  authenticateToken,
  requireRole('admin', 'moderator'),
  getModerationQueue
);

router.post(
  '/moderation/:id/action',
  authenticateToken,
  requireRole('admin', 'moderator'),
  takeModerationAction
);

// Role switcher for testing / demo
router.post('/test-set-role', authenticateToken, switchUserRole);

// Comment action routes
router.patch('/:id', authenticateToken, editComment);
router.delete('/:id', authenticateToken, deleteComment);
router.post('/:id/reaction', authenticateToken, reactToComment);
router.post('/:id/translate', optionalAuthenticateToken, translateCommentHandler);
router.post('/:id/report', authenticateToken, reportComment);

export default router;
