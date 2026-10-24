/**
 * Client Device Identifier Utility
 * Generates and persists a unique client device ID in localStorage
 */

const DEVICE_ID_KEY = 'meetflow_device_id';

export function getOrCreateDeviceId() {
  if (typeof window === 'undefined') {
    return 'server_environment';
  }

  let deviceId = localStorage.getItem(DEVICE_ID_KEY);

  if (!deviceId) {
    // Generate UUID-like random identifier
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
    try {
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    } catch (e) {
      console.warn('Unable to persist device ID to localStorage:', e);
    }
  }

  return deviceId;
}

export function resetDeviceId() {
  const newId = 'dev_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
  localStorage.setItem(DEVICE_ID_KEY, newId);
  return newId;
}
