/**
 * Client-Side Watch Progress Storage Utility
 * Scopes local progress storage to prevent cross-user data exposure:
 * - Authenticated users: 'meetflow_user_<userId>_progress_<videoId>'
 * - Anonymous / Guest: 'meetflow_guest_progress_<videoId>'
 */

export function getScopedKey(videoId, userId) {
  if (userId) {
    return `meetflow_user_${userId}_progress_${videoId}`;
  }
  return `meetflow_guest_progress_${videoId}`;
}

export function getStoredProgress(videoId, userId) {
  try {
    const key = getScopedKey(videoId, userId);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.currentTime === 'number') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveStoredProgress(videoId, data, userId) {
  try {
    const key = getScopedKey(videoId, userId);
    const payload = {
      currentTime: Math.max(0, Math.round(data.currentTime || 0)),
      duration: Math.max(0, Math.round(data.duration || 0)),
      completionPercentage: Math.min(100, Math.max(0, Math.round(data.completionPercentage || 0))),
      completed: Boolean(data.completed),
      lastWatched: data.lastWatched || new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(payload));
    return payload;
  } catch (err) {
    console.warn('LocalStorage progress save failed:', err);
    return null;
  }
}

export function removeStoredProgress(videoId, userId) {
  try {
    const key = getScopedKey(videoId, userId);
    localStorage.removeItem(key);
  } catch {
    // Ignore error
  }
}

export function getAllStoredProgress(userId) {
  try {
    const prefix = userId ? `meetflow_user_${userId}_progress_` : 'meetflow_guest_progress_';
    const results = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const videoId = key.substring(prefix.length);
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const data = JSON.parse(raw);
            results.push({ videoId, ...data });
          } catch {
            // Ignore parse error
          }
        }
      }
    }
    // Sort descending by lastWatched
    return results.sort((a, b) => new Date(b.lastWatched || 0) - new Date(a.lastWatched || 0));
  } catch {
    return [];
  }
}

export function clearUserProgress(userId) {
  try {
    const prefix = `meetflow_user_${userId}_progress_`;
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        toRemove.push(key);
      }
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // Ignore error
  }
}
