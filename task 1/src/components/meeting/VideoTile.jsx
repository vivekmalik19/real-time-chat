import React, { useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  User,
  Shield,
  VolumeX,
  Volume2,
  Signal,
  Hand,
  MonitorUp,
  Sparkles,
} from 'lucide-react';

export default function VideoTile({
  stream = null,
  name = 'Participant',
  avatar = null,
  isLocal = false,
  isHost = false,
  isCoHost = false,
  micOn = true,
  camOn = true,
  handRaised = false,
  isScreenShare = false,
  isSpeaking = false,
  isLocallyMuted = false,
  connectionQuality = 'good', // 'good' | 'fair' | 'poor'
  onToggleLocalMute,
}) {
  const videoRef = useRef(null);

  // Bind MediaStream to <video> element
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
    <div
      className={`relative w-full h-full rounded-2xl md:rounded-3xl overflow-hidden bg-surface-950 border transition-all duration-200 shadow-xl flex items-center justify-center group ${
        isSpeaking
          ? 'ring-2 ring-emerald-500 shadow-emerald-500/20 border-emerald-500/50'
          : 'border-slate-800/80 hover:border-slate-700'
      }`}
    >
      {/* 1. Live Video Stream */}
      {camOn && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal || isLocallyMuted}
          className={`w-full h-full object-cover select-none pointer-events-none ${
            isLocal && !isScreenShare ? '-scale-x-100' : ''
          }`}
        />
      ) : (
        /* 2. Camera Off Avatar State */
        <div className="flex flex-col items-center justify-center space-y-3 select-none">
          <div className="relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-bold text-xl sm:text-2xl flex items-center justify-center shadow-lg overflow-hidden">
              {avatar ? (
                <img src={avatar} alt={name} className="w-full h-full object-cover" />
              ) : (
                <span>{name ? name.charAt(0).toUpperCase() : 'U'}</span>
              )}
            </div>

            {/* Speaking Pulse Ring */}
            {isSpeaking && (
              <span className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-75 pointer-events-none" />
            )}
          </div>

          <span className="text-xs font-semibold text-slate-300 truncate max-w-[140px]">
            {name}
          </span>
        </div>
      )}

      {/* Top Left Badges: Roles, Screen Share, Hand Raised */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 z-20">
        {isHost && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-md flex items-center gap-1 shadow-sm">
            <Shield className="w-3 h-3 text-amber-400" />
            <span>Host</span>
          </span>
        )}

        {isCoHost && !isHost && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 backdrop-blur-md shadow-sm">
            Co-Host
          </span>
        )}

        {isScreenShare && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/40 backdrop-blur-md flex items-center gap-1 shadow-sm">
            <MonitorUp className="w-3 h-3 text-brand-400" />
            <span>Screen</span>
          </span>
        )}

        {handRaised && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/90 text-surface-950 flex items-center gap-1 shadow-md animate-bounce">
            <Hand className="w-3 h-3 fill-surface-950" />
            <span>Raised Hand</span>
          </span>
        )}
      </div>

      {/* Top Right: Connection Quality & Local Mute Toggle */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
        {/* Remote local mute action */}
        {!isLocal && onToggleLocalMute && (
          <button
            onClick={onToggleLocalMute}
            title={isLocallyMuted ? 'Unmute locally' : 'Mute locally on your speaker'}
            className={`p-1.5 rounded-xl text-xs backdrop-blur-md transition-all ${
              isLocallyMuted
                ? 'bg-rose-500/80 text-white'
                : 'bg-surface-950/70 text-slate-300 hover:text-white hover:bg-surface-800'
            }`}
          >
            {isLocallyMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        )}

        {/* Connection Quality Indicator */}
        <div
          title={`Connection: ${connectionQuality.toUpperCase()}`}
          className="p-1.5 rounded-xl bg-surface-950/70 backdrop-blur-md text-slate-300 border border-slate-800/80 flex items-center"
        >
          <Signal
            className={`w-3.5 h-3.5 ${
              connectionQuality === 'good'
                ? 'text-emerald-400'
                : connectionQuality === 'fair'
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}
          />
        </div>
      </div>

      {/* Bottom Bar: Participant Name and Mic Status */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-surface-950/80 backdrop-blur-md border border-slate-800/80 text-slate-200 text-xs font-medium max-w-[70%]">
          <span className="truncate">{name}</span>
          {isLocal && <span className="text-slate-400 font-normal">(You)</span>}
        </div>

        {/* Mic Indicator */}
        <div
          className={`p-1.5 rounded-xl backdrop-blur-md border shadow-md flex items-center justify-center ${
            micOn
              ? 'bg-surface-950/80 text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
          }`}
        >
          {micOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
        </div>
      </div>
    </div>
  );
}
