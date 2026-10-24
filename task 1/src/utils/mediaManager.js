/**
 * Global Single-Playback Manager
 * Ensures that only one video or audio stream can play at a time across the entire application.
 */

const PLAYING_EVENT = 'meetflow-media-play';

export const mediaManager = {
  /**
   * Notify the app that a player with `playerId` has started playing.
   * Pauses all other standard HTML5 media elements in the DOM.
   * @param {string} playerId
   */
  notifyPlay(playerId) {
    if (typeof window === 'undefined') return;

    // Pause all other native media elements in the DOM that might be running
    const allMedia = document.querySelectorAll('video, audio');
    allMedia.forEach((el) => {
      // Don't pause the element belonging to the active player
      if (el.dataset.playerId !== playerId && !el.paused) {
        el.pause();
      }
    });

    // Dispatch custom event for React player components
    window.dispatchEvent(
      new CustomEvent(PLAYING_EVENT, {
        detail: { activePlayerId: playerId },
      })
    );
  },

  /**
   * Subscribe to other players starting playback.
   * Calls `callback` when a DIFFERENT player begins playback.
   * @param {string} playerId
   * @param {Function} onOtherPlay
   * @returns {Function} unsubscribe function
   */
  subscribe(playerId, onOtherPlay) {
    if (typeof window === 'undefined') return () => {};

    const handler = (event) => {
      if (event.detail?.activePlayerId && event.detail.activePlayerId !== playerId) {
        onOtherPlay();
      }
    };

    window.addEventListener(PLAYING_EVENT, handler);
    return () => window.removeEventListener(PLAYING_EVENT, handler);
  },
};
