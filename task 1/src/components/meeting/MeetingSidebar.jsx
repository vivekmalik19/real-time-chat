import React from 'react';
import {
  X,
  Users,
  MessageSquare,
  Info,
  User,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Copy,
  Share2,
  Send,
  ShieldCheck,
  Sparkles,
  Lock,
} from 'lucide-react';
import Button from '../common/Button';

/**
 * Reusable side panel for Participants, Chat, and Meeting Information
 */
export default function MeetingSidebar({
  activePanel,
  onClose,
  onSwitchPanel,
  roomId,
  isMicOn = false,
  isCamOn = false,
  isMediaGranted = false,
  onCopyRoomId,
  onShareInvitation,
}) {
  if (!activePanel) return null;

  return (
    <aside
      className="w-full sm:w-80 md:w-96 bg-surface-900 border-l border-white/[0.08] flex flex-col h-full shadow-2xl relative z-30 transition-all duration-300 animate-fade-in shrink-0"
      aria-label="Meeting sidebar"
    >
      {/* Top Sidebar Header & Tabs */}
      <div className="p-4 border-b border-white/[0.08] bg-surface-950/60 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          {/* Tab Selector Buttons */}
          <div className="flex items-center gap-1 bg-surface-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onSwitchPanel('participants')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activePanel === 'participants'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-surface-800'
              }`}
              title="Participants list"
            >
              <Users className="w-3.5 h-3.5" />
              <span>People (1)</span>
            </button>

            <button
              onClick={() => onSwitchPanel('chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activePanel === 'chat'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-surface-800'
              }`}
              title="In-call chat"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat</span>
            </button>

            <button
              onClick={() => onSwitchPanel('info')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activePanel === 'info'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-surface-800'
              }`}
              title="Meeting Information"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Info</span>
            </button>
          </div>

          {/* Close Sidebar Button */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-surface-800 transition-colors"
            aria-label="Close sidebar panel"
            title="Close panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Panel Content Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col">
        {/* TAB 1: PARTICIPANTS */}
        {activePanel === 'participants' && (
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                In This Call (1)
              </span>
            </div>

            {/* Current Host Row */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-950/60 border border-slate-800/80 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-600 to-purple-600 p-[1.5px]">
                  <div className="w-full h-full rounded-full bg-surface-900 flex items-center justify-center text-xs font-bold text-white">
                    YOU
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-white">You</span>
                    <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-brand-500/10 text-brand-300 border border-brand-500/20">
                      Host
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">Local user</span>
                </div>
              </div>

              {/* Status Icons */}
              <div className="flex items-center gap-1 text-slate-400">
                <div
                  className={`p-1.5 rounded-lg border ${
                    !isMediaGranted
                      ? 'bg-surface-800 border-slate-700/60 text-slate-500'
                      : isMicOn
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-surface-800 border-slate-700 text-rose-400'
                  }`}
                  title={
                    !isMediaGranted
                      ? 'Microphone not connected'
                      : isMicOn
                      ? 'Microphone active (live)'
                      : 'Microphone muted'
                  }
                >
                  {isMediaGranted && isMicOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                </div>

                <div
                  className={`p-1.5 rounded-lg border ${
                    !isMediaGranted
                      ? 'bg-surface-800 border-slate-700/60 text-slate-500'
                      : isCamOn
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-surface-800 border-slate-700 text-rose-400'
                  }`}
                  title={
                    !isMediaGranted
                      ? 'Camera not connected'
                      : isCamOn
                      ? 'Camera on (live)'
                      : 'Camera off'
                  }
                >
                  {isMediaGranted && isCamOn ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                </div>
              </div>
            </div>

            {/* Empty State For Remaining Participants */}
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-2xl bg-surface-950/30">
              <div className="w-12 h-12 rounded-2xl bg-surface-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
                <Users className="w-6 h-6 text-slate-400" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">
                No other participants have joined yet.
              </h4>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-5">
                Share this room link to invite teammates or friends to this conference.
              </p>
              <Button
                variant="primary"
                size="sm"
                iconLeft={Share2}
                onClick={onShareInvitation}
              >
                Share Invitation
              </Button>
            </div>
          </div>
        )}

        {/* TAB 2: CHAT */}
        {activePanel === 'chat' && (
          <div className="flex-1 flex flex-col justify-between">
            {/* Top Notice Pill */}
            <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-300 flex items-start gap-2.5 mb-4">
              <Sparkles className="w-4 h-4 shrink-0 text-brand-400 mt-0.5" />
              <div className="text-xs">
                <strong className="font-semibold block text-brand-200">
                  In-meeting chat is coming soon.
                </strong>
                <span>
                  Real-time messaging, file sharing, and live reactions will be activated during Day 4 with Socket.io.
                </span>
              </div>
            </div>

            {/* Empty Chat Feed Area */}
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800/80 rounded-2xl bg-surface-950/30">
              <div className="w-12 h-12 rounded-2xl bg-surface-800/60 border border-slate-700 flex items-center justify-center text-slate-500 mb-3">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Messages sent during the call will be visible to everyone in the room once chat is enabled.
              </p>
            </div>

            {/* Disabled Chat Input Form */}
            <div className="mt-4 pt-3 border-t border-slate-800">
              <div className="relative flex items-center">
                <input
                  type="text"
                  disabled
                  placeholder="In-meeting chat is coming soon..."
                  className="w-full bg-surface-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-500 cursor-not-allowed placeholder-slate-600 focus:outline-none"
                />
                <button
                  disabled
                  className="absolute right-2 p-1.5 text-slate-600 cursor-not-allowed rounded-lg"
                  title="Messaging disabled in Day 2"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="block mt-1.5 text-[10px] text-slate-500 text-center">
                Chat input is disabled for Day 2 preview
              </span>
            </div>
          </div>
        )}

        {/* TAB 3: MEETING INFORMATION */}
        {activePanel === 'info' && (
          <div className="flex-1 flex flex-col gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Meeting Details
              </span>
            </div>

            {/* Room ID Card */}
            <div className="p-4 rounded-xl bg-surface-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Room ID</span>
                <span className="text-xs font-mono font-bold text-brand-300 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
                  {roomId}
                </span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                iconLeft={Copy}
                onClick={onCopyRoomId}
              >
                Copy Room ID
              </Button>
            </div>

            {/* Full Link Card */}
            <div className="p-4 rounded-xl bg-surface-950/80 border border-slate-800 space-y-2.5">
              <span className="text-xs text-slate-400">Meeting Link</span>
              <div className="p-2 bg-surface-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 truncate select-all">
                {window.location.href}
              </div>
              <Button
                variant="primary"
                size="sm"
                fullWidth
                iconLeft={Share2}
                onClick={onShareInvitation}
              >
                Share Full Invitation
              </Button>
            </div>

            {/* Security Info */}
            <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-300 flex items-start gap-2.5 text-xs">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <div>
                <strong className="font-semibold block text-emerald-200">
                  End-to-End Ready
                </strong>
                <span className="text-slate-400 text-[11px]">
                  All media tracks will use DTLS / SRTP encryption when peer connections launch in Day 3.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
