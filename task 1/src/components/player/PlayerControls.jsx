import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  Volume2,
  Volume1,
  VolumeX,
  Subtitles,
  Maximize,
  Minimize,
  Maximize2,
  Minimize2,
  PictureInPicture,
  Settings,
  HelpCircle,
  Check,
} from 'lucide-react';
import ScrubBar from './ScrubBar';
import { formatTime, formatRemainingTime } from '../../utils/formatTime';

const SPEED_OPTIONS = [0.5, 1, 1.25, 1.5, 2];

/**
 * Bottom Player Control Bar
 */
export default function PlayerControls({
  isPlaying,
  isMuted,
  volume,
  currentTime,
  duration,
  bufferedPercent,
  playbackSpeed,
  quality = '1080p Full HD',
  isSubtitlesActive,
  hasSubtitles,
  isTheaterMode,
  isFullscreen,
  isPipActive,
  isPipSupported,
  hasNextVideo,
  previewThumbnail,
  onPlayPause,
  onSeek,
  onScrubbingChange,
  onVolumeChange,
  onToggleMute,
  onSpeedChange,
  onToggleSubtitles,
  onToggleTheater,
  onToggleFullscreen,
  onTogglePip,
  onNextVideo,
  onOpenShortcuts,
}) {
  const [showRemaining, setShowRemaining] = useState(false);
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);
  const speedMenuRef = useRef(null);

  // Close speed menu on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (speedMenuRef.current && !speedMenuRef.current.contains(e.target)) {
        setSpeedMenuOpen(false);
      }
    }
    if (speedMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [speedMenuOpen]);

  // Volume icon resolution
  const renderVolumeIcon = () => {
    if (isMuted || volume === 0) {
      return <VolumeX className="w-5 h-5 text-rose-400" />;
    }
    if (volume < 0.5) {
      return <Volume1 className="w-5 h-5 text-slate-200" />;
    }
    return <Volume2 className="w-5 h-5 text-slate-200" />;
  };

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 px-3 sm:px-4 pb-3 pt-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300">
      {/* 1. Interactive Scrub Bar */}
      <ScrubBar
        currentTime={currentTime}
        duration={duration}
        bufferedPercent={bufferedPercent}
        onSeek={onSeek}
        onScrubbingChange={onScrubbingChange}
        previewThumbnail={previewThumbnail}
      />

      {/* 2. Controls Bottom Bar */}
      <div className="flex items-center justify-between gap-2 mt-1 select-none">
        {/* Left Section: Play, Next, Volume, Timestamps */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Play / Pause Button */}
          <button
            onClick={onPlayPause}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="p-2 rounded-xl text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-white" />
            ) : (
              <Play className="w-5 h-5 fill-white" />
            )}
          </button>

          {/* Next Video Button */}
          {hasNextVideo && (
            <button
              onClick={onNextVideo}
              title="Next Video (Shift+N)"
              aria-label="Next Video"
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>
          )}

          {/* Volume Control: Button + Slider */}
          <div className="flex items-center group/vol">
            <button
              onClick={onToggleMute}
              title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              className="p-2 rounded-xl text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {renderVolumeIcon()}
            </button>

            {/* Volume Slider */}
            <div className="w-0 group-hover/vol:w-20 sm:group-hover/vol:w-24 group-focus-within/vol:w-24 transition-all duration-200 overflow-hidden flex items-center pr-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}% (↑/↓)`}
                aria-label="Volume slider"
                className="w-full h-1.5 rounded-lg appearance-none bg-white/20 accent-brand-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Timestamp Display */}
          <button
            onClick={() => setShowRemaining(!showRemaining)}
            title="Click to toggle remaining time"
            aria-label="Toggle time format"
            className="px-2 py-1 rounded text-xs font-mono font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <span>{formatTime(currentTime)}</span>
            <span className="mx-1 text-slate-400">/</span>
            <span className="text-slate-400">
              {showRemaining
                ? formatRemainingTime(currentTime, duration)
                : formatTime(duration)}
            </span>
          </button>
        </div>

        {/* Right Section: Subtitles, Speed, Quality, PiP, Theater, Fullscreen */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Subtitles / Captions Button */}
          <button
            onClick={onToggleSubtitles}
            disabled={!hasSubtitles}
            title={
              !hasSubtitles
                ? 'Captions not available for this video'
                : isSubtitlesActive
                ? 'Turn off captions (C)'
                : 'Turn on captions (C)'
            }
            aria-label="Toggle captions"
            className={`p-2 rounded-xl transition-colors relative focus:outline-none focus:ring-2 focus:ring-brand-500 ${
              !hasSubtitles
                ? 'opacity-40 cursor-not-allowed text-slate-500'
                : isSubtitlesActive
                ? 'text-brand-400 bg-brand-500/20'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Subtitles className="w-4 h-4" />
            {isSubtitlesActive && (
              <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-brand-400" />
            )}
          </button>

          {/* Playback Speed Dropdown */}
          <div className="relative" ref={speedMenuRef}>
            <button
              onClick={() => setSpeedMenuOpen(!speedMenuOpen)}
              title="Playback Speed (> / <)"
              aria-label="Playback speed"
              className="px-2 py-1 rounded-xl text-xs font-mono font-semibold text-slate-200 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {playbackSpeed}x
            </button>

            {speedMenuOpen && (
              <div className="absolute right-0 bottom-full mb-2 w-32 rounded-xl bg-surface-900 border border-slate-700 shadow-2xl py-1.5 z-50 animate-fade-in backdrop-blur-md">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  Speed
                </div>
                {SPEED_OPTIONS.map((speed) => (
                  <button
                    key={speed}
                    onClick={() => {
                      onSpeedChange(speed);
                      setSpeedMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors ${
                      playbackSpeed === speed
                        ? 'text-brand-400 font-bold bg-brand-500/10'
                        : 'text-slate-300 hover:text-white hover:bg-surface-800'
                    }`}
                  >
                    <span>{speed === 1 ? '1x (Normal)' : `${speed}x`}</span>
                    {playbackSpeed === speed && <Check className="w-3.5 h-3.5 text-brand-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Honest Video Quality Indicator */}
          {quality && (
            <span
              title={`Source Resolution: ${quality}`}
              className="hidden md:inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-white/10 text-slate-300 border border-white/10"
            >
              {quality.includes('1080p') ? '1080p' : '720p'}
            </span>
          )}

          {/* Picture-in-Picture Button */}
          <button
            onClick={onTogglePip}
            disabled={!isPipSupported}
            title={
              !isPipSupported
                ? 'Picture-in-Picture not supported in this browser'
                : isPipActive
                ? 'Exit Picture-in-Picture (P)'
                : 'Enter Picture-in-Picture (P)'
            }
            aria-label="Toggle Picture-in-Picture"
            className={`p-2 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
              !isPipSupported
                ? 'opacity-40 cursor-not-allowed text-slate-500'
                : isPipActive
                ? 'text-brand-400 bg-brand-500/20'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <PictureInPicture className="w-4 h-4" />
          </button>

          {/* Theater Mode Button */}
          <button
            onClick={onToggleTheater}
            title={isTheaterMode ? 'Standard View (T)' : 'Theater Mode (T)'}
            aria-label="Toggle Theater mode"
            className={`hidden sm:block p-2 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
              isTheaterMode
                ? 'text-brand-400 bg-brand-500/20'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            {isTheaterMode ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4" />
            ) : (
              <Maximize className="w-4 h-4" />
            )}
          </button>

          {/* Shortcuts Info Button */}
          <button
            onClick={onOpenShortcuts}
            title="Keyboard Shortcuts (?)"
            aria-label="Keyboard Shortcuts"
            className="hidden sm:block p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
