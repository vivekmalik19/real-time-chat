/**
 * MeetFlow Video Download Plan Limits & Configuration
 * Indian Standard Time (IST, UTC+5:30) Date Boundary Utilities
 */

// Clearly documented default / demo limits for each subscription tier
export const PLAN_LIMITS = {
  free: {
    name: 'Free Tier',
    badge: 'Free',
    dailyLimit: parseInt(process.env.DOWNLOAD_LIMIT_FREE_DAILY || '1', 10),
    monthlyLimit: parseInt(process.env.DOWNLOAD_LIMIT_FREE_MONTHLY || '5', 10),
    allowedQualities: ['720p HD'],
    canDownload: true,
    description: '1 download per day, 5 per month (Standard HD)',
  },
  bronze: {
    name: 'Bronze Plan',
    badge: 'Bronze',
    dailyLimit: parseInt(process.env.DOWNLOAD_LIMIT_BRONZE_DAILY || '3', 10),
    monthlyLimit: parseInt(process.env.DOWNLOAD_LIMIT_BRONZE_MONTHLY || '20', 10),
    allowedQualities: ['720p HD'],
    canDownload: true,
    description: '3 downloads per day, 20 per month (Standard HD)',
  },
  silver: {
    name: 'Silver Plan',
    badge: 'Silver',
    dailyLimit: parseInt(process.env.DOWNLOAD_LIMIT_SILVER_DAILY || '10', 10),
    monthlyLimit: parseInt(process.env.DOWNLOAD_LIMIT_SILVER_MONTHLY || '100', 10),
    allowedQualities: ['720p HD', '1080p Full HD'],
    canDownload: true,
    description: '10 downloads per day, 100 per month (Full HD 1080p)',
  },
  gold: {
    name: 'Gold Plan',
    badge: 'Gold',
    dailyLimit: parseInt(process.env.DOWNLOAD_LIMIT_GOLD_DAILY || '50', 10),
    monthlyLimit: parseInt(process.env.DOWNLOAD_LIMIT_GOLD_MONTHLY || '500', 10),
    allowedQualities: ['720p HD', '1080p Full HD', '4K UHD'],
    canDownload: true,
    description: '50 downloads per day, 500 per month (All Qualities)',
  },
};

// Deduplication window: within 15 minutes, re-downloading the same video does not consume additional quota
export const DEDUPLICATION_WINDOW_MS = parseInt(
  process.env.DOWNLOAD_DEDUP_WINDOW_MS || String(15 * 60 * 1000),
  10
);

// IST Offset in milliseconds (UTC + 5:30)
export const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/**
 * Returns formatted IST year, month, day components and date strings
 * @param {Date} [date=new Date()]
 */
export function getISTParts(date = new Date()) {
  const istDate = new Date(date.getTime() + IST_OFFSET_MS);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  return {
    year,
    month,
    day,
    dateStr: `${year}-${month}-${day}`,
    monthStr: `${year}-${month}`,
  };
}

/**
 * Returns start and end of day in UTC corresponding to IST 00:00:00 to 23:59:59.999
 * @param {Date} [date=new Date()]
 */
export function getISTDayBounds(date = new Date()) {
  const { year, month, day } = getISTParts(date);
  const startOfDay = new Date(
    Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10), 0, 0, 0, 0) -
      IST_OFFSET_MS
  );
  const endOfDay = new Date(
    Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10), 23, 59, 59, 999) -
      IST_OFFSET_MS
  );
  return { startOfDay, endOfDay };
}

/**
 * Returns start and end of month in UTC corresponding to IST calendar month
 * @param {Date} [date=new Date()]
 */
export function getISTMonthBounds(date = new Date()) {
  const { year, month } = getISTParts(date);
  const y = parseInt(year, 10);
  const m = parseInt(month, 10) - 1;
  const startOfMonth = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0) - IST_OFFSET_MS);
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const endOfMonth = new Date(Date.UTC(y, m, lastDay, 23, 59, 59, 999) - IST_OFFSET_MS);
  return { startOfMonth, endOfMonth };
}

/**
 * Returns the exact Date of the next IST daily reset (00:00:00 IST)
 * @param {Date} [date=new Date()]
 */
export function getNextISTDailyReset(date = new Date()) {
  const { startOfDay } = getISTDayBounds(date);
  // Next reset is exactly 24 hours after current day's startOfDay
  return new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
}
