import React from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  MonitorOff,
  Users,
  MessageSquare,
  PhoneOff,
  Info,
  Clock,
  Hand,
  Radio,
  Circle,
  Square,
  Shield,
} from 'lucide-react';

export default function MeetingControls({
  roomId,
  isMicOn = false,
  onToggleMic,
  isCamOn = false,
  onToggleCam,
  isMediaGranted = false,
  isScreenSharing = false,
  onToggleScreenShare,
  handRaised = false,
  onToggleRaiseHand,
  isRecording = false,
  onToggleRecording,
  isHost = false,
  participantCount = 1,
  unreadChatCount = 0,
  activePanel = null,
  onTogglePanel,
  onRequestLeave,
  formattedTime = '00:00',
}) {
  return (
    <footer
      className="h-20 sm:h-24 bg-surface-950/95 border-t border-white/[0.08] backdrop-blur-xl px-3 sm:px-6 flex items-center justify-between shrink-0 select-none relative z-40"
      aria-label="Meeting controls bar"
    >
      {/* Left: Meeting duration timer & room ID */}
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
      <div className="flex items-center justify-center gap-2 sm:gap-2.5 mx-auto">
        {/* 1. Microphone Toggle */}
        <div className="relative group">
          <button
            onClick={onToggleMic}
            title={!isMediaGranted ? 'Enable Microphone' : isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-md ${
              !isMediaGranted
                ? 'bg-surface-800 hover:bg-surface-700 text-slate-400 border border-slate-700/80'
                : isMicOn
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                : 'bg-surface-800 hover:bg-surface-700 text-rose-400 border border-slate-700/80'
            }`}
          >
            {isMediaGranted && isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>
          <span className="hidden sm:block absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-900 border border-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
            {isMicOn ? 'Mute Mic' : 'Unmute Mic'}
          </span>
        </div>

        {/* 2. Camera Toggle */}
        <div className="relative group">
          <button
            onClick={onToggleCam}
            title={!isMediaGranted ? 'Enable Camera' : isCamOn ? 'Turn Off Camera' : 'Turn On Camera'}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-md ${
              !isMediaGranted
                ? 'bg-surface-800 hover:bg-surface-700 text-slate-400 border border-slate-700/80'
                : isCamOn
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                : 'bg-surface-800 hover:bg-surface-700 text-rose-400 border border-slate-700/80'
            }`}
          >
            {isMediaGranted && isCamOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>
          <span className="hidden sm:block absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-900 border border-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
            {isCamOn ? 'Turn Off Cam' : 'Turn On Cam'}
          </span>
        </div>

        {/* 3. Screen Share Toggle */}
        <div className="relative group">
          <button
            onClick={onToggleScreenShare}
            title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-md ${
              isScreenSharing
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                : 'bg-surface-800 hover:bg-surface-700 text-slate-300 hover:text-white border border-slate-700/80'
            }`}
          >
            {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <MonitorUp className="w-5 h-5" />}
          </button>
          <span className="hidden sm:block absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-900 border border-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
            {isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
          </span>
        </div>

        {/* 4. Raise Hand Toggle */}
        <div className="relative group">
          <button
            onClick={onToggleRaiseHand}
            title={handRaised ? 'Lower Hand' : 'Raise Hand'}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-md ${
              handRaised
                ? 'bg-amber-500 text-surface-950 font-bold shadow-amber-500/30'
                : 'bg-surface-800 hover:bg-surface-700 text-slate-300 hover:text-white border border-slate-700/80'
            }`}
          >
            <Hand className={`w-5 h-5 ${handRaised ? 'fill-surface-950' : ''}`} />
          </button>
          <span className="hidden sm:block absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-900 border border-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
            {handRaised ? 'Lower Hand' : 'Raise Hand'}
          </span>
        </div>

        {/* 5. Host Local Recording (Host Only) */}
        {isHost && (
          <div className="relative group">
            <button
              onClick={onToggleRecording}
              title={isRecording ? 'Stop Recording' : 'Record Meeting (Host)'}
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-md ${
                isRecording
                  ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse shadow-rose-600/30'
                  : 'bg-surface-800 hover:bg-surface-700 text-rose-400 hover:text-rose-300 border border-slate-700/80'
              }`}
            >
              {isRecording ? <Square className="w-4 h-4 fill-white" /> : <Circle className="w-4 h-4 fill-rose-500" />}
            </button>
            <span className="hidden sm:block absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-900 border border-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
              {isRecording ? 'Stop Recording' : 'Record Call'}
            </span>
          </div>
        )}

        {/* Divider */}
        <div className="h-6 w-[1px] bg-slate-800 mx-0.5 sm:mx-1"></div>

        {/* 6. Participants Panel Toggle */}
        <div className="relative group">
          <button
            onClick={() => onTogglePanel('participants')}
            title="Participants"
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl border flex items-center justify-center transition-all duration-200 shadow-md relative ${
              activePanel === 'participants'
                ? 'bg-brand-600 text-white border-brand-500 shadow-brand-600/30'
                : 'bg-surface-800 hover:bg-surface-700 text-slate-300 hover:text-white border-slate-700/80'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-500 text-[9px] font-bold text-white rounded-full flex items-center justify-center border-2 border-surface-950 font-mono">
              {participantCount}
            </span>
          </button>
          <span className="hidden sm:block absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-900 border border-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
            People ({participantCount})
          </span>
        </div>

        {/* 7. Chat Panel Toggle */}
        <div className="relative group">
          <button
            onClick={() => onTogglePanel('chat')}
            title="Chat"
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl border flex items-center justify-center transition-all duration-200 shadow-md relative ${
              activePanel === 'chat'
                ? 'bg-brand-600 text-white border-brand-500 shadow-brand-600/30'
                : 'bg-surface-800 hover:bg-surface-700 text-slate-300 hover:text-white border-slate-700/80'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            {unreadChatCount > 0 && activePanel !== 'chat' && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-[9px] font-bold text-white rounded-full flex items-center justify-center border-2 border-surface-950 animate-bounce">
                {unreadChatCount}
              </span>
            )}
          </button>
          <span className="hidden sm:block absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-900 border border-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
            In-call Chat
          </span>
        </div>

        {/* Divider */}
        <div className="h-6 w-[1px] bg-slate-800 mx-0.5 sm:mx-1"></div>

        {/* 8. Leave Meeting Button */}
        <div className="relative group">
          <button
            onClick={onRequestLeave}
            title="Leave or End Meeting"
            className="px-4 sm:px-5 h-10 sm:h-12 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all duration-200 active:scale-95"
          >
            <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span className="hidden sm:inline">Leave</span>
          </button>
          <span className="hidden sm:block absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-900 border border-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
            Leave Call
          </span>
        </div>
      </div>

      {/* Right: Meeting Info on Desktop */}
      <div className="hidden md:flex items-center justify-end gap-2 w-1/4">
        <button
          onClick={() => onTogglePanel('info')}
          title="Meeting Details"
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
