/**
 * Utility to parse browser MediaDevices errors into user-friendly messages
 */

/**
 * Checks whether the current browser and context support getUserMedia
 * @returns {{ isSupported: boolean, reason?: string }}
 */
export function checkMediaSupport() {
  if (typeof window === 'undefined') {
    return { isSupported: false, reason: 'Media APIs are not available outside browser environment.' };
  }

  // Check secure context (getUserMedia requires HTTPS or localhost)
  const isSecure = window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (!isSecure) {
    return {
      isSupported: false,
      reason: 'Camera and microphone access requires a secure connection (HTTPS or localhost).',
    };
  }

  if (!navigator?.mediaDevices?.getUserMedia) {
    return {
      isSupported: false,
      reason: 'Your browser does not support the MediaDevices API. Please try an updated modern browser such as Chrome, Edge, Firefox, or Safari.',
    };
  }

  return { isSupported: true };
}

/**
 * Converts a DOMException or Error from getUserMedia into a friendly user-facing format
 * @param {Error|DOMException|any} error
 * @returns {{ title: string, message: string, actionText: string, type: 'error' | 'warning' }}
 */
export function parseMediaError(error) {
  if (!error) {
    return {
      title: 'Media Error',
      message: 'An unknown error occurred while accessing media devices.',
      actionText: 'Try Again',
      type: 'error',
    };
  }

  const errorName = error.name || '';

  switch (errorName) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return {
        title: 'Permissions Denied',
        message: 'Camera and microphone permissions were denied. Please click the camera/lock icon in your browser address bar to allow access, then click Try Again.',
        actionText: 'Request Permissions Again',
        type: 'warning',
      };

    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return {
        title: 'No Media Devices Found',
        message: 'No camera or microphone was detected on your system. Please connect a webcam or headset and try again.',
        actionText: 'Check Devices & Retry',
        type: 'error',
      };

    case 'NotReadableError':
    case 'TrackStartError':
      return {
        title: 'Device Already in Use',
        message: 'Your camera or microphone is currently in use by another application (e.g. Zoom, Teams, or another browser tab). Please close other apps and try again.',
        actionText: 'Retry Access',
        type: 'error',
      };

    case 'OverconstrainedError':
      return {
        title: 'Device Constraints Unsupported',
        message: 'Your hardware does not satisfy the requested video or audio constraints. Please try again with standard settings.',
        actionText: 'Retry with Default Settings',
        type: 'error',
      };

    case 'SecurityError':
      return {
        title: 'Security Restriction',
        message: 'Media capture was blocked due to browser security restrictions or permissions policy.',
        actionText: 'Try Again',
        type: 'error',
      };

    case 'TypeError':
      return {
        title: 'Unsupported Media Configuration',
        message: 'Media constraints are invalid or camera access was requested in an insecure context (HTTPS or localhost required).',
        actionText: 'Try Again',
        type: 'error',
      };

    case 'AbortError':
      return {
        title: 'Request Aborted',
        message: 'The media hardware request was cancelled or aborted by the system.',
        actionText: 'Try Again',
        type: 'warning',
      };

    default:
      return {
        title: 'Unable to Access Media Devices',
        message: error.message || 'An unexpected error occurred while requesting camera and microphone access.',
        actionText: 'Try Again',
        type: 'error',
      };
  }
}
