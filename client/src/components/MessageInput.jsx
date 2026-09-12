import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useChat } from '../context/ChatContext';
import {
  Send,
  Paperclip,
  Smile,
  X,
  Image as ImageIcon,
  File,
  CornerDownRight
} from 'lucide-react';

const EMOJI_LIST = [
  '😀', '😂', '🥹', '😍', '😎', '🥳', '🤔', '🙌',
  '👍', '👎', '👏', '🔥', '✨', '🎉', '🚀', '💯',
  '❤️', '💡', '💬', '☕', '⚡', '💻', '🤝', '👀'
];

export default function MessageInput({ replyTo, onCancelReply }) {
  const { sendMessage, sendTyping, activeChannel, activeDirectUser, activeType } = useChat();
  const [content, setContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-focus input on change
  useEffect(() => {
    textareaRef.current?.focus();
  }, [activeChannel, activeDirectUser, replyTo]);

  // Handle typing debounce
  const handleTextChange = (e) => {
    const val = e.target.value;
    setContent(val);

    // Auto resize
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }

    // Trigger typing event
    sendTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false);
    }, 1500);
  };

  // Handle file select & upload
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be selected again
    e.target.value = '';

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await axios.post('/api/messages/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setAttachment(res.data);
    } catch (err) {
      console.error('File upload error:', err);
      alert('Failed to upload file. Please try a smaller file.');
    } finally {
      setUploading(false);
    }
  };

  const handleSend = () => {
    if ((!content.trim() && !attachment) || uploading) return;

    sendMessage({
      content: content.trim(),
      attachment: attachment || undefined,
      replyToId: replyTo?._id || undefined
    });

    setContent('');
    setAttachment(null);
    setShowEmojiPicker(false);
    if (onCancelReply) onCancelReply();

    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    sendTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const addEmoji = (emoji) => {
    setContent((prev) => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const placeholderText =
    activeType === 'channel'
      ? `Message #${activeChannel?.name || 'channel'}`
      : `Message @${activeDirectUser?.username || 'user'}`;

  return (
    <div className="p-3 border-t border-dark-border bg-dark-sidebar relative">
      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="absolute bottom-full left-4 mb-2 p-3 bg-dark-card border border-dark-border rounded-2xl shadow-2xl z-20 animate-fadeIn w-64">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-dark-border text-xs font-semibold text-slate-400">
            <span>Quick Emojis</span>
            <button
              onClick={() => setShowEmojiPicker(false)}
              className="hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-8 gap-1.5 text-lg">
            {EMOJI_LIST.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => addEmoji(emoji)}
                className="hover:scale-125 transition-transform p-1 rounded hover:bg-dark-hover"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reply Banner */}
      {replyTo && (
        <div className="flex items-center justify-between mb-2 px-3 py-1.5 bg-dark-card border border-dark-border/80 rounded-xl text-xs animate-fadeIn">
          <div className="flex items-center gap-2 truncate">
            <CornerDownRight className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
            <span className="text-slate-400">Replying to</span>
            <span className="font-semibold text-brand-400">
              {replyTo.sender?.username || 'User'}
            </span>
            <span className="text-slate-500 truncate max-w-xs">"{replyTo.content}"</span>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-dark-hover"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Attachment Preview Chip */}
      {attachment && (
        <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-dark-card border border-brand-500/30 rounded-xl text-xs animate-fadeIn w-fit">
          {attachment.fileType?.startsWith('image/') ? (
            <ImageIcon className="w-4 h-4 text-brand-400" />
          ) : (
            <File className="w-4 h-4 text-brand-400" />
          )}
          <span className="font-medium text-slate-200 max-w-[200px] truncate">
            {attachment.filename}
          </span>
          <button
            onClick={() => setAttachment(null)}
            className="p-0.5 rounded text-slate-400 hover:text-rose-400"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Input Bar */}
      <div className="flex items-end gap-2 bg-dark-card border border-dark-border focus-within:border-brand-500/60 rounded-2xl px-3 py-2 transition-colors">
        {/* File Upload Hidden Input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="Attach image or file"
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-dark-hover transition-colors disabled:opacity-50 flex-shrink-0"
        >
          {uploading ? (
            <span className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin inline-block"></span>
          ) : (
            <Paperclip className="w-4 h-4" />
          )}
        </button>

        {/* Text Input Area */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholderText}
          rows={1}
          className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none py-1.5 leading-relaxed max-h-32"
        />

        {/* Emoji Button */}
        <button
          type="button"
          onClick={() => setShowEmojiPicker((prev) => !prev)}
          title="Emoji picker"
          className={`p-2 rounded-xl transition-colors flex-shrink-0 ${
            showEmojiPicker
              ? 'text-brand-400 bg-brand-500/10'
              : 'text-slate-400 hover:text-white hover:bg-dark-hover'
          }`}
        >
          <Smile className="w-4 h-4" />
        </button>

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={(!content.trim() && !attachment) || uploading}
          title="Send message (Enter)"
          className="p-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
