import React from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { getAvatarUrl, getStatusColor, getStatusText } from '../utils/helpers';
import { MessageCircle, Users, X } from 'lucide-react';

export default function UserList({ isOpen, onClose }) {
  const { allUsers, onlineUserIds, selectDirect } = useChat();
  const { user: currentUser } = useAuth();

  if (!isOpen) return null;

  // Filter and sort users: online first, then alphabetical
  const otherUsers = allUsers.filter((u) => u._id !== currentUser?._id);

  const onlineMembers = otherUsers.filter((u) => onlineUserIds.includes(u._id));
  const offlineMembers = otherUsers.filter((u) => !onlineUserIds.includes(u._id));

  const handleUserClick = (targetUser) => {
    selectDirect(targetUser);
    if (window.innerWidth < 1024 && onClose) {
      onClose();
    }
  };

  return (
    <aside className="w-64 border-l border-dark-border bg-dark-sidebar flex flex-col h-full flex-shrink-0 animate-fadeIn">
      {/* Header */}
      <div className="p-4 border-b border-dark-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-brand-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Members — {otherUsers.length + 1}
          </h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-dark-hover"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* List Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* You */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
            You
          </p>
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-dark-card/50 border border-dark-border/50">
            <div className="relative flex-shrink-0">
              <img
                src={getAvatarUrl(currentUser)}
                alt={currentUser?.username}
                className="w-8 h-8 rounded-lg bg-dark-hover"
              />
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-dark-sidebar ${getStatusColor(
                  currentUser?.status || 'online'
                )}`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {currentUser?.username}
              </p>
              <p className="text-[10px] text-brand-400 truncate">
                {currentUser?.customStatus || 'Active now'}
              </p>
            </div>
          </div>
        </div>

        {/* Online Section */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 px-2 mb-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Online — {onlineMembers.length}
          </p>
          <div className="space-y-0.5">
            {onlineMembers.length === 0 ? (
              <p className="text-[11px] text-slate-500 px-2 italic">No one else online right now</p>
            ) : (
              onlineMembers.map((member) => (
                <button
                  key={member._id}
                  onClick={() => handleUserClick(member)}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-dark-hover transition-colors text-left group"
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={getAvatarUrl(member)}
                      alt={member.username}
                      className="w-8 h-8 rounded-lg bg-dark-hover"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-dark-sidebar bg-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-300 group-hover:text-white truncate">
                      {member.username}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {member.customStatus || 'Online'}
                    </p>
                  </div>
                  <MessageCircle className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 group-hover:text-brand-400 transition-opacity" />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Offline Section */}
        {offlineMembers.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-2 mb-1.5">
              Offline — {offlineMembers.length}
            </p>
            <div className="space-y-0.5 opacity-70">
              {offlineMembers.map((member) => (
                <button
                  key={member._id}
                  onClick={() => handleUserClick(member)}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-dark-hover transition-colors text-left group"
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={getAvatarUrl(member)}
                      alt={member.username}
                      className="w-8 h-8 rounded-lg bg-dark-hover grayscale"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-dark-sidebar bg-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-400 group-hover:text-slate-200 truncate">
                      {member.username}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">Offline</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
