import crypto from 'crypto';
import { config } from '../config/env.js';

const TOKEN_SECRET = process.env.DOWNLOAD_TOKEN_SECRET || config.jwtSecret || 'meetflow_download_secret_2026';
const TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes validity

/**
 * Generate a short-lived signed token for authorized server video delivery
 * @param {Object} data - { downloadId, userId, videoId, requestId }
 * @returns {string} base64url signed token
 */
export function generateDownloadToken(data) {
  const expiresAt = Date.now() + TOKEN_EXPIRY_MS;
  const payload = {
    ...data,
    expiresAt,
    issuedAt: Date.now(),
  };

  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payloadStr)
    .digest('base64url');

  return `${payloadStr}.${signature}`;
}

/**
 * Verify and decode short-lived download token
 * @param {string} token
 * @returns {Object|null} Decoded payload or null if invalid / expired
 */
export function verifyDownloadToken(token) {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadStr, signature] = parts;

  // Verify HMAC signature
  const expectedSignature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payloadStr)
    .digest('base64url');

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf8'));

    // Check expiration
    if (!payload.expiresAt || Date.now() > payload.expiresAt) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
