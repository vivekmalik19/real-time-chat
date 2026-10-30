import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Users,
  MessageSquare,
  Info,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Copy,
  Share2,
  Send,
  Shield,
  ShieldAlert,
  Lock,
  Unlock,
  Volume2,
  VolumeX,
  UserX,
  UserCheck,
  Paperclip,
  Smile,
  Hand,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
} from 'lucide-react';
import { formatRelativeTime } from '../../utils/formatTime';

const QUICK_EMOJIS = ['👍', '👏', '❤️', '🔥', '😂', '🎉', '✋', '💡'];

export default function MeetingSidebar({
  activePanel,
  onClose,
  onSwitchPanel,
  roomId,
  user,
  isHost = false,
  isCoHost = false,
  peers = [],
  isMicOn = true,
  isCamOn = true,
  handRaised = false,
  chatMessages = [],
  onSendMessage,
  onPerformHostAction,
  locallyMutedPeers = new Set(),
  onToggleLocalMute,
  roomSettings = { isLocked: false, chatEnabled: true },
  onCopyRoomId,
  onShareInvitation,
}) {
  const [inputText, setInputText] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [fileAttachment, setFileAttachment] = useState(null);
  const [fileError, setFileError] = useState(null);
  const fileInputRef = useRef(null);
  const chatScrollRef = useRef(null);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    if (activePanel === 'chat' && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, activePanel]);

  if (!activePanel) return null;

  // Handle send message
  const handleSendChat = (e) => {
    e.preventDefault();
    if (!inputText.trim() && !fileAttachment && !selectedEmoji) return;

    onSendMessage(inputText.trim(), selectedEmoji, fileAttachment);
    setInputText('');
    setSelectedEmoji(null);
    setFileAttachment(null);
    setFileError(null);
  };

  // Handle file selection with 10MB limit and safe extension check
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);

    if (file.size > 10 * 1024 * 1024) {
      setFileError('File size exceeds the 10MB limit.');
      return;
    }

    const disallowed = ['.exe', '.bat', '.cmd', '.sh', '.msi', '.scr', '.vbs', '.apk'];
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (disallowed.includes(ext)) {
      setFileError('Executable files are prohibited for security.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFileAttachment({
        name: file.name,
        size: file.size,
        type: file.type,
        data: reader.result,
      });
    };
    reader.readAsDataURL(file);
  };

  const totalParticipants = peers.length + 1;

  return (
    <aside
      className="w-full sm:w-80 md:w-96 bg-surface-900 border-l border-white/[0.08] flex flex-col h-full shadow-2xl relative z-30 transition-all duration-300 animate-fade-in shrink-0"
      aria-label="Meeting sidebar"
    >
      {/* Top Sidebar Header & Tabs */}
      <div className="p-4 border-b border-white/[0.08] bg-surface-950/60 flex flex-col gap-3 shrink-0">
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
            >
              <Users className="w-3.5 h-3.5" />
              <span>People ({totalParticipants})</span>
            </button>

            <button
              onClick={() => onSwitchPanel('chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activePanel === 'chat'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-surface-800'
              }`}
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
            >
              <Info className="w-3.5 h-3.5" />
              <span>Info</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-surface-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          PANEL 1: PARTICIPANTS & HOST MODERATION
         ========================================================================= */}
      {activePanel === 'participants' && (
        <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-4">
          {/* Host Meeting Lock Bar */}
          {(isHost || isCoHost) && (
            <div className="p-3 rounded-2xl bg-surface-950/70 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                {roomSettings.isLocked ? (
                  <Lock className="w-4 h-4 text-amber-400" />
                ) : (
                  <Unlock className="w-4 h-4 text-slate-400" />
                )}
                <span className="font-semibold text-white">Lock Meeting</span>
              </div>
              <button
                onClick={() =>
                  onPerformHostAction('lock-meeting', null, { enabled: !roomSettings.isLocked })
                }
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  roomSettings.isLocked
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-surface-800 hover:bg-surface-700 text-slate-300'
                }`}
              >
                {roomSettings.isLocked ? 'Locked' : 'Unlock'}
              </button>
            </div>
          )}

          {/* Participant List */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block px-1">
              In This Meeting ({totalParticipants})
            </span>

            {/* 1. Self Entry */}
            <div className="p-3 rounded-2xl bg-surface-950/50 border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="You" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span>{user?.name ? user.name.charAt(0).toUpperCase() : 'Y'}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white block truncate">
                    {user?.name || 'You'} <span className="text-brand-400 font-normal">(You)</span>
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    {isHost && <span className="text-amber-400 font-semibold">Host</span>}
                    {isCoHost && !isHost && <span className="text-indigo-400 font-semibold">Co-Host</span>}
                    {handRaised && <span className="text-amber-300">✋ Hand Raised</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-slate-400">
                {isMicOn ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5 text-rose-400" />}
                {isCamOn ? <Video className="w-3.5 h-3.5 text-emerald-400" /> : <VideoOff className="w-3.5 h-3.5 text-rose-400" />}
              </div>
            </div>

            {/* 2. Remote Peers Entries */}
            {peers.map((peer) => {
              const isLocallyMuted = locallyMutedPeers.has(peer.socketId);

              return (
                <div
                  key={peer.socketId}
                  className="p-3 rounded-2xl bg-surface-950/40 border border-slate-800/60 flex items-center justify-between group hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-200 font-bold text-xs flex items-center justify-center shrink-0">
                      {peer.avatar ? (
                        <img src={peer.avatar} alt={peer.name} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <span>{peer.name ? peer.name.charAt(0).toUpperCase() : 'P'}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-white block truncate">{peer.name}</span>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        {peer.isHost && <span className="text-amber-400 font-semibold">Host</span>}
                        {peer.isCoHost && <span className="text-indigo-400 font-semibold">Co-Host</span>}
                        {peer.handRaised && <span className="text-amber-300">✋ Hand Raised</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Local mute toggle for remote peer */}
                    <button
                      onClick={() => onToggleLocalMute(peer.socketId)}
                      title={isLocallyMuted ? 'Unmute on your speakers' : 'Mute on your speakers'}
                      className={`p-1.5 rounded-lg text-xs ${
                        isLocallyMuted
                          ? 'text-rose-400 bg-rose-500/10'
                          : 'text-slate-400 hover:text-white hover:bg-surface-800'
                      }`}
                    >
                      {isLocallyMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>

                    {/* Mic indicator */}
                    <span className="p-1 text-xs">
                      {peer.micOn ? (
                        <Mic className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <MicOff className="w-3.5 h-3.5 text-rose-400" />
                      )}
                    </span>

                    {/* Camera indicator */}
                    <span className="p-1 text-xs">
                      {peer.camOn ? (
                        <Video className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <VideoOff className="w-3.5 h-3.5 text-rose-400" />
                      )}
                    </span>

                    {/* Host Moderation Menu for this Peer */}
                    {(isHost || isCoHost) && !peer.isHost && (
                      <div className="flex items-center gap-1 ml-1 pl-1 border-l border-slate-800">
                        {/* Request Mute */}
                        <button
                          onClick={() => onPerformHostAction('mute-request', peer.socketId)}
                          title="Ask participant to mute"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-surface-800"
                        >
                          <MicOff className="w-3.5 h-3.5" />
                        </button>

                        {/* Assign/Revoke Co-Host (Primary host only) */}
                        {isHost && (
                          <button
                            onClick={() =>
                              onPerformHostAction('assign-cohost', peer.socketId, {
                                isCoHost: !peer.isCoHost,
                              })
                            }
                            title={peer.isCoHost ? 'Revoke Co-Host' : 'Make Co-Host'}
                            className={`p-1.5 rounded-lg text-xs ${
                              peer.isCoHost
                                ? 'text-indigo-400 bg-indigo-500/10'
                                : 'text-slate-400 hover:text-indigo-300 hover:bg-surface-800'
                            }`}
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Remove from meeting (Kick) */}
                        <button
                          onClick={() => {
                            if (window.confirm(`Remove ${peer.name} from the meeting?`)) {
                              onPerformHostAction('remove-participant', peer.socketId);
                            }
                          }}
                          title="Remove participant"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          PANEL 2: IN-CALL CHAT & FILE SHARING
         ========================================================================= */}
      {activePanel === 'chat' && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages Feed */}
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-1">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs font-semibold text-slate-400">No messages yet</p>
                <p className="text-[11px] text-slate-500">
                  Send a message, emoji reaction, or file to meeting attendees.
                </p>
              </div>
            ) : (
              chatMessages.map((msg) => {
                const isMe = msg.senderSocketId === user?._id || msg.senderName === (user?.name || 'You');

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                  >
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 px-1">
                      <span className="font-semibold text-slate-300">{isMe ? 'You' : msg.senderName}</span>
                      <span>•</span>
                      <span>{formatRelativeTime(msg.timestamp)}</span>
                    </div>

                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed break-words shadow-sm ${
                        isMe
                          ? 'bg-brand-600 text-white rounded-br-none'
                          : 'bg-surface-950 border border-slate-800 text-slate-200 rounded-bl-none'
                      }`}
                    >
                      {/* Emoji reaction */}
                      {msg.emoji && <div className="text-xl mb-1">{msg.emoji}</div>}

                      {/* Text content */}
                      {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}

                      {/* File Attachment */}
                      {msg.file && (
                        <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between gap-2 bg-black/20 p-2 rounded-xl text-[11px]">
                          <div className="flex items-center gap-1.5 truncate">
                            <FileText className="w-4 h-4 shrink-0 text-brand-300" />
                            <span className="truncate">{msg.file.name}</span>
                          </div>
                          {msg.file.data && (
                            <a
                              href={msg.file.data}
                              download={msg.file.name}
                              className="p-1 rounded-lg hover:bg-white/10 text-white shrink-0"
                              title="Download attachment"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Chat Composer */}
          <form onSubmit={handleSendChat} className="p-3 border-t border-slate-800 bg-surface-950/80 space-y-2 shrink-0">
            {/* Quick Emoji Bar */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  type="button"
                  key={emoji}
                  onClick={() => onSendMessage('', emoji, null)}
                  className="px-2 py-0.5 rounded-lg bg-surface-900 hover:bg-surface-800 text-sm transition-all"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Selected File Chip */}
            {fileAttachment && (
              <div className="flex items-center justify-between p-2 rounded-xl bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{fileAttachment.name}</span>
                  <span className="text-[10px] text-slate-400">({(fileAttachment.size / 1024).toFixed(0)} KB)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFileAttachment(null)}
                  className="p-0.5 rounded hover:bg-brand-500/20"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {fileError && (
              <p className="text-[11px] text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>{fileError}</span>
              </p>
            )}

            {/* Input Bar */}
            <div className="flex items-center gap-1.5">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Attach file (max 10MB)"
                className="p-2 rounded-xl bg-surface-900 hover:bg-surface-800 text-slate-400 hover:text-white transition-colors"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Message everyone in meeting..."
                className="flex-1 px-3 py-2 rounded-xl bg-surface-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />

              <button
                type="submit"
                disabled={!inputText.trim() && !fileAttachment}
                className="p-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white transition-all disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          PANEL 3: MEETING INFORMATION & TOPOLOGY
         ========================================================================= */}
      {activePanel === 'info' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="p-4 rounded-2xl bg-surface-950/70 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Meeting Invitation
            </h4>

            <div>
              <span className="text-[11px] text-slate-500 block mb-1">Room ID:</span>
              <div className="flex items-center justify-between p-2 rounded-xl bg-surface-900 border border-slate-800">
                <span className="font-mono text-xs text-white font-bold">{roomId}</span>
                <button
                  onClick={onCopyRoomId}
                  className="p-1 rounded-lg hover:bg-surface-800 text-brand-400"
                  title="Copy Room ID"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <button
              onClick={onShareInvitation}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors shadow-md shadow-brand-600/20"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Copy Full Invitation Link</span>
            </button>
          </div>

          {/* WebRTC Mesh Architecture Notice */}
          <div className="p-4 rounded-2xl bg-surface-950/40 border border-slate-800 text-xs space-y-2 text-slate-400">
            <h5 className="font-semibold text-white flex items-center gap-1.5">
              <span>WebRTC Mesh Architecture</span>
            </h5>
            <p className="leading-relaxed text-[11px]">
              This meeting uses a peer-to-peer full mesh topology. Each participant transmits their audio/video stream directly to every other participant via DTLS-SRTP.
            </p>
            <div className="p-2.5 rounded-xl bg-surface-900 border border-slate-800/80 font-mono text-[10px] space-y-1">
              <div>• Topology: Peer-to-Peer Full Mesh</div>
              <div>• Scalability Limit: Up to 6 participants</div>
              <div>• Signaling: Socket.IO on Node.js</div>
              <div>• STUN: stun.l.google.com:19302</div>
              <div>• TURN: Configurable via env variables</div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
