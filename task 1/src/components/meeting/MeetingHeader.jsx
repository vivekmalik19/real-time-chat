import React from 'react';
import { Link } from 'react-router-dom';
import {
  Video,
  Copy,
  ShieldCheck,
  Clock,
  Share2,
  Info,
} from 'lucide-react';
import Button from '../common/Button';
import MediaStatus from './MediaStatus';

/**
 * Polished meeting header with room details, live duration timer, media status, and clipboard actions
 */
export default function MeetingHeader({
  roomId,
  formattedTime = '00:00',
  onCopyRoomId,
  onShareInvitation,
  onToggleInfoPanel,
  isInfoPanelOpen = false,
  mediaStatus = 'idle',
  isCamEnabled = false,
  isMicEnabled = false,
  isMediaGranted = false,
}) {
  return (
    <header
      className="h-16 border-b border-white/[0.08] bg-surface-950/90 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between shrink-0 select-none z-20"
      aria-label="Meeting Header"
    >
      {/* Left: Brand & Room ID */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        <Link to="/" className="flex items-center gap-2 group" title="Back to MeetFlow Home">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-500 p-[1px] shadow-sm">
            <div className="w-full h-full bg-surface-950 rounded-[11px] flex items-center justify-center">
              <Video className="w-4 h-4 text-brand-400 group-hover:scale-105 transition-transform" />
            </div>
          </div>
          <span className="font-bold text-sm text-white hidden sm:inline tracking-tight font-sans">
            Meet<span className="text-brand-400">Flow</span>
          </span>
        </Link>

        <div className="h-4 w-[1px] bg-slate-800 hidden sm:block"></div>

        {/* Room Badge with Copy Room ID button */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-surface-900 border border-slate-800 rounded-xl px-2.5 sm:px-3 py-1.5 shadow-sm">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Room
            </span>
            <span className="text-xs sm:text-sm font-mono font-bold text-slate-100 tracking-wider">
              {roomId}
            </span>
          </div>

          <button
            onClick={onCopyRoomId}
            title="Copy Room ID to clipboard"
            aria-label="Copy Room ID"
            className="ml-1 p-1 rounded-md text-slate-400 hover:text-white hover:bg-surface-800 transition-colors flex items-center gap-1 text-xs"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium text-slate-400 hidden md:inline">
              Copy ID
            </span>
          </button>
        </div>
      </div>

      {/* Center: Meeting Status & Live Timer */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Waiting Status Badge */}
        <div className="flex items-center gap-2 text-xs text-slate-300 bg-surface-900/80 px-2.5 sm:px-3 py-1.5 rounded-full border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          <span className="hidden sm:inline">Waiting for participants...</span>
          <span className="sm:hidden text-[11px]">Waiting...</span>
        </div>

        {/* Meeting Duration Timer */}
        <div
          className="flex items-center gap-1.5 text-xs text-slate-300 bg-surface-900/80 px-2.5 py-1.5 rounded-full border border-slate-800 font-mono"
          title="Meeting duration"
        >
          <Clock className="w-3 h-3 text-brand-400 shrink-0" />
          <span>{formattedTime}</span>
        </div>
      </div>

      {/* Right: Media Status, Security info & Share Invitation */}
      <div className="flex items-center gap-2">
        {/* Media Status Component */}
        <MediaStatus
          mediaStatus={mediaStatus}
          isCamEnabled={isCamEnabled}
          isMicEnabled={isMicEnabled}
          isMediaGranted={isMediaGranted}
          className="hidden sm:flex mr-1"
        />

        <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-400 bg-surface-900/50 px-2.5 py-1 rounded-lg border border-slate-800/80">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Encrypted</span>
        </div>

        {/* Share Invitation Button */}
        <Button
          variant="primary"
          size="sm"
          iconLeft={Share2}
          onClick={onShareInvitation}
          className="text-xs py-1.5 px-3"
          title="Copy formatted meeting invitation"
        >
          <span className="hidden sm:inline">Share Invitation</span>
          <span className="sm:hidden">Share</span>
        </Button>

        {/* Meeting Info Toggle */}
        <button
          onClick={onToggleInfoPanel}
          title="Meeting Information"
          aria-label="Meeting information"
          className={`p-2 rounded-xl border transition-all sm:flex hidden items-center ${
            isInfoPanelOpen
              ? 'bg-brand-600 text-white border-brand-500'
              : 'text-slate-400 hover:text-white bg-surface-900/80 border-slate-800 hover:bg-surface-800'
          }`}
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
