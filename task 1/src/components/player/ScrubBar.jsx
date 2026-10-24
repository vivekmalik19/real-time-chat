import React, { useState, useRef, useEffect, useCallback } from 'react';
import { formatTime } from '../../utils/formatTime';

/**
 * Interactive Scrub Bar for Custom HTML5 Video Player
 * Supports click & drag seeking, buffered range indicators, and hover timestamp preview.
 */
export default function ScrubBar({
  currentTime = 0,
  duration = 0,
  bufferedPercent = 0,
  onSeek,
  onScrubbingChange,
  previewThumbnail = null, // Valid thumbnail preview URL if available, else null
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(null);
  const [hoverPosition, setHoverPosition] = useState(null); // { x, percent, time }
  const trackRef = useRef(null);

  // Calculate active percentage (use dragTime if currently scrubbing)
  const activeTime = isDragging && dragTime !== null ? dragTime : currentTime;
  const playedPercent = duration > 0 ? Math.min(100, Math.max(0, (activeTime / duration) * 100)) : 0;

  // Calculate time from pointer event relative to track width
  const getTimeFromPointer = useCallback(
    (clientX) => {
      if (!trackRef.current || duration <= 0) return 0;
      const rect = trackRef.current.getBoundingClientRect();
      const clampedX = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const ratio = clampedX / rect.width;
      return ratio * duration;
    },
    [duration]
  );

  // Handle pointer down (starts seeking / dragging)
  const handlePointerDown = (e) => {
    e.preventDefault();
    trackRef.current?.setPointerCapture(e.pointerId);
    setIsDragging(true);
    onScrubbingChange?.(true);

    const targetTime = getTimeFromPointer(e.clientX);
    setDragTime(targetTime);
  };

  // Handle pointer move (updates dragTime while dragging, or hover preview)
  const handlePointerMove = (e) => {
    if (!trackRef.current || duration <= 0) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clampedX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = (clampedX / rect.width) * 100;
    const time = (clampedX / rect.width) * duration;

    setHoverPosition({ x: clampedX, percent, time });

    if (isDragging) {
      setDragTime(time);
    }
  };

  // Handle pointer up (commits final seek)
  const handlePointerUp = (e) => {
    if (isDragging) {
      if (trackRef.current?.hasPointerCapture(e.pointerId)) {
        trackRef.current.releasePointerCapture(e.pointerId);
      }
      setIsDragging(false);
      onScrubbingChange?.(false);

      const targetTime = dragTime !== null ? dragTime : getTimeFromPointer(e.clientX);
      onSeek?.(targetTime);
      setDragTime(null);
    }
  };

  const handlePointerLeave = () => {
    if (!isDragging) {
      setHoverPosition(null);
    }
  };

  // Keyboard accessibility for scrub bar
  const handleKeyDown = (e) => {
    if (duration <= 0) return;
    let step = 5;
    if (e.shiftKey) step = 15;

    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      const newTime = Math.min(duration, currentTime + step);
      onSeek?.(newTime);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      const newTime = Math.max(0, currentTime - step);
      onSeek?.(newTime);
    } else if (e.key === 'Home') {
      e.preventDefault();
      onSeek?.(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      onSeek?.(duration);
    }
  };

  return (
    <div
      className="relative w-full py-2.5 cursor-pointer group select-none touch-none"
      ref={trackRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      tabIndex={0}
      role="slider"
      aria-label="Timeline scrubber"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(activeTime)}
      aria-valuetext={`${formatTime(activeTime)} of ${formatTime(duration)}`}
      onKeyDown={handleKeyDown}
    >
      {/* Track base */}
      <div className="relative w-full h-1.5 group-hover:h-2.5 rounded-full bg-white/20 transition-all duration-150 overflow-visible">
        {/* Buffered progress track */}
        <div
          className="absolute top-0 left-0 h-full rounded-full bg-white/30 pointer-events-none transition-all duration-200"
          style={{ width: `${Math.min(100, Math.max(0, bufferedPercent))}%` }}
        />

        {/* Hover ghost track */}
        {hoverPosition && (
          <div
            className="absolute top-0 left-0 h-full rounded-full bg-white/20 pointer-events-none transition-all"
            style={{ width: `${hoverPosition.percent}%` }}
          />
        )}

        {/* Played progress fill track */}
        <div
          className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-brand-500 via-indigo-500 to-purple-500 pointer-events-none transition-all duration-75"
          style={{ width: `${playedPercent}%` }}
        />

        {/* Scrubber thumb knob */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-lg shadow-black/50 border border-brand-500 pointer-events-none transition-transform duration-100 ${
            isDragging ? 'scale-125 ring-4 ring-brand-500/40' : 'scale-0 group-hover:scale-100'
          }`}
          style={{ left: `${playedPercent}%` }}
        />
      </div>

      {/* Hover preview tooltip */}
      {hoverPosition && (
        <div
          className="absolute bottom-5 -translate-x-1/2 pointer-events-none z-30 transition-opacity duration-150 animate-fade-in flex flex-col items-center"
          style={{ left: `${hoverPosition.percent}%` }}
        >
          {previewThumbnail ? (
            <div className="mb-1 p-1 bg-surface-950/95 border border-white/20 rounded-lg shadow-xl backdrop-blur-md overflow-hidden">
              <img
                src={previewThumbnail}
                alt="Thumbnail preview"
                className="w-32 h-18 object-cover rounded"
              />
              <span className="block text-center text-[10px] font-mono text-white mt-1">
                {formatTime(hoverPosition.time)}
              </span>
            </div>
          ) : (
            <div className="px-2 py-1 bg-surface-950/95 border border-white/20 rounded-md shadow-xl backdrop-blur-md text-[11px] font-mono font-semibold text-white whitespace-nowrap">
              {formatTime(hoverPosition.time)}
            </div>
          )}
          {/* Arrow */}
          <div className="w-2 h-2 bg-surface-950 rotate-45 -mt-1 border-r border-b border-white/20" />
        </div>
      )}
    </div>
  );
}
