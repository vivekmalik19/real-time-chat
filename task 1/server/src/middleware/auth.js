import { verifyAuthToken } from '../utils/jwt.js';
import User from '../models/User.js';

/**
 * Authentication Middleware
 * Validates Bearer token from Authorization header and loads authenticated User
 */
export async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required. Please sign in.',
      });
    }

    let decoded;
    try {
      decoded = verifyAuthToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Your session has expired. Please sign in again.',
          code: 'TOKEN_EXPIRED',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
        code: 'TOKEN_INVALID',
      });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not found or deleted.',
      });
    }

    req.user = user;
    req.tokenPayload = decoded;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional Authentication Middleware
 * If a valid token is present, sets req.user.
 * If no token is provided, proceeds normally with req.user = null.
 */
export async function optionalAuthenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : null;

    if (!token) {
      req.user = null;
      return next();
    }

    try {
      const decoded = verifyAuthToken(token);
      const user = await User.findById(decoded.userId);
      req.user = user || null;
      req.tokenPayload = decoded;
    } catch {
      req.user = null;
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Role-Based Authorization Middleware
 * Enforces that authenticated user possesses at least one of the specified roles
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please sign in.',
      });
    }

    const userRole = req.user.role || 'user';
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to perform this action.',
        code: 'FORBIDDEN_ROLE',
      });
    }

    next();
  };
}
