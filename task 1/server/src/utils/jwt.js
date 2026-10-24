import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

/**
 * Sign standard authentication JWT token
 * @param {Object} payload
 * @returns {string}
 */
export function signAuthToken(payload) {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

/**
 * Verify standard authentication JWT token
 * @param {string} token
 * @returns {Object}
 */
export function verifyAuthToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

/**
 * Sign temporary short-lived token for OTP verification (10 minutes)
 * @param {Object} payload
 * @returns {string}
 */
export function signTempOtpToken(payload) {
  return jwt.sign(payload, config.jwtTempSecret, {
    expiresIn: '10m',
  });
}

/**
 * Verify temporary short-lived token for OTP verification
 * @param {string} token
 * @returns {Object}
 */
export function verifyTempOtpToken(token) {
  return jwt.verify(token, config.jwtTempSecret);
}
