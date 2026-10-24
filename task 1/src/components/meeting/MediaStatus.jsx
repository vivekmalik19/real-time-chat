import React from 'react';
import { Video, VideoOff, Mic, MicOff, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

/**
 * Compact Media Status indicator showing real camera, microphone, and device access state
 */
export default function MediaStatus({
  mediaStatus = 'idle',
  isCamEnabled = false,
  isMicEnabled = false,
  isMediaGranted = false,
  className = '',
}) {
  // Determine camera status text and styling
  let camLabel = 'Not connected';
  let camStyle = 'bg-surface-800 text-slate-400 border-slate-700/80';
  let CamIcon = VideoOff;

  if (isMediaGranted) {
    if (isCamEnabled) {
      camLabel = 'On';
      camStyle = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
      CamIcon = Video;
    } else {
      camLabel = 'Off';
      camStyle = 'bg-rose-500/10 text-rose-300 border-rose-500/20';
      CamIcon = VideoOff;
    }
  }

  // Determine microphone status text and styling
  let micLabel = 'Not connected';
  let micStyle = 'bg-surface-800 text-slate-400 border-slate-700/80';
  let MicIcon = MicOff;

  if (isMediaGranted) {
    if (isMicEnabled) {
      micLabel = 'On';
      micStyle = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
      MicIcon = Mic;
    } else {
      micLabel = 'Muted';
      micStyle = 'bg-rose-500/10 text-rose-300 border-rose-500/20';
      MicIcon = MicOff;
    }
  }

  // Determine media access text and styling
  let accessLabel = 'Permission required';
  let accessStyle = 'bg-brand-500/10 text-brand-300 border-brand-500/20';
  let AccessIcon = ShieldCheck;

  if (mediaStatus === 'requesting') {
    accessLabel = 'Requesting...';
    accessStyle = 'bg-amber-500/10 text-amber-300 border-amber-500/20';
    AccessIcon = Loader2;
  } else if (mediaStatus === 'connected') {
    accessLabel = 'Connected';
    accessStyle = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
    AccessIcon = ShieldCheck;
  } else if (mediaStatus === 'error') {
    accessLabel = 'Access error';
    accessStyle = 'bg-rose-500/10 text-rose-300 border-rose-500/20';
    AccessIcon = AlertCircle;
  }

  return (
    <div
      className={`flex items-center gap-1.5 sm:gap-2 text-[11px] font-medium select-none ${className}`}
      aria-label="Local device status indicators"
    >
      {/* Access Badge */}
      <div
        className={`px-2 py-0.5 rounded-lg border flex items-center gap-1 ${accessStyle}`}
        title={`Device Access: ${accessLabel}`}
      >
        <AccessIcon className={`w-3 h-3 ${mediaStatus === 'requesting' ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline">{accessLabel}</span>
      </div>

      {/* Camera Status Badge */}
      <div
        className={`px-2 py-0.5 rounded-lg border flex items-center gap-1 ${camStyle}`}
        title={`Camera: ${camLabel}`}
      >
        <CamIcon className="w-3 h-3" />
        <span className="hidden md:inline">Cam:</span>
        <span>{camLabel}</span>
      </div>

      {/* Microphone Status Badge */}
      <div
        className={`px-2 py-0.5 rounded-lg border flex items-center gap-1 ${micStyle}`}
        title={`Microphone: ${micLabel}`}
      >
        <MicIcon className="w-3 h-3" />
        <span className="hidden md:inline">Mic:</span>
        <span>{micLabel}</span>
      </div>
    </div>
  );
}
