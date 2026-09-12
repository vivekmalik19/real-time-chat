import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import {
  Hash,
  Plus,
  MessageSquare,
  Volume2,
  VolumeX,
  Settings,
  LogOut,
  ChevronDown,
  UserCheck
} from 'lucide-react';
import { getAvatarUrl, getStatusColor } from '../utils/helpers';
import CreateChannelModal from './CreateChannelModal';
import ProfileModal from './ProfileModal';

export default function Sidebar({ isOpen, onClose }) {
  const {
    channels,
    activeType,
    activeChannel,
    activeDirectUser,
    selectChannel,
    selectDirect,
    allUsers,
    onlineUserIds,
    unreadCounts,
    soundEnabled,
    toggleSound
  } = useChat();

  const { user, logout } = useAuth();
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleChannelSelect = (ch) => {
    selectChannel(ch);
    if (window.innerWidth < 1024 && onClose) onClose();
  };

  const handleDirectSelect = (u) => {
    selectDirect(u);
    if (window.innerWidth < 1024 && onClose) onClose();
  };

  return (
    <>
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-dark-sidebar border-r border-dark-border flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* App Branding */}
        <div className="p-4 border-b border-dark-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                PulseChat
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-status-pulse"></span>
              </h1>
              <p className="text-[11px] text-slate-400">MERN • Real-Time Engine</p>
            </div>
          </div>

          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Mute notification sound' : 'Enable notification sound'}
            className={`p-2 rounded-xl transition-colors ${
              soundEnabled
                ? 'text-brand-400 bg-brand-500/10 hover:bg-brand-500/20'
                : 'text-slate-500 hover:text-slate-300 hover:bg-dark-hover'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto p-3 space-y-5">
          {/* Channels Section */}
          <div>
            <div className="flex items-center justify-between px-2 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Channels
              </span>
              <button
                onClick={() => setIsCreateChannelOpen(true)}
                title="Create Channel"
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-dark-hover transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-0.5">
              {channels.map((channel) => {
                const isActive = activeType === 'channel' && activeChannel?._id === channel._id;
                const unread = unreadCounts[channel._id] || 0;

                return (
                  <button
                    key={channel._id}
                    onClick={() => handleChannelSelect(channel)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-dark-hover'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Hash
                        className={`w-4 h-4 flex-shrink-0 ${
                          isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'
                        }`}
                      />
                      <span className="truncate">{channel.name}</span>
                    </div>

                    {unread > 0 && (
                      <span
                        className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                          isActive
                            ? 'bg-white text-brand-700'
                            : 'bg-brand-500 text-white animate-pulse'
                        }`}
                      >
                        {unread}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direct Messages Section */}
          <div>
            <div className="flex items-center justify-between px-2 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Direct Messages
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-dark-card text-slate-400">
                {allUsers.length}
              </span>
            </div>

            <div className="space-y-0.5">
              {allUsers.length === 0 ? (
                <p className="text-[11px] text-slate-500 px-3 italic">No other users yet</p>
              ) : (
                allUsers.map((u) => {
                  const isActive = activeType === 'direct' && activeDirectUser?._id === u._id;
                  const isOnline = onlineUserIds.includes(u._id);
                  const unread = unreadCounts[u._id] || 0;

                  return (
                    <button
                      key={u._id}
                      onClick={() => handleDirectSelect(u)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                        isActive
                          ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-dark-hover'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="relative flex-shrink-0">
                          <img
                            src={getAvatarUrl(u)}
                            alt={u.username}
                            className={`w-6 h-6 rounded-lg bg-dark-hover ${
                              !isOnline && !isActive ? 'opacity-60' : ''
                            }`}
                          />
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-dark-sidebar ${
                              isOnline ? 'bg-emerald-500' : 'bg-slate-500'
                            }`}
                          />
                        </div>
                        <span className="truncate">{u.username}</span>
                      </div>

                      {unread > 0 && (
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                            isActive
                              ? 'bg-white text-brand-700'
                              : 'bg-brand-500 text-white animate-pulse'
                          }`}
                        >
                          {unread}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* User Profile Bar (Footer) */}
        <div className="p-3 border-t border-dark-border bg-dark-bg/60">
          <div className="flex items-center justify-between p-2 rounded-xl bg-dark-card border border-dark-border/80">
            {/* Click to open profile modal */}
            <button
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-2.5 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
            >
              <div className="relative flex-shrink-0">
                <img
                  src={getAvatarUrl(user)}
                  alt={user?.username}
                  className="w-8 h-8 rounded-lg bg-dark-hover border border-brand-500/30"
                />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-dark-card ${getStatusColor(
                    user?.status || 'online'
                  )}`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-100 truncate">{user?.username}</p>
                <p className="text-[10px] text-slate-400 truncate">
                  {user?.customStatus || (user?.isGuest ? 'Guest' : 'Online')}
                </p>
              </div>
            </button>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsProfileOpen(true)}
                title="Profile Settings"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-dark-hover transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Modals */}
      <CreateChannelModal
        isOpen={isCreateChannelOpen}
        onClose={() => setIsCreateChannelOpen(false)}
      />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
}
