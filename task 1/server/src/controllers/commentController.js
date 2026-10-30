import Comment from '../models/Comment.js';
import CommentReaction from '../models/CommentReaction.js';
import CommentReport from '../models/CommentReport.js';
import CommentModerationLog from '../models/CommentModerationLog.js';
import User from '../models/User.js';
import {
  EDIT_TIME_LIMIT_MINUTES,
  DUPLICATE_WINDOW_SECONDS,
  SUSPICIOUS_ATTEMPTS_THRESHOLD,
  SUSPICIOUS_WINDOW_MINUTES,
  MAX_COMMENT_LENGTH,
  MIN_COMMENT_LENGTH,
  REPORT_REASONS,
  MODERATION_STATUSES,
  checkProfanity,
  checkMaliciousLinks,
  extractMentions,
  sanitizeCommentText,
  generateContentFingerprint,
} from '../config/commentRules.js';
import { translateComment, SUPPORTED_LANGUAGES } from '../utils/translator.js';

// In-memory flood prevention map (userId -> array of timestamps)
const userPostTimestamps = new Map();

function checkUserFlood(userId) {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxPerWindow = 6; // max 6 comments per minute

  const timestamps = (userPostTimestamps.get(userId.toString()) || []).filter(
    (ts) => now - ts < windowMs
  );

  if (timestamps.length >= maxPerWindow) {
    return false;
  }

  timestamps.push(now);
  userPostTimestamps.set(userId.toString(), timestamps);
  return true;
}

/**
 * 1. GET /api/videos/:videoId/comments
 * Fetch comments and replies for a specific video
 */
export async function getVideoComments(req, res, next) {
  try {
    const { videoId } = req.params;
    const { sort = 'newest' } = req.query;

    if (!videoId) {
      return res.status(400).json({ success: false, message: 'Video ID is required' });
    }

    const currentUserId = req.user ? req.user._id : null;
    const isModerator = req.user && ['admin', 'moderator'].includes(req.user.role);

    // Filter condition for top-level comments
    const query = {
      videoId,
      parentId: null,
    };

    // If not a moderator, do not show completely deleted comments that have no replies
    if (!isModerator) {
      query.$or = [
        { isDeleted: false },
        { isDeleted: true, replyCount: { $gt: 0 } },
      ];
    }

    // Sort definition
    let sortOptions = { createdAt: -1 }; // newest
    if (sort === 'oldest') {
      sortOptions = { createdAt: 1 };
    } else if (sort === 'most_liked') {
      sortOptions = { likeCount: -1, createdAt: -1 };
    } else if (sort === 'relevance') {
      // Relevance combines likes, replies and recency
      sortOptions = { likeCount: -1, replyCount: -1, createdAt: -1 };
    }

    // Fetch top-level comments
    const topComments = await Comment.find(query).sort(sortOptions).limit(100);
    const topCommentIds = topComments.map((c) => c._id);

    // Fetch replies for these top comments
    const repliesQuery = {
      videoId,
      parentId: { $in: topCommentIds },
    };
    if (!isModerator) {
      repliesQuery.$or = [
        { isDeleted: false },
        { isDeleted: true, replyCount: { $gt: 0 } },
      ];
    }

    const replies = await Comment.find(repliesQuery).sort({ createdAt: 1 });

    // Collect all comment IDs to check user reactions
    const allCommentIds = [...topCommentIds, ...replies.map((r) => r._id)];

    let userReactionsMap = new Map();
    if (currentUserId && allCommentIds.length > 0) {
      const userReactions = await CommentReaction.find({
        userId: currentUserId,
        commentId: { $in: allCommentIds },
      });
      userReactions.forEach((r) => {
        userReactionsMap.set(r.commentId.toString(), r.type);
      });
    }

    // Group replies by parentId
    const repliesByParent = new Map();
    replies.forEach((reply) => {
      const pId = reply.parentId.toString();
      if (!repliesByParent.has(pId)) {
        repliesByParent.set(pId, []);
      }
      const reaction = userReactionsMap.get(reply._id.toString()) || null;
      repliesByParent.get(pId).push(reply.toSafeClient(reaction, isModerator));
    });

    // Structure response
    const formattedComments = topComments.map((comment) => {
      const reaction = userReactionsMap.get(comment._id.toString()) || null;
      const safeComment = comment.toSafeClient(reaction, isModerator);
      safeComment.replies = repliesByParent.get(comment._id.toString()) || [];
      return safeComment;
    });

    // Total active comments count
    const totalCount = await Comment.countDocuments({
      videoId,
      isDeleted: false,
      moderationStatus: { $ne: MODERATION_STATUSES.HIDDEN },
    });

    res.status(200).json({
      success: true,
      count: totalCount,
      sort,
      comments: formattedComments,
      supportedLanguages: SUPPORTED_LANGUAGES,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 2. POST /api/videos/:videoId/comments
 * Create a new top-level comment or threaded reply
 */
export async function createComment(req, res, next) {
  try {
    const { videoId } = req.params;
    const {
      content,
      parentId = null,
      shareLocation = false,
      location = null,
      captchaToken = null,
    } = req.body;

    if (!videoId) {
      return res.status(400).json({ success: false, message: 'Video ID is required' });
    }

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ success: false, message: 'Comment content is required' });
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length < MIN_COMMENT_LENGTH) {
      return res.status(400).json({ success: false, message: 'Comment cannot be empty' });
    }

    if (trimmedContent.length > MAX_COMMENT_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Comment exceeds maximum allowed length of ${MAX_COMMENT_LENGTH} characters`,
      });
    }

    const user = req.user;

    // A. Flood Prevention / Rate Limiting
    if (!checkUserFlood(user._id)) {
      return res.status(429).json({
        success: false,
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'You are posting comments too quickly. Please wait a moment before trying again.',
      });
    }

    // B. Suspicious Activity & CAPTCHA Enforcement
    if (user.suspiciousAttempts >= SUSPICIOUS_ATTEMPTS_THRESHOLD) {
      const windowPassed =
        user.lastSuspiciousAttempt &&
        Date.now() - new Date(user.lastSuspiciousAttempt).getTime() >
          SUSPICIOUS_WINDOW_MINUTES * 60 * 1000;

      if (!windowPassed) {
        if (!captchaToken || captchaToken !== 'meetflow-human-verified') {
          return res.status(429).json({
            success: false,
            code: 'CAPTCHA_REQUIRED',
            message:
              'Multiple policy triggers detected. Please complete human verification to post.',
            requiresCaptcha: true,
          });
        }
      } else {
        // Reset after window expires
        user.suspiciousAttempts = 0;
        await user.save();
      }
    }

    // C. Profanity / Abuse Filtering
    const profanityResult = checkProfanity(trimmedContent);
    if (profanityResult.isAbusive) {
      user.suspiciousAttempts = (user.suspiciousAttempts || 0) + 1;
      user.lastSuspiciousAttempt = new Date();
      await user.save();

      return res.status(400).json({
        success: false,
        code: 'PROFANITY_DETECTED',
        message:
          'Your comment violates community standards due to offensive or abusive language.',
        matchedTerm: profanityResult.matchedTerm,
      });
    }

    // D. Malicious Link Check
    const linkResult = checkMaliciousLinks(trimmedContent);
    if (linkResult.isMalicious) {
      user.suspiciousAttempts = (user.suspiciousAttempts || 0) + 1;
      user.lastSuspiciousAttempt = new Date();
      await user.save();

      return res.status(400).json({
        success: false,
        code: 'MALICIOUS_LINK_DETECTED',
        message: linkResult.reason || 'Links in comment violate security policies.',
      });
    }

    // E. Duplicate Comment Detection (5-minute window for same user on same video)
    const fingerprint = generateContentFingerprint(trimmedContent);
    const duplicateWindowStart = new Date(Date.now() - DUPLICATE_WINDOW_SECONDS * 1000);
    const duplicateComment = await Comment.findOne({
      videoId,
      authorId: user._id,
      contentFingerprint: fingerprint,
      isDeleted: false,
      createdAt: { $gte: duplicateWindowStart },
    });

    if (duplicateComment) {
      return res.status(409).json({
        success: false,
        code: 'DUPLICATE_COMMENT',
        message:
          'You already posted this exact comment recently. Please avoid duplicate submissions.',
      });
    }

    // F. Validate Parent Comment for Threaded Replies
    let parentCommentDoc = null;
    if (parentId) {
      parentCommentDoc = await Comment.findById(parentId);
      if (!parentCommentDoc || parentCommentDoc.videoId !== videoId) {
        return res.status(404).json({
          success: false,
          message: 'The comment you are replying to no longer exists.',
        });
      }
    }

    // G. Location Privacy Enforcement
    // NEVER infer or reveal private location; only store if user explicitly supplied & consented
    let verifiedLocation = null;
    if (shareLocation === true && location && typeof location === 'string' && location.trim()) {
      verifiedLocation = sanitizeCommentText(location.trim().slice(0, 100));
    }

    // H. Extract Mentions & Sanitize
    const mentions = extractMentions(trimmedContent);
    const sanitizedContent = sanitizeCommentText(trimmedContent);

    // I. Create Comment
    const newComment = await Comment.create({
      videoId,
      authorId: user._id,
      authorName: user.name,
      authorAvatar: user.avatar || null,
      parentId: parentCommentDoc ? parentCommentDoc._id : null,
      content: sanitizedContent,
      originalLanguage: 'auto',
      location: verifiedLocation,
      mentions,
      contentFingerprint: fingerprint,
    });

    // If this was a reply, increment parent's replyCount
    if (parentCommentDoc) {
      parentCommentDoc.replyCount = (parentCommentDoc.replyCount || 0) + 1;
      await parentCommentDoc.save();
    }

    // If successful and user had prior strikes, reset suspicious count
    if (user.suspiciousAttempts > 0 && captchaToken === 'meetflow-human-verified') {
      user.suspiciousAttempts = 0;
      await user.save();
    }

    res.status(201).json({
      success: true,
      message: 'Comment posted successfully',
      comment: newComment.toSafeClient(null, false),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 3. PATCH /api/comments/:id
 * Edit own comment within the 15-minute time limit
 */
export async function editComment(req, res, next) {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ success: false, message: 'New comment content is required' });
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length < MIN_COMMENT_LENGTH) {
      return res.status(400).json({ success: false, message: 'Comment cannot be empty' });
    }
    if (trimmedContent.length > MAX_COMMENT_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Comment exceeds maximum allowed length of ${MAX_COMMENT_LENGTH} characters`,
      });
    }

    const comment = await Comment.findById(id);
    if (!comment || comment.isDeleted) {
      return res.status(404).json({ success: false, message: 'Comment not found or deleted' });
    }

    // Authorization: Only author can edit their own comment
    if (comment.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own comments.',
        code: 'FORBIDDEN',
      });
    }

    // Time Limit Enforcement: 15-minute window
    if (!comment.isEditable()) {
      return res.status(403).json({
        success: false,
        code: 'EDIT_TIME_EXPIRED',
        message: `Comments can only be edited within ${EDIT_TIME_LIMIT_MINUTES} minutes of posting.`,
      });
    }

    // Profanity check on edit
    const profanityResult = checkProfanity(trimmedContent);
    if (profanityResult.isAbusive) {
      return res.status(400).json({
        success: false,
        code: 'PROFANITY_DETECTED',
        message: 'Updated comment contains prohibited abusive language.',
      });
    }

    // Link check on edit
    const linkResult = checkMaliciousLinks(trimmedContent);
    if (linkResult.isMalicious) {
      return res.status(400).json({
        success: false,
        code: 'MALICIOUS_LINK_DETECTED',
        message: linkResult.reason || 'Links in comment violate security policies.',
      });
    }

    // Update comment
    comment.content = sanitizeCommentText(trimmedContent);
    comment.contentFingerprint = generateContentFingerprint(trimmedContent);
    comment.mentions = extractMentions(trimmedContent);
    comment.isEdited = true;
    comment.editedAt = new Date();

    await comment.save();

    res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      comment: comment.toSafeClient(null, false),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 4. DELETE /api/comments/:id
 * Delete own comment or moderator removal
 */
export async function deleteComment(req, res, next) {
  try {
    const { id } = req.params;
    const comment = await Comment.findById(id);

    if (!comment || comment.isDeleted) {
      return res.status(404).json({ success: false, message: 'Comment not found or already deleted' });
    }

    const isAuthor = comment.authorId.toString() === req.user._id.toString();
    const isModerator = ['admin', 'moderator'].includes(req.user.role);

    if (!isAuthor && !isModerator) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this comment.',
      });
    }

    // Thread Preservation:
    // If this comment has replies, soft delete it so child threads remain unbroken!
    if (comment.replyCount > 0) {
      comment.isDeleted = true;
      comment.deletedAt = new Date();
      comment.content = '[This comment has been deleted by the author]';
      await comment.save();
    } else {
      // If it was a reply itself, decrement parent's replyCount
      if (comment.parentId) {
        await Comment.findByIdAndUpdate(comment.parentId, {
          $inc: { replyCount: -1 },
        });
      }
      // Hard delete from DB
      await Comment.findByIdAndDelete(id);
      await CommentReaction.deleteMany({ commentId: id });
    }

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
      id,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 5. POST /api/comments/:id/reaction
 * Like or dislike a comment with atomic switching and duplicate prevention
 */
export async function reactToComment(req, res, next) {
  try {
    const { id } = req.params;
    const { type } = req.body; // 'like' | 'dislike' | 'none'

    if (!['like', 'dislike', 'none'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid reaction type. Must be 'like', 'dislike', or 'none'.",
      });
    }

    const comment = await Comment.findById(id);
    if (!comment || comment.isDeleted) {
      return res.status(404).json({ success: false, message: 'Comment not found or deleted' });
    }

    const userId = req.user._id;

    // Check existing reaction
    const existingReaction = await CommentReaction.findOne({ commentId: id, userId });

    let likeDelta = 0;
    let dislikeDelta = 0;

    if (!existingReaction) {
      // New reaction
      if (type === 'like') {
        await CommentReaction.create({ commentId: id, userId, type: 'like' });
        likeDelta = 1;
      } else if (type === 'dislike') {
        await CommentReaction.create({ commentId: id, userId, type: 'dislike' });
        dislikeDelta = 1;
      }
    } else {
      // Existing reaction exists
      if (existingReaction.type === type || type === 'none') {
        // Toggle off reaction
        if (existingReaction.type === 'like') likeDelta = -1;
        if (existingReaction.type === 'dislike') dislikeDelta = -1;
        await CommentReaction.findByIdAndDelete(existingReaction._id);
      } else {
        // Switching reaction (e.g. from like to dislike)
        if (existingReaction.type === 'like' && type === 'dislike') {
          likeDelta = -1;
          dislikeDelta = 1;
        } else if (existingReaction.type === 'dislike' && type === 'like') {
          dislikeDelta = -1;
          likeDelta = 1;
        }
        existingReaction.type = type;
        await existingReaction.save();
      }
    }

    // Atomically update comment counts
    const updatedComment = await Comment.findByIdAndUpdate(
      id,
      {
        $inc: {
          likeCount: likeDelta,
          dislikeCount: dislikeDelta,
        },
      },
      { new: true }
    );

    // Safeguard against negative counts
    if (updatedComment.likeCount < 0 || updatedComment.dislikeCount < 0) {
      await Comment.findByIdAndUpdate(id, {
        likeCount: Math.max(0, updatedComment.likeCount),
        dislikeCount: Math.max(0, updatedComment.dislikeCount),
      });
    }

    const finalReaction = await CommentReaction.findOne({ commentId: id, userId });

    res.status(200).json({
      success: true,
      likeCount: Math.max(0, updatedComment.likeCount),
      dislikeCount: Math.max(0, updatedComment.dislikeCount),
      userReaction: finalReaction ? finalReaction.type : null,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 6. POST /api/comments/:id/translate
 * Translate comment text to user's preferred language with caching
 */
export async function translateCommentHandler(req, res, next) {
  try {
    const { id } = req.params;
    const { targetLanguage = 'en' } = req.body;

    const comment = await Comment.findById(id);
    if (!comment || comment.isDeleted) {
      return res.status(404).json({ success: false, message: 'Comment not found or deleted' });
    }

    try {
      const translation = await translateComment({
        commentId: comment._id,
        text: comment.content,
        sourceLang: comment.originalLanguage || 'auto',
        targetLanguage,
      });

      res.status(200).json({
        success: true,
        translation,
      });
    } catch (transErr) {
      // Clear error codes without pretending failed translations succeeded
      res.status(422).json({
        success: false,
        code: transErr.code || 'TRANSLATION_FAILED',
        message: transErr.message || 'Translation service currently unavailable.',
        provider: transErr.provider || 'unknown',
      });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * 7. POST /api/comments/:id/report
 * Report an offensive or abusive comment
 */
export async function reportComment(req, res, next) {
  try {
    const { id } = req.params;
    const { reason, details = '' } = req.body;

    if (!reason || !REPORT_REASONS.includes(reason)) {
      return res.status(400).json({
        success: false,
        message: `Please specify a valid reason: ${REPORT_REASONS.join(', ')}`,
      });
    }

    const comment = await Comment.findById(id);
    if (!comment || comment.isDeleted) {
      return res.status(404).json({ success: false, message: 'Comment not found or deleted' });
    }

    const reporterId = req.user._id;

    // Prevent duplicate report from same user
    const existingReport = await CommentReport.findOne({ commentId: id, reporterId });
    if (existingReport) {
      return res.status(409).json({
        success: false,
        code: 'DUPLICATE_REPORT',
        message: 'You have already reported this comment. Our moderation team is reviewing it.',
      });
    }

    // Create report record
    await CommentReport.create({
      commentId: id,
      reporterId,
      reason,
      details: sanitizeCommentText(details.slice(0, 500)),
    });

    // Increment comment's report count and update flag if necessary
    const newReportCount = (comment.reportCount || 0) + 1;
    comment.reportCount = newReportCount;
    comment.lastReportedAt = new Date();

    // If reportCount reaches threshold (e.g. >= 2), mark as flagged for review
    if (newReportCount >= 2 && comment.moderationStatus === MODERATION_STATUSES.APPROVED) {
      comment.moderationStatus = MODERATION_STATUSES.FLAGGED;
    }

    await comment.save();

    res.status(201).json({
      success: true,
      message: 'Thank you for your report. Our moderators will review this comment.',
      reportCount: isModeratorRole(req.user) ? newReportCount : undefined,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 8. GET /api/comments/moderation/queue
 * Moderator review queue (flagged, reported, or pending comments)
 */
export async function getModerationQueue(req, res, next) {
  try {
    const { status = 'all' } = req.query;

    const filter = {};
    if (status === 'flagged') {
      filter.moderationStatus = MODERATION_STATUSES.FLAGGED;
    } else if (status === 'hidden') {
      filter.moderationStatus = MODERATION_STATUSES.HIDDEN;
    } else {
      filter.$or = [
        { moderationStatus: MODERATION_STATUSES.FLAGGED },
        { reportCount: { $gt: 0 } },
      ];
    }

    const flaggedComments = await Comment.find(filter)
      .sort({ reportCount: -1, updatedAt: -1 })
      .limit(50);

    const commentIds = flaggedComments.map((c) => c._id);
    const reports = await CommentReport.find({
      commentId: { $in: commentIds },
      status: 'pending',
    }).populate('reporterId', 'name email');

    // Group reports by commentId
    const reportsMap = new Map();
    reports.forEach((rep) => {
      const cId = rep.commentId.toString();
      if (!reportsMap.has(cId)) reportsMap.set(cId, []);
      reportsMap.get(cId).push({
        id: rep._id,
        reason: rep.reason,
        details: rep.details,
        reporterName: rep.reporterId?.name || 'Anonymous',
        createdAt: rep.createdAt,
      });
    });

    const queueItems = flaggedComments.map((c) => ({
      id: c._id,
      videoId: c.videoId,
      authorName: c.authorName,
      authorId: c.authorId,
      content: c.content,
      reportCount: c.reportCount,
      moderationStatus: c.moderationStatus,
      likeCount: c.likeCount,
      dislikeCount: c.dislikeCount,
      createdAt: c.createdAt,
      reports: reportsMap.get(c._id.toString()) || [],
    }));

    res.status(200).json({
      success: true,
      count: queueItems.length,
      items: queueItems,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 9. POST /api/comments/moderation/:id/action
 * Moderator action on a comment (approve, hide, delete, dismiss_reports)
 */
export async function takeModerationAction(req, res, next) {
  try {
    const { id } = req.params;
    const { action, reason = '' } = req.body;

    if (!['approve', 'hide', 'delete', 'dismiss_reports'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Must be 'approve', 'hide', 'delete', or 'dismiss_reports'.",
      });
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const previousStatus = comment.moderationStatus;
    let newStatus = previousStatus;

    if (action === 'approve') {
      newStatus = MODERATION_STATUSES.APPROVED;
      comment.moderationStatus = MODERATION_STATUSES.APPROVED;
      comment.reportCount = 0;
      await CommentReport.updateMany(
        { commentId: id, status: 'pending' },
        { status: 'reviewed', actionTaken: 'approved', reviewedBy: req.user._id, reviewedAt: new Date() }
      );
    } else if (action === 'hide') {
      newStatus = MODERATION_STATUSES.HIDDEN;
      comment.moderationStatus = MODERATION_STATUSES.HIDDEN;
      await CommentReport.updateMany(
        { commentId: id, status: 'pending' },
        { status: 'action_taken', actionTaken: 'hidden', reviewedBy: req.user._id, reviewedAt: new Date() }
      );
    } else if (action === 'delete') {
      newStatus = MODERATION_STATUSES.DELETED;
      comment.isDeleted = true;
      comment.deletedAt = new Date();
      comment.moderationStatus = MODERATION_STATUSES.DELETED;
      comment.content = '[This comment was removed by a moderator for community guideline violations]';
      await CommentReport.updateMany(
        { commentId: id, status: 'pending' },
        { status: 'action_taken', actionTaken: 'deleted', reviewedBy: req.user._id, reviewedAt: new Date() }
      );
    } else if (action === 'dismiss_reports') {
      comment.reportCount = 0;
      comment.moderationStatus = MODERATION_STATUSES.APPROVED;
      await CommentReport.updateMany(
        { commentId: id, status: 'pending' },
        { status: 'dismissed', actionTaken: 'none', reviewedBy: req.user._id, reviewedAt: new Date() }
      );
    }

    await comment.save();

    // Audit Log
    await CommentModerationLog.create({
      commentId: id,
      moderatorId: req.user._id,
      moderatorName: req.user.name,
      action,
      previousStatus,
      newStatus,
      reason: sanitizeCommentText(reason),
    });

    res.status(200).json({
      success: true,
      message: `Action '${action}' successfully executed on comment`,
      id,
      newStatus,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 10. POST /api/comments/test-set-role
 * Helper endpoint for development & testing to switch between 'user' and 'moderator'
 */
export async function switchUserRole(req, res, next) {
  try {
    const { role } = req.body;
    if (!['user', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { role },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: `Role changed to ${role}`,
      user: updatedUser.toSafeJSON(),
    });
  } catch (error) {
    next(error);
  }
}

function isModeratorRole(user) {
  return user && ['admin', 'moderator'].includes(user.role);
}
