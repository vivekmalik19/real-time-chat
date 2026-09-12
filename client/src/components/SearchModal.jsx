import React, { useState, useMemo } from 'react';
import { useChat } from '../context/ChatContext';
import { Search, X, MessageSquare, Calendar } from 'lucide-react';
import { formatTime, formatDate } from '../utils/helpers';

export default function SearchModal({ isOpen, onClose, onSelectMessage }) {
  const { messages, activeChannel, activeDirectUser, activeType } = useChat();
  const [query, setQuery] = useState('');

  const filteredMessages = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return messages.filter(
      (m) =>
        !m.isDeleted &&
        ((m.content && m.content.toLowerCase().includes(q)) ||
          (m.sender?.username && m.sender.username.toLowerCase().includes(q)) ||
          (m.attachment?.filename && m.attachment.filename.toLowerCase().includes(q)))
    );
  }, [messages, query]);

  if (!isOpen) return null;

  const chatTitle =
    activeType === 'channel'
      ? `#${activeChannel?.name || 'channel'}`
      : `@${activeDirectUser?.username || 'direct'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-dark-sidebar border border-dark-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-fadeIn">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-dark-border flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search messages in ${chatTitle}...`}
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-dark-hover"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="p-4 flex-1 overflow-y-auto space-y-2">
          {query.trim() === '' ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Type keywords, usernames, or file names to search conversation history
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No messages found matching "<span className="text-slate-200">{query}</span>"
            </div>
          ) : (
            <>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {filteredMessages.length} matching message{filteredMessages.length > 1 ? 's' : ''}
              </p>
              {filteredMessages.map((msg) => (
                <div
                  key={msg._id}
                  onClick={() => {
                    if (onSelectMessage) onSelectMessage(msg._id);
                    onClose();
                  }}
                  className="p-3 rounded-xl bg-dark-card border border-dark-border/60 hover:border-brand-500/50 hover:bg-dark-hover transition-all cursor-pointer space-y-1 group"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-brand-400 group-hover:text-brand-300">
                      {msg.sender?.username}
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      {formatDate(msg.createdAt)} at {formatTime(msg.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2">{msg.content}</p>
                  {msg.attachment && (
                    <span className="inline-block text-[11px] text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded">
                      📎 {msg.attachment.filename}
                    </span>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
