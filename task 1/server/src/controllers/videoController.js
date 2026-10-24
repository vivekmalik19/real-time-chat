import { VIDEO_CATALOG } from '../data/videoCatalog.js';
import VideoProgress from '../models/VideoProgress.js';

/**
 * Completion threshold percentage (configurable: 90%)
 */
const COMPLETION_THRESHOLD_PERCENT = 90;

/**
 * List all videos in catalog with optional user progress
 * GET /api/videos
 */
export async function listVideos(req, res, next) {
  try {
    let progressMap = new Map();

    if (req.user) {
      const progressList = await VideoProgress.find({ userId: req.user._id }).lean();
      for (const p of progressList) {
        progressMap.set(p.videoId, {
          currentTime: p.currentTime,
          duration: p.duration,
          completionPercentage: p.completionPercentage,
          completed: p.completed,
          lastWatched: p.lastWatched,
        });
      }
    }

    const videos = VIDEO_CATALOG.map((video) => ({
      ...video,
      progress: progressMap.get(video.id) || null,
    }));

    res.status(200).json({
      success: true,
      videos,
      total: videos.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get user watch history & continue watching queue
 * GET /api/videos/history
 */
export async function getWatchHistory(req, res, next) {
  try {
    if (!req.user) {
      return res.status(200).json({
        success: true,
        anonymous: true,
        history: [],
      });
    }

    const progressRecords = await VideoProgress.find({ userId: req.user._id })
      .sort({ lastWatched: -1 })
      .lean();

    // Map progress records to catalog video details
    const history = [];
    for (const record of progressRecords) {
      const video = VIDEO_CATALOG.find((v) => v.id === record.videoId);
      if (video) {
        history.push({
          ...video,
          progress: {
            currentTime: record.currentTime,
            duration: record.duration,
            completionPercentage: record.completionPercentage,
            completed: record.completed,
            lastWatched: record.lastWatched,
          },
        });
      }
    }

    res.status(200).json({
      success: true,
      history,
      total: history.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single video details with user progress
 * GET /api/videos/:id
 */
export async function getVideoById(req, res, next) {
  try {
    const { id } = req.params;
    const video = VIDEO_CATALOG.find((v) => v.id === id || v.slug === id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: `Video with ID "${id}" was not found.`,
      });
    }

    let progress = null;
    if (req.user) {
      const p = await VideoProgress.findOne({
        userId: req.user._id,
        videoId: video.id,
      }).lean();

      if (p) {
        progress = {
          currentTime: p.currentTime,
          duration: p.duration,
          completionPercentage: p.completionPercentage,
          completed: p.completed,
          lastWatched: p.lastWatched,
        };
      }
    }

    res.status(200).json({
      success: true,
      video: {
        ...video,
        progress,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Save / Update watch progress for authenticated user or guest session
 * POST /api/videos/:id/progress
 */
export async function saveProgress(req, res, next) {
  try {
    const { id } = req.params;
    const { currentTime, duration } = req.body;

    const video = VIDEO_CATALOG.find((v) => v.id === id || v.slug === id);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: `Video with ID "${id}" not found.`,
      });
    }

    // Gracefully handle invalid, negative, or NaN input values
    const numCurrentTime = Number(currentTime);
    const numDuration = Number(duration);

    if (isNaN(numCurrentTime) || numCurrentTime < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid currentTime provided. Must be a non-negative number.',
      });
    }

    const parsedDuration =
      !isNaN(numDuration) && numDuration > 0
        ? numDuration
        : (video.duration || 1);

    // Clamp current time to not exceed duration
    const parsedCurrentTime = Math.min(Math.max(0, numCurrentTime), parsedDuration);

    const completionPercentage =
      parsedDuration > 0
        ? Math.min(100, Math.round((parsedCurrentTime / parsedDuration) * 100))
        : 0;

    const isCompleted = completionPercentage >= COMPLETION_THRESHOLD_PERCENT;

    // Gracefully support anonymous / guest sessions
    if (!req.user) {
      return res.status(200).json({
        success: true,
        message: 'Watch progress tracked for guest session.',
        anonymous: true,
        progress: {
          currentTime: parsedCurrentTime,
          duration: parsedDuration,
          completionPercentage,
          completed: isCompleted,
          lastWatched: new Date(),
        },
      });
    }

    // Check existing progress to avoid unmarking completed state if rewound
    const existing = await VideoProgress.findOne({
      userId: req.user._id,
      videoId: video.id,
    });

    const completed = existing?.completed || isCompleted;

    // Deduplication optimization: avoid write if progress difference is negligible (< 1 second) and state unchanged
    if (
      existing &&
      Math.abs(existing.currentTime - parsedCurrentTime) < 1 &&
      existing.completed === completed &&
      Date.now() - new Date(existing.lastWatched).getTime() < 5000
    ) {
      return res.status(200).json({
        success: true,
        message: 'Watch progress up-to-date.',
        progress: {
          currentTime: existing.currentTime,
          duration: existing.duration,
          completionPercentage: existing.completionPercentage,
          completed: existing.completed,
          lastWatched: existing.lastWatched,
        },
      });
    }

    const progress = await VideoProgress.findOneAndUpdate(
      { userId: req.user._id, videoId: video.id },
      {
        $set: {
          currentTime: parsedCurrentTime,
          duration: parsedDuration,
          completionPercentage,
          completed,
          lastWatched: new Date(),
        },
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Watch progress saved successfully.',
      progress: {
        currentTime: progress.currentTime,
        duration: progress.duration,
        completionPercentage: progress.completionPercentage,
        completed: progress.completed,
        lastWatched: progress.lastWatched,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get watch progress for single video
 * GET /api/videos/:id/progress
 */
export async function getProgress(req, res, next) {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(200).json({
        success: true,
        anonymous: true,
        progress: null,
      });
    }

    const progress = await VideoProgress.findOne({
      userId: req.user._id,
      videoId: id,
    }).lean();

    res.status(200).json({
      success: true,
      progress: progress
        ? {
            currentTime: progress.currentTime,
            duration: progress.duration,
            completionPercentage: progress.completionPercentage,
            completed: progress.completed,
            lastWatched: progress.lastWatched,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete watch progress for single video
 * DELETE /api/videos/:id/progress
 */
export async function deleteProgress(req, res, next) {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(200).json({
        success: true,
        anonymous: true,
        message: 'Watch progress cleared for guest session.',
      });
    }

    await VideoProgress.deleteOne({
      userId: req.user._id,
      videoId: id,
    });

    res.status(200).json({
      success: true,
      message: 'Watch progress deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
}
