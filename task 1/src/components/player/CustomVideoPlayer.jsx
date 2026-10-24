import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import PlayerControls from './PlayerControls';
import NextVideoOverlay from './NextVideoOverlay';
import ShortcutsModal from './ShortcutsModal';
import { mediaManager } from '../../utils/mediaManager';
import { api } from '../../utils/api';
import { formatTime } from '../../utils/formatTime';

/**
 * Custom HTML5 Video Player
 * Features full custom controls, auto-hide, keyboard shortcuts, PiP,
 * fullscreen, theater mode, periodic watch progress saving, and next-video countdown.
 */
export default function CustomVideoPlayer({
  video,
  nextVideo = null,
  onNavigateNext = null,
  isTheaterMode = false,
  onToggleTheater = null,
  className = '',
}) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const playerId = useRef(`player_${video.id}_${Math.random().toString(36).substring(2, 7)}`).current;

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(video.duration || 0);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState(null);

  // Display modes & controls visibility
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPipSupported, setIsPipSupported] = useState(false);
  const [isPipActive, setIsPipActive] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [centerIconFeedback, setCenterIconFeedback] = useState(null); // 'play' | 'pause'

  // Subtitles & Overlays
  const [hasSubtitles, setHasSubtitles] = useState(Boolean(video.subtitles && video.subtitles.length > 0));
  const [isSubtitlesActive, setIsSubtitlesActive] = useState(false);
  const [showNextOverlay, setShowNextOverlay] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [resumeNotice, setResumeNotice] = useState(null);

  const hideControlsTimerRef = useRef(null);
  const lastSaveTimeRef = useRef(0);
  const prevVolumeRef = useRef(1);

  // Check Picture-in-Picture support
  useEffect(() => {
    if (typeof document !== 'undefined') {
      setIsPipSupported(Boolean(document.pictureInPictureEnabled));
    }
  }, []);

  // Subscribe to single-playback enforcement
  useEffect(() => {
    const unsubscribe = mediaManager.subscribe(playerId, () => {
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
    });
    return unsubscribe;
  }, [playerId]);

  // Load and resume saved progress
  useEffect(() => {
    setShowNextOverlay(false);
    setError(null);
    setIsBuffering(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setBufferedPercent(0);
    setHasSubtitles(Boolean(video.subtitles && video.subtitles.length > 0));

    if (videoRef.current) {
      videoRef.current.load();
    }

    // Check if initial progress exists in server response OR localStorage
    let savedTime = video.progress?.currentTime || 0;
    if (!savedTime) {
      try {
        const local = localStorage.getItem(`meetflow_progress_${video.id}`);
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed && typeof parsed.currentTime === 'number') {
            savedTime = parsed.currentTime;
          }
        }
      } catch {
        // ignore JSON parse error
      }
    }

    const videoDuration = video.duration || 0;
    if (savedTime > 3 && videoDuration && savedTime < videoDuration - 5) {
      setResumeNotice(`Resumed from ${formatTime(savedTime)}`);
      const timer = setTimeout(() => setResumeNotice(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [video.id, video.duration, video.progress]);

  // Apply saved progress on loadedmetadata
  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const vidDuration = videoRef.current.duration;
    setDuration(vidDuration);

    let savedTime = video.progress?.currentTime || 0;
    if (!savedTime) {
      try {
        const local = localStorage.getItem(`meetflow_progress_${video.id}`);
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed && typeof parsed.currentTime === 'number') {
            savedTime = parsed.currentTime;
          }
        }
      } catch {
        // ignore JSON parse error
      }
    }

    if (savedTime > 3 && vidDuration && savedTime < vidDuration - 5) {
      videoRef.current.currentTime = savedTime;
      setCurrentTime(savedTime);
    }
  };

  // Progress saving function (periodically & on pause)
  const saveWatchProgress = useCallback(
    async (timeToSave, explicitDuration) => {
      if (timeToSave === undefined || timeToSave === null || timeToSave < 0) return;
      const currentDuration = explicitDuration || duration || video.duration;

      // Always persist to localStorage for instant local retrieval across guest sessions
      try {
        localStorage.setItem(
          `meetflow_progress_${video.id}`,
          JSON.stringify({
            currentTime: Math.round(timeToSave),
            duration: Math.round(currentDuration),
            timestamp: Date.now(),
          })
        );
      } catch {
        // Ignore storage errors
      }

      // Sync with backend API (supports both authenticated users and anonymous sessions)
      try {
        await api.post(`/videos/${video.id}/progress`, {
          currentTime: Math.round(timeToSave),
          duration: Math.round(currentDuration),
        });
      } catch {
        // Handled gracefully (offline or unauthenticated)
      }
    },
    [video.id, duration, video.duration]
  );

  // Time update event handler
  const handleTimeUpdate = () => {
    if (!videoRef.current || isScrubbing) return;
    const now = videoRef.current.currentTime;
    setCurrentTime(now);

    // Update buffered progress
    if (videoRef.current.buffered.length > 0) {
      const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
      const percent = duration > 0 ? (bufferedEnd / duration) * 100 : 0;
      setBufferedPercent(percent);
    }

    // Periodically save progress every 8 seconds
    if (Math.abs(now - lastSaveTimeRef.current) >= 8) {
      lastSaveTimeRef.current = now;
      saveWatchProgress(now, videoRef.current.duration);
    }
  };

  // Handle Play / Pause toggle
  const togglePlayPause = useCallback(() => {
    if (!videoRef.current) return;

    if (videoRef.current.paused || videoRef.current.ended) {
      videoRef.current
        .play()
        .then(() => {
          mediaManager.notifyPlay(playerId);
          setCenterIconFeedback('play');
          setTimeout(() => setCenterIconFeedback(null), 600);
        })
        .catch((err) => {
          console.warn('Playback prevented:', err);
        });
    } else {
      videoRef.current.pause();
      setCenterIconFeedback('pause');
      setTimeout(() => setCenterIconFeedback(null), 600);
      saveWatchProgress(videoRef.current.currentTime, videoRef.current.duration);
    }
  }, [playerId, saveWatchProgress]);

  // Seeking handler
  const handleSeek = (targetTime) => {
    if (!videoRef.current) return;
    const clampedTime = Math.max(0, Math.min(targetTime, duration));
    videoRef.current.currentTime = clampedTime;
    setCurrentTime(clampedTime);
    saveWatchProgress(clampedTime, duration);
  };

  // Volume handler
  const handleVolumeChange = (newVolume) => {
    if (!videoRef.current) return;
    const clamped = Math.max(0, Math.min(1, newVolume));
    setVolume(clamped);
    videoRef.current.volume = clamped;

    if (clamped > 0 && isMuted) {
      setIsMuted(false);
      videoRef.current.muted = false;
    } else if (clamped === 0 && !isMuted) {
      setIsMuted(true);
      videoRef.current.muted = true;
    }
  };

  // Mute toggle
  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      const restored = prevVolumeRef.current > 0 ? prevVolumeRef.current : 0.5;
      setIsMuted(false);
      videoRef.current.muted = false;
      videoRef.current.volume = restored;
      setVolume(restored);
    } else {
      prevVolumeRef.current = volume;
      setIsMuted(true);
      videoRef.current.muted = true;
    }
  };

  // Playback speed
  const handleSpeedChange = (speed) => {
    if (!videoRef.current) return;
    setPlaybackSpeed(speed);
    videoRef.current.playbackRate = speed;
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch((err) => {
        console.warn('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  // Sync fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Picture-in-Picture toggle
  const togglePip = async () => {
    if (!videoRef.current || !isPipSupported) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.warn('PiP error:', err);
    }
  };

  // Sync PiP events
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const onEnterPip = () => setIsPipActive(true);
    const onLeavePip = () => setIsPipActive(false);

    videoEl.addEventListener('enterpictureinpicture', onEnterPip);
    videoEl.addEventListener('leavepictureinpicture', onLeavePip);

    return () => {
      videoEl.removeEventListener('enterpictureinpicture', onEnterPip);
      videoEl.removeEventListener('leavepictureinpicture', onLeavePip);
    };
  }, []);

  // Subtitles toggle
  const toggleSubtitles = () => {
    if (!videoRef.current || !hasSubtitles) return;
    const tracks = videoRef.current.textTracks;
    if (!tracks || tracks.length === 0) return;

    const nextState = !isSubtitlesActive;
    setIsSubtitlesActive(nextState);

    for (let i = 0; i < tracks.length; i++) {
      tracks[i].mode = nextState ? 'showing' : 'hidden';
    }
  };

  // Auto-hide controls after 2.5s of inactivity while playing
  const resetControlsTimer = useCallback(() => {
    setControlsVisible(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }

    if (isPlaying && !isScrubbing) {
      hideControlsTimerRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 2500);
    }
  }, [isPlaying, isScrubbing]);

  const handlePointerMove = () => {
    resetControlsTimer();
  };

  const handlePointerLeave = () => {
    if (isPlaying && !isScrubbing) {
      setControlsVisible(false);
    }
  };

  // Video ended -> trigger next video countdown if available
  const handleEnded = () => {
    setIsPlaying(false);
    saveWatchProgress(duration, duration); // Marks completion!
    if (nextVideo && onNavigateNext) {
      setShowNextOverlay(true);
    }
  };

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Safety guard: NEVER trigger shortcuts when user is typing in forms/inputs
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName) || activeEl.isContentEditable)
      ) {
        return;
      }

      switch (e.key) {
        case ' ':
        case 'k':
        case 'K':
          e.preventDefault();
          togglePlayPause();
          break;

        case 'ArrowLeft':
          e.preventDefault();
          handleSeek(currentTime - (e.shiftKey ? 30 : 10));
          break;

        case 'ArrowRight':
          e.preventDefault();
          handleSeek(currentTime + (e.shiftKey ? 30 : 10));
          break;

        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange(volume + 0.1);
          break;

        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange(volume - 0.1);
          break;

        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;

        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;

        case 't':
        case 'T':
          e.preventDefault();
          onToggleTheater?.();
          break;

        case 'p':
        case 'P':
          e.preventDefault();
          togglePip();
          break;

        case 'c':
        case 'C':
          e.preventDefault();
          toggleSubtitles();
          break;

        case '>':
          e.preventDefault();
          const speeds = [0.5, 1, 1.25, 1.5, 2];
          const nextSpeedIdx = speeds.indexOf(playbackSpeed) + 1;
          if (nextSpeedIdx < speeds.length) {
            handleSpeedChange(speeds[nextSpeedIdx]);
          }
          break;

        case '<':
          e.preventDefault();
          const speedList = [0.5, 1, 1.25, 1.5, 2];
          const prevSpeedIdx = speedList.indexOf(playbackSpeed) - 1;
          if (prevSpeedIdx >= 0) {
            handleSpeedChange(speedList[prevSpeedIdx]);
          }
          break;

        case 'N':
          if (e.shiftKey && nextVideo && onNavigateNext) {
            e.preventDefault();
            onNavigateNext(nextVideo.id);
          }
          break;

        case '?':
          e.preventDefault();
          setShowShortcutsModal((prev) => !prev);
          break;

        case 'Escape':
          if (showNextOverlay) {
            setShowNextOverlay(false);
          }
          if (showShortcutsModal) {
            setShowShortcutsModal(false);
          }
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    togglePlayPause,
    currentTime,
    duration,
    volume,
    playbackSpeed,
    isTheaterMode,
    nextVideo,
    onNavigateNext,
    showNextOverlay,
    showShortcutsModal,
  ]);

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl group select-none ${
        !controlsVisible && isPlaying ? 'cursor-none' : ''
      } ${className}`}
    >
      {/* HTML5 Video Element */}
      <video
        ref={videoRef}
        src={video.videoUrl}
        poster={video.thumbnailUrl}
        playsInline
        preload="metadata"
        crossOrigin="anonymous"
        data-player-id={playerId}
        onClick={togglePlayPause}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onCanPlay={() => setIsBuffering(false)}
        onEnded={handleEnded}
        onError={() =>
          setError(
            'Unable to load the video stream. Please check your network connection and try again.'
          )
        }
        className="w-full h-full object-contain bg-black"
      >
        {/* Subtitles track if available */}
        {video.subtitles &&
          video.subtitles.map((sub, idx) => (
            <track
              key={idx}
              kind="subtitles"
              src={sub.src}
              srcLang={sub.lang}
              label={sub.label}
              default={sub.default}
              onError={() => {
                console.warn(`Subtitle track "${sub.label}" could not be loaded.`);
                setHasSubtitles(false);
                setIsSubtitlesActive(false);
              }}
              onLoad={() => {
                setHasSubtitles(true);
              }}
            />
          ))}
      </video>

      {/* Center Click Animated Play/Pause Feedback */}
      {centerIconFeedback && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 animate-ping-once">
          <div className="w-20 h-20 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
            {centerIconFeedback === 'play' ? (
              <Play className="w-10 h-10 fill-white translate-x-0.5" />
            ) : (
              <Pause className="w-10 h-10 fill-white" />
            )}
          </div>
        </div>
      )}

      {/* Buffering Spinner Overlay */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 bg-black/30 backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full border-4 border-brand-500/20 border-t-brand-500 animate-spin" />
            <span className="text-xs font-semibold text-white tracking-wider uppercase drop-shadow">
              Buffering
            </span>
          </div>
        </div>
      )}

      {/* Resume from position Floating Badge */}
      {resumeNotice && (
        <div className="absolute top-4 left-4 z-30 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-950/90 border border-brand-500/40 text-brand-300 text-xs font-medium shadow-xl backdrop-blur-md animate-fade-in">
          <Clock className="w-3.5 h-3.5 text-brand-400" />
          <span>{resumeNotice}</span>
        </div>
      )}

      {/* Error State Overlay */}
      {error && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 bg-surface-950/95 text-white backdrop-blur-md">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold mb-1">Playback Error</h3>
          <p className="text-xs text-slate-400 text-center max-w-sm mb-6">{error}</p>
          <button
            onClick={() => {
              setError(null);
              if (videoRef.current) {
                videoRef.current.load();
                videoRef.current.play().catch(() => {});
              }
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs shadow-lg shadow-brand-500/25 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* Next Video Countdown Overlay */}
      {showNextOverlay && nextVideo && (
        <NextVideoOverlay
          nextVideo={nextVideo}
          onPlayNext={() => onNavigateNext?.(nextVideo.id)}
          onCancel={() => setShowNextOverlay(false)}
        />
      )}

      {/* Custom Control Bar (With Smooth Auto-hide) */}
      <div
        className={`transition-opacity duration-300 ${
          controlsVisible || !isPlaying || isScrubbing ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <PlayerControls
          isPlaying={isPlaying}
          isMuted={isMuted}
          volume={volume}
          currentTime={currentTime}
          duration={duration}
          bufferedPercent={bufferedPercent}
          playbackSpeed={playbackSpeed}
          quality={video.quality}
          isSubtitlesActive={isSubtitlesActive}
          hasSubtitles={hasSubtitles}
          isTheaterMode={isTheaterMode}
          isFullscreen={isFullscreen}
          isPipActive={isPipActive}
          isPipSupported={isPipSupported}
          hasNextVideo={Boolean(nextVideo)}
          previewThumbnail={null} // Honest fallback: timestamp tooltip
          onPlayPause={togglePlayPause}
          onSeek={handleSeek}
          onScrubbingChange={(scrubbing) => setIsScrubbing(scrubbing)}
          onVolumeChange={handleVolumeChange}
          onToggleMute={toggleMute}
          onSpeedChange={handleSpeedChange}
          onToggleSubtitles={toggleSubtitles}
          onToggleTheater={onToggleTheater}
          onToggleFullscreen={toggleFullscreen}
          onTogglePip={togglePip}
          onNextVideo={() => onNavigateNext?.(nextVideo.id)}
          onOpenShortcuts={() => setShowShortcutsModal(true)}
        />
      </div>

      {/* Keyboard Shortcuts Modal */}
      <ShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />
    </div>
  );
}
