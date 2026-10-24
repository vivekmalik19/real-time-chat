/**
 * User-Agent and Device Parsing Utility
 */

export function parseDevice(req) {
  const userAgent = req.headers['user-agent'] || 'Unknown User-Agent';
  const ua = userAgent.toLowerCase();

  // 1. Detect Device Type
  let deviceType = 'desktop';
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    deviceType = 'tablet';
  } else if (/mobile|iphone|ipod|android.*mobile|blackberry|phone|iemobile/i.test(ua)) {
    deviceType = 'mobile';
  }

  // 2. Detect Operating System
  let os = 'Unknown OS';
  if (/windows nt 10/i.test(ua)) os = 'Windows 10/11';
  else if (/windows nt 6\.3/i.test(ua)) os = 'Windows 8.1';
  else if (/windows nt 6\.2/i.test(ua)) os = 'Windows 8';
  else if (/windows nt 6\.1/i.test(ua)) os = 'Windows 7';
  else if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/linux/i.test(ua)) os = 'Linux';
  else if (/cros/i.test(ua)) os = 'Chrome OS';

  // 3. Detect Browser
  let browser = 'Unknown Browser';
  if (/edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/opr\/|opera\//i.test(ua)) browser = 'Opera';
  else if (/chrome\/|crios\//i.test(ua)) browser = 'Chrome';
  else if (/firefox\/|fxios\//i.test(ua)) browser = 'Firefox';
  else if (/safari\//i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/msie|trident\//i.test(ua)) browser = 'Internet Explorer';

  // 4. Extract Client IP
  const forwarded = req.headers['x-forwarded-for'];
  let ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '127.0.0.1';
  if (forwarded) {
    ip = forwarded.split(',')[0].trim();
  }
  // Normalize IPv6 localhost
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    ip = '127.0.0.1';
  }

  return {
    userAgent,
    browser,
    os,
    deviceType,
    ip,
  };
}
