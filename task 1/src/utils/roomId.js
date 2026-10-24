/**
 * Utility functions for generating and validating Meeting Room IDs
 */

/**
 * Generates a unique room ID in the format MF-XXXXXX (e.g., MF-A7K29X)
 * @returns {string}
 */
export function generateRoomId() {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // omits easily confused characters like O, 0, 1, I
  let randomPart = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomPart += characters[randomIndex];
  }
  return `MF-${randomPart}`;
}

/**
 * Validates a room ID string
 * @param {string} id 
 * @returns {{ isValid: boolean, error?: string, sanitizedId: string }}
 */
export function validateRoomId(id) {
  if (!id || typeof id !== 'string') {
    return { isValid: false, error: 'Please enter a Meeting ID to join', sanitizedId: '' };
  }

  const trimmed = id.trim().toUpperCase();

  if (trimmed.length === 0) {
    return { isValid: false, error: 'Meeting ID cannot be empty', sanitizedId: '' };
  }

  // Support both full ID with prefix "MF-ABC123" and without prefix "ABC123" or with spaces/hyphens
  const cleaned = trimmed.replace(/\s+/g, '');

  if (cleaned.length < 4) {
    return { isValid: false, error: 'Meeting ID is too short (minimum 4 characters)', sanitizedId: cleaned };
  }

  return { isValid: true, sanitizedId: cleaned };
}
