/**
 * MeetFlow Multilingual Commenting Rules & Moderation Config
 * Official Task 6 Configuration
 */

// Time limits
export const EDIT_TIME_LIMIT_MINUTES = 15; // Comments can only be edited within 15 minutes of creation
export const DUPLICATE_WINDOW_SECONDS = 300; // 5 minutes duplicate text prevention
export const SUSPICIOUS_ATTEMPTS_THRESHOLD = 3; // Captcha required after 3 suspicious strikes
export const SUSPICIOUS_WINDOW_MINUTES = 10;
export const MAX_COMMENT_LENGTH = 2000;
export const MIN_COMMENT_LENGTH = 1;
export const MAX_LINKS_ALLOWED = 2;

// Allowed report reasons
export const REPORT_REASONS = [
  'spam',
  'harassment',
  'offensive',
  'misinformation',
  'other',
];

// Moderation statuses
export const MODERATION_STATUSES = {
  APPROVED: 'approved',
  PENDING: 'pending',
  FLAGGED: 'flagged',
  HIDDEN: 'hidden',
  DELETED: 'deleted',
};

// Profanity / Abuse wordlist with whole-word regex to avoid false positives (e.g., 'class', 'bass')
const ABUSE_KEYWORDS = [
  // English vulgarities / slurs
  'asshole',
  'bastard',
  'bitch',
  'blowjob',
  'bullshit',
  'cunt',
  'dickhead',
  'dumbass',
  'faggot',
  'fuck',
  'motherfucker',
  'nigger',
  'nigga',
  'pussy',
  'retard',
  'shit',
  'slut',
  'whore',
  // Common Hindi / Hinglish abusive terms
  'bhenchod',
  'behenchod',
  'madarchod',
  'chutiya',
  'chutiye',
  'gandu',
  'harami',
  'kameena',
  'saala',
  'randi',
  'bhosdike',
  // Spanish / French common slurs
  'hijo de puta',
  'mierda',
  'putain',
  'connard',
];

// Build regex patterns with word boundaries
const ABUSE_PATTERNS = ABUSE_KEYWORDS.map(
  (word) => new RegExp(`\\b${word.replace(/\s+/g, '\\s+')}\\b`, 'i')
);

// Malicious link detection patterns (IP addresses, dangerous schemes, phishing patterns)
const IP_URL_PATTERN = /\bhttps?:\/\/(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?(?:\/[^\s]*)?/i;
const DANGEROUS_SCHEME_PATTERN = /\b(javascript|data|vbscript|file):/i;
const EXECUTABLE_LINK_PATTERN = /\bhttps?:\/\/[^\s]+\.(exe|bat|cmd|sh|scr|vbs|msi|apk|jar)(?:\?[^\s]*)?/i;
const GENERAL_URL_PATTERN = /https?:\/\/[^\s/$.?#].[^\s]*/gi;

/**
 * Validates text for profanity or abusive language
 * Returns { isAbusive: boolean, matchedTerm?: string }
 */
export function checkProfanity(text) {
  if (!text || typeof text !== 'string') return { isAbusive: false };
  for (let i = 0; i < ABUSE_PATTERNS.length; i++) {
    if (ABUSE_PATTERNS[i].test(text)) {
      return { isAbusive: true, matchedTerm: ABUSE_KEYWORDS[i] };
    }
  }
  return { isAbusive: false };
}

/**
 * Validates links inside comment text
 * Returns { isMalicious: boolean, reason?: string, linkCount: number }
 */
export function checkMaliciousLinks(text) {
  if (!text || typeof text !== 'string') return { isMalicious: false, linkCount: 0 };

  if (DANGEROUS_SCHEME_PATTERN.test(text)) {
    return { isMalicious: true, reason: 'Dangerous URI scheme detected' };
  }

  if (IP_URL_PATTERN.test(text)) {
    return { isMalicious: true, reason: 'Direct IP address links are prohibited for security' };
  }

  if (EXECUTABLE_LINK_PATTERN.test(text)) {
    return { isMalicious: true, reason: 'Direct links to executable or installer files are not permitted' };
  }

  const matches = text.match(GENERAL_URL_PATTERN) || [];
  if (matches.length > MAX_LINKS_ALLOWED) {
    return {
      isMalicious: true,
      reason: `Exceeded maximum allowed links per comment (${MAX_LINKS_ALLOWED})`,
      linkCount: matches.length,
    };
  }

  return { isMalicious: false, linkCount: matches.length };
}

/**
 * Extracts @mentions from text
 */
export function extractMentions(text) {
  if (!text || typeof text !== 'string') return [];
  const matches = text.match(/@([a-zA-Z0-9_\.\-]+)/g) || [];
  return [...new Set(matches.map((m) => m.slice(1).trim()))];
}

/**
 * Sanitizes text to prevent HTML injection and XSS
 */
export function sanitizeCommentText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .trim()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Generates normalized content fingerprint for duplicate detection
 */
export function generateContentFingerprint(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}
