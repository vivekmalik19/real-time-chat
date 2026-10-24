import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import LoginHistory from '../models/LoginHistory.js';
import { signAuthToken, signTempOtpToken, verifyTempOtpToken } from '../utils/jwt.js';
import { generateOtp, hashOtp, verifyOtpHash } from '../utils/otp.js';
import { parseDevice } from '../utils/deviceParser.js';
import { getApproximateLocation } from '../utils/geolocation.js';
import { sendOtpEmail } from '../utils/mailer.js';

/**
 * Register a new user
 * POST /api/auth/register
 */
export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const clientDeviceId = req.headers['x-device-id'] || req.body.deviceId;

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const device = parseDevice(req);
    const location = await getApproximateLocation(device.ip);

    // Initial trusted device for registration
    const trustedDevices = [];
    if (clientDeviceId) {
      trustedDevices.push({
        deviceId: clientDeviceId,
        deviceType: device.deviceType,
        browser: device.browser,
        os: device.os,
        ip: device.ip,
        userAgent: device.userAgent,
        createdAt: new Date(),
        lastUsedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });
    }

    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      themePreference: 'auto',
      trustedDevices,
    });

    await user.save();

    // Record login history for registration
    await LoginHistory.create({
      userId: user._id,
      ipAddress: device.ip,
      userAgent: device.userAgent,
      browser: device.browser,
      os: device.os,
      deviceType: device.deviceType,
      deviceId: clientDeviceId || null,
      status: 'SUCCESS',
      isTrustedDevice: true,
      location,
    });

    const token = signAuthToken({ userId: user._id, email: user.email });

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: user.toSafeJSON(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Login user (with device detection and OTP verification for unverified devices)
 * POST /api/auth/login
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const clientDeviceId = req.headers['x-device-id'] || req.body.deviceId;

    const normalizedEmail = email.trim().toLowerCase();
    const device = parseDevice(req);
    const location = await getApproximateLocation(device.ip);

    const user = await User.findOne({ email: normalizedEmail });

    // Validate credentials
    if (!user || !(await user.comparePassword(password))) {
      if (user) {
        await LoginHistory.create({
          userId: user._id,
          ipAddress: device.ip,
          userAgent: device.userAgent,
          browser: device.browser,
          os: device.os,
          deviceType: device.deviceType,
          deviceId: clientDeviceId || null,
          status: 'FAILED',
          isTrustedDevice: false,
          location,
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
      });
    }

    // Check if client device is in user's trustedDevices array and not expired
    const now = new Date();
    const trustedDeviceIndex = user.trustedDevices.findIndex(
      (td) => td.deviceId === clientDeviceId && td.expiresAt > now
    );

    const isTrusted = clientDeviceId && trustedDeviceIndex !== -1;

    // CASE 1: Device is recognized as trusted
    if (isTrusted) {
      // Update lastUsedAt and IP on trusted device
      user.trustedDevices[trustedDeviceIndex].lastUsedAt = now;
      user.trustedDevices[trustedDeviceIndex].ip = device.ip;
      user.trustedDevices[trustedDeviceIndex].userAgent = device.userAgent;
      await user.save();

      // Record successful login
      await LoginHistory.create({
        userId: user._id,
        ipAddress: device.ip,
        userAgent: device.userAgent,
        browser: device.browser,
        os: device.os,
        deviceType: device.deviceType,
        deviceId: clientDeviceId,
        status: 'SUCCESS',
        isTrustedDevice: true,
        location,
      });

      const token = signAuthToken({ userId: user._id, email: user.email });

      return res.status(200).json({
        success: true,
        requiresOtp: false,
        token,
        user: user.toSafeJSON(),
        message: 'Login successful.',
      });
    }

    // CASE 2: New browser / device or unverified location -> Require OTP
    const otp = generateOtp();
    const hashed = hashOtp(otp);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = {
      hash: hashed,
      expiresAt: otpExpiresAt,
      attempts: 0,
      lastRequestedAt: now,
      pendingDeviceId: clientDeviceId || `dev_${Date.now()}`,
      pendingDeviceMeta: {
        browser: device.browser,
        os: device.os,
        ip: device.ip,
        deviceType: device.deviceType,
        userAgent: device.userAgent,
      },
    };

    await user.save();

    // Dispatch OTP via email (with console fallback in dev)
    await sendOtpEmail({
      to: user.email,
      name: user.name,
      otp,
      deviceInfo: `${device.browser} on ${device.os}`,
    });

    // Record OTP required in login history
    await LoginHistory.create({
      userId: user._id,
      ipAddress: device.ip,
      userAgent: device.userAgent,
      browser: device.browser,
      os: device.os,
      deviceType: device.deviceType,
      deviceId: clientDeviceId || null,
      status: 'OTP_REQUIRED',
      isTrustedDevice: false,
      location,
    });

    // Temporary short-lived token for OTP submission only
    const tempToken = signTempOtpToken({
      userId: user._id,
      email: user.email,
      purpose: 'login_otp',
    });

    return res.status(200).json({
      success: true,
      requiresOtp: true,
      tempToken,
      email: user.email,
      expiresInSeconds: 600,
      message: 'A 6-digit verification code has been sent to your email to verify this new device.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Verify OTP code for new device login
 * POST /api/auth/verify-otp
 */
export async function verifyOtp(req, res, next) {
  try {
    const { tempToken, otp, trustDevice = true } = req.body;

    let decoded;
    try {
      decoded = verifyTempOtpToken(tempToken);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Your verification session has expired. Please log in again.',
      });
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.otp || !user.otp.hash) {
      return res.status(400).json({
        success: false,
        message: 'No pending verification code found. Please log in again.',
      });
    }

    // Check expiry
    if (new Date() > user.otp.expiresAt) {
      user.otp = undefined;
      await user.save();
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please log in again to request a new code.',
      });
    }

    // Check attempt limit
    if (user.otp.attempts >= 5) {
      user.otp = undefined;
      await user.save();
      return res.status(429).json({
        success: false,
        message: 'Maximum verification attempts exceeded. Please log in again.',
      });
    }

    // Validate OTP hash
    const isValid = verifyOtpHash(otp, user.otp.hash);
    if (!isValid) {
      user.otp.attempts += 1;
      const remaining = 5 - user.otp.attempts;
      await user.save();

      return res.status(400).json({
        success: false,
        message: `Invalid verification code. ${remaining} attempt(s) remaining.`,
        remainingAttempts: remaining,
      });
    }

    // OTP Verified successfully!
    const pendingDeviceId = user.otp.pendingDeviceId;
    const pendingMeta = user.otp.pendingDeviceMeta || parseDevice(req);

    // Save as trusted device if requested
    if (trustDevice && pendingDeviceId) {
      const existingIdx = user.trustedDevices.findIndex((td) => td.deviceId === pendingDeviceId);
      const deviceEntry = {
        deviceId: pendingDeviceId,
        deviceType: pendingMeta.deviceType || 'desktop',
        browser: pendingMeta.browser || 'Unknown',
        os: pendingMeta.os || 'Unknown',
        ip: pendingMeta.ip || req.ip || '127.0.0.1',
        userAgent: pendingMeta.userAgent || req.headers['user-agent'],
        createdAt: new Date(),
        lastUsedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      };

      if (existingIdx !== -1) {
        user.trustedDevices[existingIdx] = deviceEntry;
      } else {
        user.trustedDevices.push(deviceEntry);
      }
    }

    // Clear OTP state
    user.otp = undefined;
    await user.save();

    const location = await getApproximateLocation(pendingMeta.ip || req.ip);

    // Record login history
    await LoginHistory.create({
      userId: user._id,
      ipAddress: pendingMeta.ip || req.ip,
      userAgent: pendingMeta.userAgent || req.headers['user-agent'],
      browser: pendingMeta.browser,
      os: pendingMeta.os,
      deviceType: pendingMeta.deviceType,
      deviceId: pendingDeviceId,
      status: 'SUCCESS',
      isTrustedDevice: !!trustDevice,
      location,
    });

    const token = signAuthToken({ userId: user._id, email: user.email });

    res.status(200).json({
      success: true,
      token,
      user: user.toSafeJSON(),
      message: 'Device verified and logged in successfully.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Resend OTP code
 * POST /api/auth/resend-otp
 */
export async function resendOtp(req, res, next) {
  try {
    const { tempToken } = req.body;

    let decoded;
    try {
      decoded = verifyTempOtpToken(tempToken);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Your verification session has expired. Please log in again.',
      });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Enforce 60s cooldown between requests
    if (user.otp?.lastRequestedAt) {
      const secondsSinceLast = (Date.now() - new Date(user.otp.lastRequestedAt).getTime()) / 1000;
      if (secondsSinceLast < 60) {
        const waitTime = Math.ceil(60 - secondsSinceLast);
        return res.status(429).json({
          success: false,
          message: `Please wait ${waitTime} seconds before requesting a new code.`,
          retryAfter: waitTime,
        });
      }
    }

    const otp = generateOtp();
    const hashed = hashOtp(otp);

    user.otp = {
      hash: hashed,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      attempts: 0,
      lastRequestedAt: new Date(),
      pendingDeviceId: user.otp?.pendingDeviceId || `dev_${Date.now()}`,
      pendingDeviceMeta: user.otp?.pendingDeviceMeta || parseDevice(req),
    };

    await user.save();

    await sendOtpEmail({
      to: user.email,
      name: user.name,
      otp,
      deviceInfo: `${user.otp.pendingDeviceMeta?.browser || 'Browser'} on ${user.otp.pendingDeviceMeta?.os || 'Device'}`,
    });

    res.status(200).json({
      success: true,
      message: 'A fresh verification code has been dispatched to your email.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get authenticated user profile
 * GET /api/auth/me
 */
export async function getMe(req, res) {
  res.status(200).json({
    success: true,
    user: req.user.toSafeJSON(),
  });
}

/**
 * Update theme preference
 * PATCH /api/auth/theme
 */
export async function updateTheme(req, res, next) {
  try {
    const { themePreference } = req.body;

    if (!['auto', 'light', 'dark'].includes(themePreference)) {
      return res.status(400).json({
        success: false,
        message: 'Theme preference must be "auto", "light", or "dark".',
      });
    }

    req.user.themePreference = themePreference;
    await req.user.save();

    res.status(200).json({
      success: true,
      themePreference: req.user.themePreference,
      message: 'Theme preference updated successfully.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Logout
 * POST /api/auth/logout
 */
export async function logout(req, res) {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
}
