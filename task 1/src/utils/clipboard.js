/**
 * Clipboard utility with fallback and error handling
 */

/**
 * Copies text to the system clipboard with fallback support
 * @param {string} text - Text to copy
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function copyTextToClipboard(text) {
  if (!text) {
    return { success: false, error: 'No text provided to copy' };
  }

  // 1. Try modern navigator.clipboard API
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return { success: true };
    } catch (err) {
      console.warn('navigator.clipboard failed, attempting fallback...', err);
    }
  }

  // 2. Fallback using temporary textarea element
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);

    if (successful) {
      return { success: true };
    } else {
      return { success: false, error: 'Failed to copy to clipboard' };
    }
  } catch (err) {
    return {
      success: false,
      error: err?.message || 'Clipboard access denied or unsupported',
    };
  }
}

/**
 * Formats a complete invitation message with Room ID and meeting URL
 * @param {string} roomId
 * @param {string} url
 * @returns {string}
 */
export function formatMeetingInvitation(roomId, url = window.location.href) {
  return `Join my MeetFlow meeting!\nRoom ID: ${roomId}\nMeeting Link: ${url}`;
}
