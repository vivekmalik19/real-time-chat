import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { formatTime, formatFileSize, getAvatarUrl } from '../utils/helpers';
import {
  Reply,
  Trash2,
  Smile,
  FileText,
  Download,
  CornerDownRight,
  ExternalLink
} from 'lucide-react';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🔥', '🎉', '🚀'];

export default function MessageItem({ message, onReply, onImageClick }) {
  const { user } = useAuth();
  const { toggleReaction, deleteMessage } = useChat();
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);

  const isOwn = message.sender?._id === user?._id || message.sender === user?._id;
  const isDeleted = message.isDeleted;

  const handleReactionClick = (emoji) => {
    toggleReaction(message._id, emoji);
    setShowEmojiMenu(false);
  };

  const handleDelete = () => {
    if (window.confirm('Delete this message?')) {
      deleteMessage(message._id);
    }
  };

  // Basic markdown & link formatter
  const renderFormattedText = (text) => {
    if (!text) return null;

    // Split text into tokens (URLs and code snippets)
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-400 hover:text-brand-300 underline inline-flex items-center gap-0.5 break-all"
          >
            {part} <ExternalLink className="w-3 h-3 inline" />
          </a>
        );
      }
      return <span key={i} className="whitespace-pre-wrap">{part}</span>;
    });
  };

  return (
    <div
      id={`message-${message._id}`}
      className={`group relative flex gap-3 px-4 py-2 hover:bg-dark-card/40 transition-colors rounded-xl ${
        isDeleted ? 'opacity-60 italic' : ''
      }`}
    >
      {/* Floating Actions on Hover */}
      {!isDeleted && (
        <div className="absolute right-4 -top-3 hidden group-hover:flex items-center gap-1 bg-dark-sidebar border border-dark-border shadow-lg rounded-xl px-1.5 py-1 z-10 animate-fadeIn">
          {/* Quick Reaction Emojis */}
          <div className="flex items-center gap-0.5 pr-1 border-r border-dark-border">
            {QUICK_EMOJIS.slice(0, 4).map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReactionClick(emoji)}
                className="hover:scale-125 transition-transform p-1 text-xs"
                title={`React ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Reply Button */}
          <button
            onClick={() => onReply(message)}
            title="Reply"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-hover transition-colors"
          >
            <Reply className="w-3.5 h-3.5" />
          </button>

          {/* Delete Button (if author) */}
          {isOwn && (
            <button
              onClick={handleDelete}
              title="Delete message"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Sender Avatar */}
      <div className="flex-shrink-0 pt-0.5">
        <img
          src={getAvatarUrl(message.sender)}
          alt={message.sender?.username || 'User'}
          className="w-9 h-9 rounded-xl bg-dark-card border border-dark-border object-cover"
        />
      </div>

      {/* Message Body */}
      <div className="flex-1 min-w-0">
        {/* Reply Quote Banner */}
        {message.replyTo && (
          <div className="flex items-center gap-1.5 mb-1.5 text-xs text-slate-400 bg-dark-card/60 border-l-2 border-brand-500 rounded-r-lg px-2 py-1 max-w-lg truncate">
            <CornerDownRight className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
            <span className="font-semibold text-slate-300">
              {message.replyTo.sender?.username || 'User'}:
            </span>
            <span className="truncate text-slate-400">{message.replyTo.content || 'Attachment'}</span>
          </div>
        )}

        {/* Sender Name & Timestamp */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-xs font-bold text-slate-200">
            {message.sender?.username || 'Anonymous'}
          </span>
          <span className="text-[11px] text-slate-500">{formatTime(message.createdAt)}</span>
        </div>

        {/* Message Content */}
        <div className="text-xs text-slate-200 leading-relaxed break-words">
          {renderFormattedText(message.content)}
        </div>

        {/* Attachments */}
        {message.attachment && message.attachment.url && !isDeleted && (
          <div className="mt-2 max-w-md">
            {message.attachment.fileType?.startsWith('image/') ||
            message.messageType === 'image' ? (
              <div className="relative group/img overflow-hidden rounded-xl border border-dark-border bg-dark-card">
                <img
                  src={message.attachment.url}
                  alt={message.attachment.filename || 'Shared image'}
                  onClick={() => onImageClick && onImageClick(message.attachment.url)}
                  className="max-h-72 w-auto object-cover rounded-xl cursor-pointer hover:opacity-95 transition-opacity"
                />
              </div>
            ) : (
              <a
                href={message.attachment.url}
                download={message.attachment.filename}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl bg-dark-card border border-dark-border hover:bg-dark-hover hover:border-brand-500/50 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-200 truncate">
                    {message.attachment.filename}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {formatFileSize(message.attachment.fileSize)}
                  </p>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-white flex-shrink-0" />
              </a>
            )}
          </div>
        )}

        {/* Reactions List */}
        {message.reactions && message.reactions.length > 0 && !isDeleted && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {message.reactions.map((reaction) => {
              const hasReacted = reaction.users?.some(
                (u) => (u._id || u) === user?._id
              );
              return (
                <button
                  key={reaction.emoji}
                  onClick={() => handleReactionClick(reaction.emoji)}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-xs transition-all ${
                    hasReacted
                      ? 'bg-brand-500/20 border-brand-500/50 text-brand-300 font-semibold'
                      : 'bg-dark-card border-dark-border text-slate-400 hover:bg-dark-hover'
                  }`}
                  title={`${reaction.users?.map((u) => u.username || 'User').join(', ')}`}
                >
                  <span>{reaction.emoji}</span>
                  <span className="text-[11px] font-bold">{reaction.users?.length || 1}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
