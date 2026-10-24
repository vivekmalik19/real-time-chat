import User from '../models/User.js';
import LoginHistory from '../models/LoginHistory.js';

/**
 * Get user's login audit history
 * GET /api/security/history
 */
export async function getLoginHistory(req, res, next) {
  try {
    const history = await LoginHistory.find({ userId: req.user._id })
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    res.status(200).json({
      success: true,
      history,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get list of user's active trusted devices
 * GET /api/security/devices
 */
export async function getTrustedDevices(req, res, next) {
  try {
    const currentDeviceId = req.headers['x-device-id'];
    const now = new Date();

    // Filter only unexpired devices
    const devices = (req.user.trustedDevices || [])
      .filter((device) => device.expiresAt > now)
      .map((device) => ({
        id: device._id,
        deviceId: device.deviceId,
        deviceType: device.deviceType,
        browser: device.browser,
        os: device.os,
        ip: device.ip,
        createdAt: device.createdAt,
        lastUsedAt: device.lastUsedAt,
        expiresAt: device.expiresAt,
        isCurrentDevice: currentDeviceId ? device.deviceId === currentDeviceId : false,
      }));

    res.status(200).json({
      success: true,
      devices,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Revoke a specific trusted device
 * DELETE /api/security/devices/:deviceId
 */
export async function revokeDevice(req, res, next) {
  try {
    const { deviceId } = req.params;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Device ID is required to revoke.',
      });
    }

    // Remove device from trustedDevices array
    const originalCount = req.user.trustedDevices.length;
    req.user.trustedDevices = req.user.trustedDevices.filter(
      (td) => td.deviceId !== deviceId && td._id.toString() !== deviceId
    );

    if (req.user.trustedDevices.length === originalCount) {
      return res.status(404).json({
        success: false,
        message: 'Device not found in trusted devices list.',
      });
    }

    await req.user.save();

    // Mark sessions from that device as revoked in LoginHistory
    await LoginHistory.updateMany(
      { userId: req.user._id, deviceId },
      { $set: { sessionRevoked: true, status: 'REVOKED' } }
    );

    res.status(200).json({
      success: true,
      message: 'Device access revoked successfully.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Revoke all other trusted devices except the currently active one
 * DELETE /api/security/devices
 */
export async function revokeAllOtherDevices(req, res, next) {
  try {
    const currentDeviceId = req.headers['x-device-id'];

    if (!currentDeviceId) {
      // If current device ID is not known, clear all devices
      req.user.trustedDevices = [];
    } else {
      // Keep only current device
      req.user.trustedDevices = req.user.trustedDevices.filter(
        (td) => td.deviceId === currentDeviceId
      );
    }

    await req.user.save();

    // Mark other sessions as revoked
    const query = { userId: req.user._id };
    if (currentDeviceId) {
      query.deviceId = { $ne: currentDeviceId };
    }

    await LoginHistory.updateMany(query, {
      $set: { sessionRevoked: true, status: 'REVOKED' },
    });

    res.status(200).json({
      success: true,
      message: 'All other devices and sessions have been revoked.',
    });
  } catch (error) {
    next(error);
  }
}
