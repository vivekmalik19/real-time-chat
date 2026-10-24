import crypto from 'crypto';
import { config } from '../config/env.js';

/**
 * Generate a cryptographically secure 6-digit numeric OTP string
 * @returns {string}
 */
export function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Hash an OTP with HMAC SHA-256 using the JWT secret as salt
 * @param {string} otp
 * @returns {string}
 */
export function hashOtp(otp) {
  return crypto
    .createHmac('sha256', config.jwtSecret)
    .update(otp.trim())
    .digest('hex');
}

/**
 * Safely verify an input OTP against stored hash using constant-time comparison
 * @param {string} inputOtp
 * @param {string} storedHash
 * @returns {boolean}
 */
export function verifyOtpHash(inputOtp, storedHash) {
  if (!inputOtp || !storedHash) return false;
  const inputHash = hashOtp(inputOtp);
  if (inputHash.length !== storedHash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(storedHash));
}
