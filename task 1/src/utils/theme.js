/**
 * IST Theme Calculator and Helper Utilities
 * Indian Standard Time (IST) is UTC+5:30.
 * Automatically selects light theme between 05:00 and 12:00 IST and dark theme otherwise,
 * unless overridden by user's manual preference.
 */

export const THEME_STORAGE_KEY = 'meetflow_theme_preference';

/**
 * Returns current Date object converted to Indian Standard Time (IST, UTC+5:30)
 * @returns {Date}
 */
export function getISTDate() {
  const now = new Date();
  const utcMilliseconds = now.getTime() + now.getTimezoneOffset() * 60000;
  // Add 5 hours and 30 minutes in milliseconds
  return new Date(utcMilliseconds + 5.5 * 3600000);
}

/**
 * Returns current hour in IST (0 to 23)
 * @returns {number}
 */
export function getISTHour() {
  return getISTDate().getHours();
}

/**
 * Computes auto-theme based on current IST time:
 * Light theme between 05:00 and 12:00 IST, dark theme otherwise
 * @returns {'light' | 'dark'}
 */
export function getAutoThemeByIST() {
  const istHour = getISTHour();
  return istHour >= 5 && istHour < 12 ? 'light' : 'dark';
}

/**
 * Resolves active theme given an optional preference ('auto' | 'light' | 'dark' | null)
 * @param {'auto' | 'light' | 'dark' | null} preference
 * @returns {'light' | 'dark'}
 */
export function resolveTheme(preference) {
  if (preference === 'light') return 'light';
  if (preference === 'dark') return 'dark';
  return getAutoThemeByIST();
}
