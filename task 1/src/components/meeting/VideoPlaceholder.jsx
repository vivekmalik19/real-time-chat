import React, { useRef, useEffect } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  User,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import Button from '../common/Button';

/**
 * Real Video Canvas & Placeholder Component
 * Displays live mirrored HTML5 <video> when camera is on, camera-off state when disabled,
 * and user permission request prompt prior to device access.
 */
export default function VideoPlaceholder({
  roomId,
  stream = null,
  mediaStatus = 'idle', // 'idle' | 'requesting' | 'connected' | 'error'
  isMediaGranted = false,
  isCamEnabled = false,
  isMicEnabled = false,
  onRequestMedia,
  error = null,
}) {
  const videoRef = useRef(null);

  // Attach MediaStream to the video element whenever stream changes
  useEffect(() => {
    if (videoRef.current) {
      if (stream) {
        videoRef.current.srcObject = stream;
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-2 sm:p-4 lg:p-6 overflow-hidden">
      {/* Video Canvas Container */}
      <div
        className={`relative w-full max-w-5xl aspect-video max-h-[74vh] rounded-3xl border shadow-2xl flex flex-col items-center justify-center overflow-hidden transition-all duration-300 backdrop-blur-xl ${
          isMediaGranted && isCamEnabled
            ? 'bg-black border-slate-700/80 shadow-brand-500/10'
            : isMediaGranted
            ? 'bg-surface-950/95 border-slate-800 shadow-black/50'
            : 'bg-surface-900/90 border-white/[0.08] shadow-2xl'
        }`}
      >
        {/* Subtle grid backdrop pattern for non-video states */}
        {(!isMediaGranted || !isCamEnabled) && (
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '28px 28px',
            }}
          />
        )}

        {/* Ambient Glow */}
        {isMediaGranted && isCamEnabled && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-600/15 rounded-full blur-[110px] pointer-events-none" />
        )}

        {/* =========================================================================
            STATE 1: LIVE VIDEO FEED (Camera is granted & enabled)
           ========================================================================= */}
        {isMediaGranted && isCamEnabled && (
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
            {/* Real HTML5 Video element (muted for local self-view to prevent acoustic feedback loop) */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100 select-none pointer-events-none"
            />

            {/* Top Left Floating Status Badge */}
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 z-20">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-950/80 border border-slate-800 text-xs font-medium text-slate-200 backdrop-blur-md shadow-lg">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span className="hidden sm:inline">Waiting for participants...</span>
                <span className="sm:hidden">Waiting...</span>
              </div>
            </div>

            {/* Top Right Live Camera Badge */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 z-20">
              <div className="px-3 py-1 rounded-full text-xs font-medium bg-surface-950/80 border border-emerald-500/40 text-emerald-300 flex items-center gap-1.5 backdrop-blur-md shadow-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Live Camera</span>
              </div>
            </div>

            {/* Bottom Left Local User Pill */}
            <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 flex items-center gap-2 bg-surface-950/85 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-200 backdrop-blur-md z-20 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>You (Host)</span>
            </div>

            {/* Bottom Right Audio State Pill */}
            <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 flex items-center gap-2 z-20">
              <div
                className={`p-2 rounded-xl border backdrop-blur-md shadow-lg flex items-center gap-1.5 text-xs font-medium ${
                  isMicEnabled
                    ? 'bg-surface-950/85 border-emerald-500/30 text-emerald-300'
                    : 'bg-surface-950/85 border-rose-500/30 text-rose-300'
                }`}
                title={isMicEnabled ? 'Microphone active' : 'Microphone muted'}
              >
                {isMicEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                <span className="hidden sm:inline">
                  {isMicEnabled ? 'Mic active' : 'Mic muted'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STATE 2: CAMERA IS OFF (Permission granted, but video track disabled)
           ========================================================================= */}
        {isMediaGranted && !isCamEnabled && (
          <div className="relative flex flex-col items-center text-center z-10 max-w-md px-4 py-8 animate-fade-in">
            {/* Top Left Floating Status Badge */}
            <div className="absolute -top-12 left-0 sm:-top-16 sm:-left-4 flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-950/80 border border-slate-800 text-xs font-medium text-slate-300 backdrop-blur-md shadow-md">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span>Waiting for participants...</span>
              </div>
            </div>

            {/* Avatar & Off Icon */}
            <div className="relative mb-5">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-surface-900 border border-slate-700/80 p-[3px] shadow-2xl flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-surface-950 flex items-center justify-center">
                  <User className="w-12 h-12 text-slate-400" />
                </div>
              </div>
              <div className="absolute bottom-0 right-0 p-1.5 rounded-full bg-surface-900 border border-slate-700 text-rose-400 shadow-md">
                <VideoOff className="w-4 h-4" />
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium mb-3">
              <VideoOff className="w-3.5 h-3.5" />
              <span>Camera is off</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
              Your video is paused
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mb-6 max-w-sm leading-relaxed">
              Your camera track is currently turned off. Click the camera icon in the bottom dock to resume live video preview.
            </p>

            {/* Mic Status Pill while camera is off */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-950/90 border border-slate-800 text-xs text-slate-300">
              {isMicEnabled ? (
                <>
                  <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Microphone is active</span>
                </>
              ) : (
                <>
                  <MicOff className="w-3.5 h-3.5 text-rose-400" />
                  <span>Microphone is muted</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            STATE 3: REQUESTING PERMISSION (Loading animation)
           ========================================================================= */}
        {mediaStatus === 'requesting' && (
          <div className="relative flex flex-col items-center text-center z-10 max-w-md px-6 py-8 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center mb-5 shadow-xl">
              <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
              Requesting Device Access
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
              Please click <strong>Allow</strong> when prompted by your browser to grant camera and microphone permissions.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-950/80 border border-slate-800 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
              <span>MeetFlow requests local preview only</span>
            </div>
          </div>
        )}

        {/* =========================================================================
            STATE 4: PERMISSION ERROR (Denial / Device missing / In-use)
           ========================================================================= */}
        {mediaStatus === 'error' && (
          <div className="relative flex flex-col items-center text-center z-10 max-w-md px-6 py-8 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-4 shadow-xl">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
              {error?.title || 'Camera & Microphone Access Error'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed bg-surface-950/80 p-3.5 rounded-xl border border-rose-500/20 text-left">
              {error?.message ||
                'Unable to access camera or microphone devices. Please verify browser permissions and device connections.'}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <Button
                variant="primary"
                fullWidth
                iconLeft={RefreshCw}
                onClick={onRequestMedia}
              >
                {error?.actionText || 'Try Again'}
              </Button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STATE 5: INITIAL / IDLE STATE (Before user requests permissions)
           ========================================================================= */}
        {mediaStatus === 'idle' && !isMediaGranted && (
          <div className="relative flex flex-col items-center text-center z-10 max-w-lg px-6 py-8 animate-fade-in">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/25 text-brand-300 text-xs font-semibold mb-5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Local Media Preview</span>
            </div>

            {/* Avatar icon */}
            <div className="relative mb-5">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 p-[2px] shadow-xl">
                <div className="w-full h-full rounded-[14px] bg-surface-950 flex items-center justify-center">
                  <Video className="w-10 h-10 text-brand-400" />
                </div>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">
              Ready to Join the Meeting?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed max-w-md">
              Enable your camera and microphone to start your live video self-view. You will be able to mute audio and turn off your camera at any time.
            </p>

            {/* Primary CTA: Enable Camera & Microphone */}
            <div className="w-full max-w-xs space-y-3">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                iconLeft={Video}
                onClick={onRequestMedia}
                className="shadow-xl shadow-brand-500/20 text-sm font-semibold"
              >
                Enable Camera & Microphone
              </Button>
            </div>

            {/* Security note */}
            <div className="flex items-center gap-2 mt-6 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Permission is requested on demand and audio is muted locally.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
