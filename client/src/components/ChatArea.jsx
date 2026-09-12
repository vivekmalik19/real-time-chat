import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import MessageItem from './MessageItem';
import MessageInput from './MessageInput';
import SearchModal from './SearchModal';
import { formatDate, getAvatarUrl, getStatusColor } from '../utils/helpers';
import {
  Hash,
  Search,
  Users,
  Menu,
  ChevronDown,
  X,
  MessageSquare
} from 'lucide-react';

export default function ChatArea({ onToggleSidebar, onToggleMembers, isMembersOpen }) {
  const {
    activeType,
    activeChannel,
    activeDirectUser,
    messages,
    loadingMessages,
    typingUsers
  } = useChat();

  const { user } = useAuth();
  const [replyTo, setReplyTo] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const scrollRef = useRef(null);

  // Auto-scroll to bottom on messages update
  const scrollToBottom = (smooth = true) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [activeChannel?._id, activeDirectUser?._id]);

  useEffect(() => {
    // Only auto-scroll if near bottom
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
      if (isNearBottom) {
        scrollToBottom(true);
      }
    }
  }, [messages]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 200);
    }
  };

  const handleJumpToMessage = (messageId) => {
    const el = document.getElementById(`message-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('bg-brand-500/20');
      setTimeout(() => el.classList.remove('bg-brand-500/20'), 2000);
    }
  };

  // Convert typing map to readable text
  const typingList = Object.values(typingUsers);
  let typingText = '';
  if (typingList.length === 1) {
    typingText = `${typingList[0]} is typing...`;
  } else if (typingList.length > 1) {
    typingText = `${typingList.slice(0, 2).join(', ')} and others are typing...`;
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-dark-bg min-w-0 relative">
      {/* Chat Top Bar */}
      <header className="h-16 px-4 border-b border-dark-border bg-dark-sidebar/90 backdrop-blur flex items-center justify-between z-10 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile sidebar toggle button */}
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-dark-hover"
          >
            <Menu className="w-5 h-5" />
          </button>

          {activeType === 'channel' && activeChannel ? (
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 flex-shrink-0">
                <Hash className="w-5 h-5" />
              </div>
              <div className="truncate">
                <h2 className="text-sm font-bold text-slate-100 truncate">
                  #{activeChannel.name}
                </h2>
                <p className="text-[11px] text-slate-400 truncate">
                  {activeChannel.description || 'Channel conversation'}
                </p>
              </div>
            </div>
          ) : activeType === 'direct' && activeDirectUser ? (
            <div className="flex items-center gap-2.5 truncate">
              <div className="relative flex-shrink-0">
                <img
                  src={getAvatarUrl(activeDirectUser)}
                  alt={activeDirectUser.username}
                  className="w-9 h-9 rounded-xl bg-dark-card border border-dark-border"
                />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-dark-sidebar ${getStatusColor(
                    activeDirectUser.status
                  )}`}
                />
              </div>
              <div className="truncate">
                <h2 className="text-sm font-bold text-slate-100 truncate">
                  @{activeDirectUser.username}
                </h2>
                <p className="text-[11px] text-slate-400 truncate">
                  {activeDirectUser.customStatus || 'Direct Message'}
                </p>
              </div>
            </div>
          ) : (
            <h2 className="text-sm font-semibold text-slate-400">Select a conversation</h2>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsSearchOpen(true)}
            title="Search in conversation"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-dark-hover transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleMembers}
            title={isMembersOpen ? 'Hide members list' : 'Show members list'}
            className={`p-2 rounded-xl transition-colors ${
              isMembersOpen
                ? 'text-brand-400 bg-brand-500/10'
                : 'text-slate-400 hover:text-white hover:bg-dark-hover'
            }`}
          >
            <Users className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Message Feed Area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-2 py-4 space-y-3 relative"
      >
        {loadingMessages ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-slate-400 text-xs">
              <span className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></span>
              <span>Loading messages...</span>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-dark-card border border-dark-border flex items-center justify-center text-slate-500">
              <MessageSquare className="w-7 h-7 text-brand-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-200">
              {activeType === 'channel'
                ? `Welcome to #${activeChannel?.name || 'this channel'}!`
                : `This is the start of your direct conversation with @${activeDirectUser?.username}!`}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm">
              Send a greeting, share an image or code snippet to start the conversation!
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const prevMsg = messages[index - 1];
            const showDateDivider =
              !prevMsg || formatDate(prevMsg.createdAt) !== formatDate(msg.createdAt);

            return (
              <React.Fragment key={msg._id}>
                {showDateDivider && (
                  <div className="flex items-center my-4">
                    <div className="flex-1 border-t border-dark-border/80"></div>
                    <span className="px-3 text-[11px] font-semibold text-slate-500 bg-dark-card border border-dark-border/60 rounded-full py-0.5">
                      {formatDate(msg.createdAt)}
                    </span>
                    <div className="flex-1 border-t border-dark-border/80"></div>
                  </div>
                )}
                <MessageItem
                  message={msg}
                  onReply={(targetMsg) => setReplyTo(targetMsg)}
                  onImageClick={(url) => setPreviewImage(url)}
                />
              </React.Fragment>
            );
          })
        )}
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute right-6 bottom-20 z-20 flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white text-xs font-semibold rounded-full shadow-lg shadow-brand-500/30 hover:bg-brand-500 transition-all animate-bounce"
        >
          <span>Jump to Latest</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Live Typing Status Bar */}
      {typingText && (
        <div className="px-6 py-1 bg-dark-sidebar/40 text-[11px] text-brand-400 flex items-center gap-2">
          <span className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce"></span>
            <span
              className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce"
              style={{ animationDelay: '0.2s' }}
            ></span>
            <span
              className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce"
              style={{ animationDelay: '0.4s' }}
            ></span>
          </span>
          <span>{typingText}</span>
        </div>
      )}

      {/* Message Input Bar */}
      <MessageInput
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectMessage={handleJumpToMessage}
      />

      {/* Fullscreen Image Preview Lightbox */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 cursor-zoom-out animate-fadeIn"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 p-1 text-slate-300 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
