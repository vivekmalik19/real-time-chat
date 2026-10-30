import React from 'react';
import { ShieldCheck, Lock, Radio, Users, Sparkles, Copy } from 'lucide-react';
import VideoTile from './VideoTile';

export default function MeetingStage({
  localStream,
  user,
  isCamOn,
  isMicOn,
  isHost,
  isCoHost,
  handRaised,
  peers = [],
  isScreenSharing = false,
  isRecording = false,
  recordingHostName = null,
  isLocked = false,
  locallyMutedPeers = new Set(),
  onToggleLocalMute,
  roomId,
  onCopyRoomId,
}) {
  const totalCount = peers.length + 1; // peers + self

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden">
      {/* Floating Status Banners */}
      <div className="absolute top-3 left-4 right-4 flex items-center justify-between gap-2 pointer-events-none z-30">
        {/* Left: Recording banner */}
        {isRecording && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold backdrop-blur-md shadow-lg animate-fade-in pointer-events-auto">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span>Recording in progress ({recordingHostName || 'Host'})</span>
          </div>
        )}

        {/* Right: Room Locked Banner */}
        {isLocked && (
          <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold backdrop-blur-md shadow-lg animate-fade-in pointer-events-auto">
            <Lock className="w-3.5 h-3.5" />
            <span>Meeting Locked</span>
          </div>
        )}
      </div>

      {/* Grid Container */}
      <div
        className={`w-full h-full max-w-6xl max-h-[76vh] grid gap-3 sm:gap-4 items-center justify-center ${
          totalCount === 1
            ? 'grid-cols-1 max-w-4xl'
            : totalCount === 2
            ? 'grid-cols-1 md:grid-cols-2'
            : totalCount <= 4
            ? 'grid-cols-1 sm:grid-cols-2'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {/* 1. Local Video Tile */}
        <VideoTile
          stream={localStream}
          name={user?.name || 'You'}
          avatar={user?.avatar || null}
          isLocal={true}
          isHost={isHost}
          isCoHost={isCoHost}
          micOn={isMicOn}
          camOn={isCamOn}
          handRaised={handRaised}
          isScreenShare={isScreenSharing}
          connectionQuality="good"
        />

        {/* 2. Remote Peers Video Tiles */}
        {peers.map((peer) => (
          <VideoTile
            key={peer.socketId}
            stream={peer.stream}
            name={peer.name}
            avatar={peer.avatar}
            isLocal={false}
            isHost={peer.isHost}
            isCoHost={peer.isCoHost}
            micOn={peer.micOn}
            camOn={peer.camOn}
            handRaised={peer.handRaised}
            isSpeaking={peer.isSpeaking}
            isLocallyMuted={locallyMutedPeers.has(peer.socketId)}
            connectionQuality={peer.connectionQuality || 'good'}
            onToggleLocalMute={() => onToggleLocalMute && onToggleLocalMute(peer.socketId)}
          />
        ))}
      </div>

      {/* When alone in meeting: Friendly Callout to Invite Peers */}
      {peers.length === 0 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-surface-950/80 border border-slate-800 text-xs text-slate-300 backdrop-blur-md shadow-xl animate-fade-in">
          <Users className="w-3.5 h-3.5 text-brand-400" />
          <span>You are the only one here. Share room link to start call:</span>
          <button
            onClick={onCopyRoomId}
            className="flex items-center gap-1 font-mono font-bold text-brand-400 hover:text-brand-300 underline"
          >
            <span>{roomId}</span>
            <Copy className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
