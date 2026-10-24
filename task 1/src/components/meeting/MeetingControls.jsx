import React from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  Users,
  MessageSquare,
  PhoneOff,
  Info,
  Clock,
} from 'lucide-react';

/**
 * Reusable interactive meeting control dock
 * Connected to real local camera and microphone tracks
 */
export default function MeetingControls({
  roomId,
  isMicOn = false,
  onToggleMic,
  isCamOn = false,
  onToggleCam,
  isMediaGranted = false,
  activePanel = null,
  onTogglePanel,
  onScreenShareClick,
  onRequestLeave,
  formattedTime = '00:00',
}) {
  return (
    <footer
      className="h-20 sm:h-24 bg-surface-950/95 border-t border-white/[0.08] backdrop-blur-xl px-3 sm:px-6 flex items-center justify-between shrink-0 select-none relative z-40"
      aria-label="Meeting controls bar"
    >
      {/* Left: Meeting duration timer & room ID (desktop/tablet) */}
      <div className="hidden md:flex items-center gap-3 w-1/4">
        <div className="flex items-center gap-2 bg-surface-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
          <Clock className="w-3.5 h-3.5 text-brand-400" />
          <span className="text-xs font-mono font-medium text-slate-300">
            {formattedTime}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-xs font-mono text-slate-400 truncate max-w-[100px]">
            {roomId}
          </span>
        </div>
      </div>

      {/* Center: Essential Meeting Controls */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 mx-auto">
        {/* 1. Microphone Toggle */}
        <div className="relative group">
          <button
            onClick={onToggleMic}
            aria-label={
              !isMediaGranted
                ? 'Enable microphone (permission required)'
                : isMicOn
                ? 'Mute microphone'
                : 'Unmute microphone'
            }
            title={
              !isMediaGranted
                ? 'Enable Microphone (Click to grant access)'
                : isMicOn
                ? 'Mute Microphone'
                : 'Unmute Microphone'
            }
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-950 ${
              !isMediaGranted
                ? 'bg-surface-800 hover:bg-surface-700 text-slate-400 border border-slate-700/80 hover:border-slate-600 focus:ring-slate-500'
                : isMicOn
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 focus:ring-emerald-500'
                : 'bg-surface-800 hover:bg-surface-700 text-rose-400 border border-slate-700/80 hover:border-slate-600 focus:ring-rose-500'
            }`}
          >
            {isMediaGranted && isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>
          <span className="hidden sm:block absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-900 border border-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
            {!isMediaGranted
              ? 'Enable Microphone'
              : isMicOn
              ? 'Mute Mic'
              : 'Unmute Mic'}
          </span>
        </div>

        {/* 2. Camera Toggle */}
        <div className="relative group">
          <button
            onClick={onToggleCam}
            aria-label={
              !isMediaGranted
                ? 'Enable camera (permission required)'
                : isCamOn
                ? 'Turn off camera'
                : 'Turn on camera'
            }
            title={
              !isMediaGranted
                ? 'Enable Camera (Click to grant access)'
                : isCamOn
                ? 'Turn Off Camera'
                : 'Turn On Camera'
            }
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-950 ${
              !isMediaGranted
                ? 'bg-surface-800 hover:bg-surface-700 text-slate-400 border border-slate-700/80 hover:border-slate-600 focus:ring-slate-500'
                : isCamOn
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 focus:ring-emerald-500'
                : 'bg-surface-800 hover:bg-surface-700 text-rose-400 border border-slate-700/80 hover:border-slate-600 focus:ring-rose-500'
            }`}
          >
            {isMediaGranted && isCamOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>
          <span className="hidden sm:block absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-900 border border-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
            {!isMediaGranted
              ? 'Enable Camera'
              : isCamOn
              ? 'Turn Off Camera'
              : 'Turn On Camera'}
          </span>
        </div>

        {/* 3. Screen Share */}
        <div className="relative group">
          <button
            onClick={onScreenShareClick}
            aria-label="Share screen (Coming in Day 5)"
            title="Share screen"
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-surface-800 hover:bg-surface-700 text-slate-300 hover:text-white border border-slate-700/80 hover:border-slate-600 flex items-center justify-center transition-all duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-950 focus:ring-slate-500"
          >
            <MonitorUp className="w-5 h-5" />
          </button>
          <span className="hidden sm:block absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-900 border border-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
            Share Screen
          </span>
        </div>

        {/* Divider */}
        <div className="h-6 w-[1px] bg-slate-800 mx-0.5 sm:mx-1"></div>

        {/* 4. Participants Panel Toggle */}
        <div className="relative group">
          <button
            onClick={() => onTogglePanel('participants')}
            aria-label="Toggle participants panel"
            title="Participants"
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl border flex items-center justify-center transition-all duration-200 shadow-md relative focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-950 focus:ring-brand-500 ${
              activePanel === 'participants'
                ? 'bg-brand-600 text-white border-brand-500 shadow-brand-600/30'
                : 'bg-surface-800 hover:bg-surface-700 text-slate-300 hover:text-white border-slate-700/80 hover:border-slate-600'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-500 text-[9px] font-bold text-white rounded-full flex items-center justify-center border-2 border-surface-950">
              1
            </span>
          </button>
          <span className="hidden sm:block absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-900 border border-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
            Participants (1)
          </span>
        </div>

        {/* 5. Chat Panel Toggle */}
        <div className="relative group">
          <button
            onClick={() => onTogglePanel('chat')}
            aria-label="Toggle in-meeting chat panel"
            title="Chat"
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl border flex items-center justify-center transition-all duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-950 focus:ring-brand-500 ${
              activePanel === 'chat'
                ? 'bg-brand-600 text-white border-brand-500 shadow-brand-600/30'
                : 'bg-surface-800 hover:bg-surface-700 text-slate-300 hover:text-white border-slate-700/80 hover:border-slate-600'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
          </button>
          <span className="hidden sm:block absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-900 border border-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
            In-call Chat
          </span>
        </div>

        {/* 6. Info Panel Toggle (Mobile/Tablet friendly) */}
        <div className="relative group sm:hidden">
          <button
            onClick={() => onTogglePanel('info')}
            aria-label="Meeting information"
            title="Meeting Info"
            className={`w-11 h-11 rounded-2xl border flex items-center justify-center transition-all duration-200 shadow-md ${
              activePanel === 'info'
                ? 'bg-brand-600 text-white border-brand-500 shadow-brand-600/30'
                : 'bg-surface-800 hover:bg-surface-700 text-slate-300 hover:text-white border-slate-700/80'
            }`}
          >
            <Info className="w-5 h-5" />
          </button>
        </div>

        {/* Divider */}
        <div className="h-6 w-[1px] bg-slate-800 mx-0.5 sm:mx-1"></div>

        {/* 7. Leave Meeting Button */}
        <div className="relative group">
          <button
            onClick={onRequestLeave}
            aria-label="Leave meeting"
            title="Leave call"
            className="px-4 sm:px-5 h-11 sm:h-12 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-950 focus:ring-rose-500"
          >
            <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span className="hidden sm:inline">Leave</span>
          </button>
          <span className="hidden sm:block absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-900 border border-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
            Leave Meeting
          </span>
        </div>
      </div>

      {/* Right: Meeting Info Button on Desktop */}
      <div className="hidden md:flex items-center justify-end gap-2 w-1/4">
        <button
          onClick={() => onTogglePanel('info')}
          aria-label="Meeting details"
          title="Meeting Information"
          className={`p-2.5 rounded-xl border transition-all ${
            activePanel === 'info'
              ? 'bg-brand-600 text-white border-brand-500'
              : 'text-slate-400 hover:text-white bg-surface-900/60 hover:bg-surface-800 border-slate-800'
          }`}
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
    </footer>
  );
}
