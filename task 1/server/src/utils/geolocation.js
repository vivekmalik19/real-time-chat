import { config } from '../config/env.js';

/**
 * Geolocation Lookup Utility
 * Only queries when a reliable geolocation provider is configured.
 * Never invents fake location data.
 * @param {string} ip
 * @returns {Promise<{ city?: string, region?: string, country?: string, latitude?: number, longitude?: number, timezone?: string } | null>}
 */
export async function getApproximateLocation(ip) {
  // If no geolocation provider is configured, do NOT invent location data
  if (!config.geolocationApiUrl || !ip) {
    return null;
  }

  // Skip localhost and private RFC 1918 addresses
  if (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.16.')
  ) {
    return null;
  }

  try {
    const url = config.geolocationApiUrl.includes('{ip}')
      ? config.geolocationApiUrl.replace('{ip}', encodeURIComponent(ip))
      : `${config.geolocationApiUrl.replace(/\/$/, '')}/${encodeURIComponent(ip)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000); // 3-second timeout

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (!data) return null;

    return {
      city: data.city || data.cityName || null,
      region: data.region || data.regionName || null,
      country: data.country || data.countryName || null,
      latitude: data.latitude || data.lat || null,
      longitude: data.longitude || data.lon || null,
      timezone: data.timezone || null,
    };
  } catch (err) {
    // Fail silently without inventing data
    return null;
  }
}
