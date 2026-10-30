import crypto from 'crypto';
import { Readable } from 'stream';
import { VIDEO_CATALOG } from '../data/videoCatalog.js';
import DownloadRecord from '../models/DownloadRecord.js';
import UserDownloadQuota from '../models/UserDownloadQuota.js';
import { getEffectiveSubscription } from '../models/Subscription.js';
import {
  PLAN_LIMITS,
  DEDUPLICATION_WINDOW_MS,
  getISTParts,
  getISTDayBounds,
  getISTMonthBounds,
  getNextISTDailyReset,
} from '../config/downloadPlans.js';
import { generateDownloadToken, verifyDownloadToken } from '../utils/downloadToken.js';
import { parseDevice } from '../utils/deviceParser.js';

/**
 * Extract safe audit metadata without logging sensitive credentials
 */
function extractSafeAudit(req) {
  const parsed = parseDevice(req);
  const deviceId = req.headers['x-device-id'] || '';

  return {
    ip: parsed.ip || '127.0.0.1',
    userAgent: parsed.userAgent || 'Unknown',
    deviceType: parsed.deviceType || 'desktop',
    browser: parsed.browser || 'Unknown',
    os: parsed.os || 'Unknown',
    deviceId,
  };
}

/**
 * Get current download quota & subscription status
 * GET /api/downloads/quota
 */
export async function getDownloadQuota(req, res, next) {
  try {
    const userId = req.user._id;
    const effectiveSub = await getEffectiveSubscription(userId);

    const { startOfDay, endOfDay } = getISTDayBounds();
    const { startOfMonth, endOfMonth } = getISTMonthBounds();

    const [dailyUsed, monthlyUsed] = await Promise.all([
      DownloadRecord.countDocuments({
        userId,
        countsTowardsQuota: true,
        initiatedAt: { $gte: startOfDay, $lte: endOfDay },
      }),
      DownloadRecord.countDocuments({
        userId,
        countsTowardsQuota: true,
        initiatedAt: { $gte: startOfMonth, $lte: endOfMonth },
      }),
    ]);

    const dailyLimit = effectiveSub.limits.dailyLimit;
    const monthlyLimit = effectiveSub.limits.monthlyLimit;

    const remainingDaily = Math.max(0, dailyLimit - dailyUsed);
    const remainingMonthly = Math.max(0, monthlyLimit - monthlyUsed);

    const nextReset = getNextISTDailyReset();
    const resetsInSeconds = Math.max(0, Math.floor((nextReset.getTime() - Date.now()) / 1000));

    res.status(200).json({
      success: true,
      plan: effectiveSub.plan,
      planName: effectiveSub.limits.name,
      subscriptionStatus: effectiveSub.status,
      isExpired: effectiveSub.isExpired,
      expiresAt: effectiveSub.expiresAt,
      allowedQualities: effectiveSub.limits.allowedQualities,
      daily: {
        limit: dailyLimit,
        used: dailyUsed,
        remaining: remainingDaily,
        resetsAt: nextReset,
        resetsInSeconds,
        resetsTimezone: 'IST (UTC+5:30)',
      },
      monthly: {
        limit: monthlyLimit,
        used: monthlyUsed,
        remaining: remainingMonthly,
      },
      deduplicationWindowMinutes: Math.round(DEDUPLICATION_WINDOW_MS / 60000),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Request download authorization with atomic concurrency quota reservation
 * POST /api/downloads/request
 */
export async function requestDownload(req, res, next) {
  try {
    const userId = req.user._id;
    const { videoId, quality, idempotencyKey } = req.body;

    if (!videoId) {
      return res.status(400).json({
        success: false,
        message: 'videoId is required.',
      });
    }

    // 1. Verify video exists in authorized catalog
    const video = VIDEO_CATALOG.find((v) => v.id === videoId || v.slug === videoId);
    if (!video) {
      return res.status(404).json({
        success: false,
        code: 'VIDEO_NOT_FOUND',
        message: `Video with ID "${videoId}" does not exist in the catalog.`,
      });
    }

    // 2. Check if video distribution allows offline download
    if (video.allowDownload === false) {
      // Record failed audit record (does not consume quota)
      await DownloadRecord.create({
        userId,
        videoId: video.id,
        videoTitle: video.title,
        videoThumbnail: video.thumbnailUrl,
        category: video.category,
        quality: quality || video.quality,
        status: 'failed',
        planSnapshot: { plan: 'unknown', dailyLimit: 0, monthlyLimit: 0 },
        requestId: idempotencyKey || crypto.randomUUID(),
        failedReason: video.downloadRestrictedReason || 'Video distribution licensing restricts offline downloads.',
        countsTowardsQuota: false,
        audit: extractSafeAudit(req),
      });

      return res.status(403).json({
        success: false,
        code: 'INACCESSIBLE_VIDEO',
        message: video.downloadRestrictedReason || 'This masterclass is restricted to in-app stream playback only.',
      });
    }

    // 3. Derive subscription and permissions strictly on the backend
    const effectiveSub = await getEffectiveSubscription(userId);

    // Enforce subscription expiry before authorization
    if (!effectiveSub.isActive || effectiveSub.isExpired) {
      await DownloadRecord.create({
        userId,
        videoId: video.id,
        videoTitle: video.title,
        videoThumbnail: video.thumbnailUrl,
        category: video.category,
        quality: quality || video.quality,
        status: 'failed',
        planSnapshot: {
          plan: effectiveSub.plan,
          dailyLimit: effectiveSub.limits.dailyLimit,
          monthlyLimit: effectiveSub.limits.monthlyLimit,
        },
        requestId: idempotencyKey || crypto.randomUUID(),
        failedReason: 'Subscription has expired',
        countsTowardsQuota: false,
        audit: extractSafeAudit(req),
      });

      return res.status(403).json({
        success: false,
        code: 'SUBSCRIPTION_EXPIRED',
        message: 'Your active subscription has expired. Please renew or upgrade your plan to continue downloading.',
        plan: effectiveSub.plan,
        expiresAt: effectiveSub.expiresAt,
      });
    }

    const { dailyLimit, monthlyLimit } = effectiveSub.limits;
    const reqId = idempotencyKey || crypto.randomUUID();

    // 4. Idempotency Check: if identical request was already authorized
    if (idempotencyKey) {
      const existingRequest = await DownloadRecord.findOne({
        userId,
        requestId: idempotencyKey,
      });

      if (existingRequest && ['authorized', 'completed'].includes(existingRequest.status)) {
        // Refresh token if needed
        const token = generateDownloadToken({
          downloadId: existingRequest._id.toString(),
          userId: userId.toString(),
          videoId: video.id,
          requestId: existingRequest.requestId,
        });

        existingRequest.downloadToken = token;
        existingRequest.tokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
        await existingRequest.save();

        return res.status(200).json({
          success: true,
          downloadId: existingRequest._id,
          downloadUrl: `/api/downloads/stream/${token}`,
          token,
          fileName: `${video.title.replace(/[^a-zA-Z0-9_\-]/g, '_')}.mp4`,
          fileSize: existingRequest.fileSize || video.fileSize || 0,
          fileSizeFormatted: existingRequest.fileSizeFormatted || video.fileSizeFormatted,
          isDeduplicated: existingRequest.isDeduplicated,
          idempotentReplay: true,
        });
      }
    }

    // 5. Deduplication Window Check:
    // If the user downloaded this exact video within the last 15 minutes, allow re-download at 0 quota cost!
    const dedupCutoff = new Date(Date.now() - DEDUPLICATION_WINDOW_MS);
    const recentDownload = await DownloadRecord.findOne({
      userId,
      videoId: video.id,
      status: { $in: ['authorized', 'completed', 'interrupted'] },
      initiatedAt: { $gte: dedupCutoff },
    }).sort({ initiatedAt: -1 });

    const isDeduplicated = Boolean(recentDownload);

    // 6. Quota Enforcement & Atomic Reservation
    const { startOfDay, endOfDay } = getISTDayBounds();
    const { startOfMonth, endOfMonth } = getISTMonthBounds();
    const { dateStr, monthStr } = getISTParts();

    const dailyPeriodKey = `daily:${dateStr}`;
    const monthlyPeriodKey = `monthly:${monthStr}`;

    if (!isDeduplicated) {
      // Check current actual usage in database
      const [currentDailyUsed, currentMonthlyUsed] = await Promise.all([
        DownloadRecord.countDocuments({
          userId,
          countsTowardsQuota: true,
          initiatedAt: { $gte: startOfDay, $lte: endOfDay },
        }),
        DownloadRecord.countDocuments({
          userId,
          countsTowardsQuota: true,
          initiatedAt: { $gte: startOfMonth, $lte: endOfMonth },
        }),
      ]);

      if (currentDailyUsed >= dailyLimit) {
        await DownloadRecord.create({
          userId,
          videoId: video.id,
          videoTitle: video.title,
          videoThumbnail: video.thumbnailUrl,
          category: video.category,
          quality: quality || video.quality,
          status: 'failed',
          planSnapshot: { plan: effectiveSub.plan, dailyLimit, monthlyLimit },
          requestId: reqId,
          failedReason: `Daily download quota of ${dailyLimit} exhausted`,
          countsTowardsQuota: false,
          audit: extractSafeAudit(req),
        });

        return res.status(429).json({
          success: false,
          code: 'QUOTA_EXHAUSTED_DAILY',
          message: `Daily download limit of ${dailyLimit} reached for your ${effectiveSub.limits.name}. Quota resets at midnight IST.`,
          daily: { limit: dailyLimit, used: currentDailyUsed, remaining: 0, resetsAt: getNextISTDailyReset() },
        });
      }

      if (currentMonthlyUsed >= monthlyLimit) {
        await DownloadRecord.create({
          userId,
          videoId: video.id,
          videoTitle: video.title,
          videoThumbnail: video.thumbnailUrl,
          category: video.category,
          quality: quality || video.quality,
          status: 'failed',
          planSnapshot: { plan: effectiveSub.plan, dailyLimit, monthlyLimit },
          requestId: reqId,
          failedReason: `Monthly download quota of ${monthlyLimit} exhausted`,
          countsTowardsQuota: false,
          audit: extractSafeAudit(req),
        });

        return res.status(429).json({
          success: false,
          code: 'QUOTA_EXHAUSTED_MONTHLY',
          message: `Monthly download limit of ${monthlyLimit} reached for your ${effectiveSub.limits.name}.`,
          monthly: { limit: monthlyLimit, used: currentMonthlyUsed, remaining: 0 },
        });
      }

      // Concurrency-safe atomic reservation on daily quota ledger
      // Synchronize ledger baseline if needed
      await UserDownloadQuota.updateOne(
        { userId, periodKey: dailyPeriodKey },
        { $setOnInsert: { userId, periodKey: dailyPeriodKey, type: 'daily', count: currentDailyUsed } },
        { upsert: true }
      );

      const reservedDaily = await UserDownloadQuota.findOneAndUpdate(
        {
          userId,
          periodKey: dailyPeriodKey,
          count: { $lt: dailyLimit },
        },
        { $inc: { count: 1 } },
        { new: true }
      );

      if (!reservedDaily) {
        return res.status(429).json({
          success: false,
          code: 'QUOTA_EXHAUSTED_DAILY',
          message: 'Daily download limit reached. Parallel request rejected by atomic reservation.',
        });
      }

      // Synchronize and atomically reserve monthly quota
      await UserDownloadQuota.updateOne(
        { userId, periodKey: monthlyPeriodKey },
        { $setOnInsert: { userId, periodKey: monthlyPeriodKey, type: 'monthly', count: currentMonthlyUsed } },
        { upsert: true }
      );

      const reservedMonthly = await UserDownloadQuota.findOneAndUpdate(
        {
          userId,
          periodKey: monthlyPeriodKey,
          count: { $lt: monthlyLimit },
        },
        { $inc: { count: 1 } },
        { new: true }
      );

      if (!reservedMonthly) {
        // Rollback daily reservation immediately
        await UserDownloadQuota.updateOne({ userId, periodKey: dailyPeriodKey }, { $inc: { count: -1 } });
        return res.status(429).json({
          success: false,
          code: 'QUOTA_EXHAUSTED_MONTHLY',
          message: 'Monthly download limit reached. Parallel request rejected.',
        });
      }
    }

    // 7. Create DownloadRecord in 'authorized' status
    const record = new DownloadRecord({
      userId,
      videoId: video.id,
      videoTitle: video.title,
      videoThumbnail: video.thumbnailUrl,
      category: video.category,
      quality: quality || video.quality,
      status: 'authorized',
      planSnapshot: {
        plan: effectiveSub.plan,
        dailyLimit,
        monthlyLimit,
      },
      fileSize: video.fileSize || 0,
      fileSizeFormatted: video.fileSizeFormatted || 'Unknown',
      requestId: reqId,
      initiatedAt: new Date(),
      countsTowardsQuota: !isDeduplicated,
      isDeduplicated,
      audit: extractSafeAudit(req),
    });

    // 8. Generate short-lived signed delivery token
    const token = generateDownloadToken({
      downloadId: record._id.toString(),
      userId: userId.toString(),
      videoId: video.id,
      requestId: reqId,
    });

    record.downloadToken = token;
    record.tokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await record.save();

    // 9. Compute updated remaining quota
    const updatedDailyUsed = await DownloadRecord.countDocuments({
      userId,
      countsTowardsQuota: true,
      initiatedAt: { $gte: startOfDay, $lte: endOfDay },
    });
    const updatedMonthlyUsed = await DownloadRecord.countDocuments({
      userId,
      countsTowardsQuota: true,
      initiatedAt: { $gte: startOfMonth, $lte: endOfMonth },
    });

    res.status(200).json({
      success: true,
      downloadId: record._id,
      downloadUrl: `/api/downloads/stream/${token}`,
      token,
      fileName: `${video.title.replace(/[^a-zA-Z0-9_\-]/g, '_')}.mp4`,
      fileSize: video.fileSize || 0,
      fileSizeFormatted: video.fileSizeFormatted || 'Unknown',
      isDeduplicated,
      remainingDaily: Math.max(0, dailyLimit - updatedDailyUsed),
      remainingMonthly: Math.max(0, monthlyLimit - updatedMonthlyUsed),
      resetsAt: getNextISTDailyReset(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controlled server streaming delivery using short-lived signed token
 * GET /api/downloads/stream/:token
 */
export async function streamDownload(req, res, next) {
  try {
    const { token } = req.params;

    // 1. Verify token authenticity and expiration
    const payload = verifyDownloadToken(token);
    if (!payload) {
      return res.status(403).json({
        success: false,
        code: 'INVALID_DOWNLOAD_TOKEN',
        message: 'This download link is invalid or has expired (validity: 15 minutes). Please request a fresh download authorization.',
      });
    }

    // 2. Fetch record
    const record = await DownloadRecord.findById(payload.downloadId);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Download record not found.',
      });
    }

    // 3. Find video from authorized catalog
    const video = VIDEO_CATALOG.find((v) => v.id === payload.videoId);
    if (!video || !video.videoUrl) {
      record.status = 'failed';
      record.failedReason = 'Source media asset unavailable';
      await record.save();
      return res.status(404).json({
        success: false,
        message: 'Source video stream unavailable.',
      });
    }

    // 4. Fetch upstream media stream
    const upstreamRes = await fetch(video.videoUrl, {
      headers: {
        'User-Agent': 'MeetFlow-Controlled-Delivery/2.0',
      },
    });

    if (!upstreamRes.ok && upstreamRes.status !== 206) {
      record.status = 'failed';
      record.failedReason = `Upstream server returned HTTP ${upstreamRes.status}`;
      if (record.countsTowardsQuota) {
        // Rollback quota because delivery never occurred
        const { dateStr, monthStr } = getISTParts(record.initiatedAt);
        await Promise.all([
          UserDownloadQuota.updateOne({ userId: record.userId, periodKey: `daily:${dateStr}` }, { $inc: { count: -1 } }),
          UserDownloadQuota.updateOne({ userId: record.userId, periodKey: `monthly:${monthStr}` }, { $inc: { count: -1 } }),
        ]);
        record.countsTowardsQuota = false;
      }
      await record.save();

      return res.status(502).json({
        success: false,
        message: 'Unable to stream source media asset from authorized provider.',
      });
    }

    // 5. Configure safe download response headers
    const safeTitle = video.title.replace(/[^a-zA-Z0-9_\-\. ]/g, '_').trim();
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.mp4"`);
    res.setHeader('Content-Type', 'video/mp4');

    const contentLength = upstreamRes.headers.get('content-length');
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
      record.fileSize = parseInt(contentLength, 10);
      record.fileSizeFormatted = `${(record.fileSize / (1024 * 1024)).toFixed(1)} MB`;
    }

    // Convert fetch body into Node.js Readable stream and pipe to res
    const nodeStream = Readable.fromWeb(upstreamRes.body);

    let streamCompleted = false;

    nodeStream.on('end', async () => {
      streamCompleted = true;
      record.status = 'completed';
      record.completedAt = new Date();
      await record.save().catch(() => {});
    });

    nodeStream.on('error', async (err) => {
      record.status = 'failed';
      record.failedReason = `Stream error: ${err.message}`;
      await record.save().catch(() => {});
    });

    // Detect client disconnect / abort before stream completion
    req.on('close', async () => {
      if (!streamCompleted && record.status === 'authorized') {
        record.status = 'interrupted';
        record.failedReason = 'Client disconnected or transfer aborted before completion';
        await record.save().catch(() => {});
      }
    });

    nodeStream.pipe(res);
  } catch (error) {
    next(error);
  }
}

/**
 * Get user download history
 * GET /api/downloads/history
 */
export async function getDownloadHistory(req, res, next) {
  try {
    const userId = req.user._id;

    const records = await DownloadRecord.find({ userId })
      .sort({ initiatedAt: -1 })
      .limit(100)
      .lean();

    res.status(200).json({
      success: true,
      records,
      total: records.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Remove a record from download history
 * DELETE /api/downloads/records/:id
 */
export async function deleteDownloadRecord(req, res, next) {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    await DownloadRecord.deleteOne({
      _id: id,
      userId,
    });

    res.status(200).json({
      success: true,
      message: 'Download record removed from history.',
    });
  } catch (error) {
    next(error);
  }
}
