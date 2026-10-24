import React, { useState, useEffect } from 'react';
import { Play, X, SkipForward } from 'lucide-react';

/**
 * Next-Video Countdown Overlay
 * Displays an interactive card when video ends with a 10s countdown and a cancel option.
 */
export default function NextVideoOverlay({
  nextVideo,
  onPlayNext,
  onCancel,
  countdownSeconds = 8,
}) {
  const [secondsLeft, setSecondsLeft] = useState(countdownSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onPlayNext?.();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, onPlayNext]);

  if (!nextVideo) return null;

  const progressPercent = ((countdownSeconds - secondsLeft) / countdownSeconds) * 100;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4 select-none">
      <div className="relative max-w-md w-full bg-surface-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden p-6 text-white">
        {/* Countdown Progress Bar Header */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-surface-800">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Top Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-400">
            <SkipForward className="w-4 h-4 animate-pulse" />
            <span>Up Next in {secondsLeft}s</span>
          </div>
          <button
            onClick={onCancel}
            title="Cancel auto-play (Esc)"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-surface-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Next Video Card Preview */}
        <div className="flex gap-4 items-center mb-6 p-3 rounded-xl bg-surface-950/60 border border-white/[0.06]">
          <div className="relative w-28 h-18 rounded-lg overflow-hidden shrink-0 bg-slate-800">
            <img
              src={nextVideo.thumbnailUrl}
              alt={nextVideo.title}
              className="w-full h-full object-cover"
            />
            {nextVideo.durationFormatted && (
              <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/80 text-white font-medium">
                {nextVideo.durationFormatted}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-brand-300 uppercase tracking-wider truncate mb-0.5">
              {nextVideo.category}
            </p>
            <h4 className="text-sm font-semibold text-white line-clamp-2 leading-snug">
              {nextVideo.title}
            </h4>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onPlayNext}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-brand-500/25 transition-all"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Play Now</span>
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-slate-700 bg-surface-800/80 hover:bg-surface-700 text-slate-300 hover:text-white font-medium text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
