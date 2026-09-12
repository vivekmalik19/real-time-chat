import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { socket } from '../socket';
import { X, Check, Smile, Shield } from 'lucide-react';
import { getAvatarUrl, getStatusColor } from '../utils/helpers';

const AVATAR_SEEDS = ['Felix', 'Luna', 'Nova', 'Leo', 'Milo', 'Zara', 'Echo', 'Pixel', 'Astro', 'Shadow'];

export default function ProfileModal({ isOpen, onClose }) {
  const { user, updateProfile } = useAuth();
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || '');
  const [status, setStatus] = useState(user?.status || 'online');
  const [customStatus, setCustomStatus] = useState(user?.customStatus || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !user) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      await updateProfile({
        avatar: selectedAvatar,
        status,
        customStatus
      });

      // Emit socket status update
      socket.emit('user:status_change', {
        userId: user._id,
        status,
        customStatus
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 600);
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-dark-sidebar border border-dark-border rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-dark-border">
          <h3 className="text-base font-bold text-white">Edit Profile & Status</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          {/* Current Avatar Preview */}
          <div className="flex items-center gap-4 p-3 rounded-xl bg-dark-card border border-dark-border">
            <div className="relative">
              <img
                src={selectedAvatar || getAvatarUrl(user)}
                alt={user.username}
                className="w-14 h-14 rounded-2xl bg-dark-hover border-2 border-brand-500/50"
              />
              <span
                className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-dark-sidebar ${getStatusColor(
                  status
                )}`}
              />
            </div>
            <div>
              <p className="font-semibold text-slate-100 text-sm">{user.username}</p>
              <p className="text-xs text-slate-400">
                {user.isGuest ? 'Guest Member' : user.email || 'Registered User'}
              </p>
            </div>
          </div>

          {/* Change Avatar */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Select Avatar
            </label>
            <div className="grid grid-cols-5 gap-2 py-1">
              {AVATAR_SEEDS.map((seed) => {
                const url = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed)}`;
                return (
                  <button
                    key={seed}
                    type="button"
                    onClick={() => setSelectedAvatar(url)}
                    className={`p-1 rounded-xl transition-all border ${
                      selectedAvatar === url
                        ? 'border-brand-500 bg-brand-500/20 scale-105'
                        : 'border-transparent bg-dark-card hover:bg-dark-hover opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={seed} className="w-full h-10 rounded-lg" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Online Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'online', label: 'Online', color: 'bg-emerald-500' },
                { key: 'away', label: 'Away', color: 'bg-amber-500' },
                { key: 'busy', label: 'Busy (DND)', color: 'bg-rose-500' }
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setStatus(item.key)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    status === item.key
                      ? 'border-brand-500 bg-brand-500/15 text-white'
                      : 'border-dark-border bg-dark-card text-slate-400 hover:text-slate-200 hover:bg-dark-hover'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Status Message */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Smile className="w-3.5 h-3.5 text-slate-400" />
              Custom Status
            </label>
            <input
              type="text"
              value={customStatus}
              onChange={(e) => setCustomStatus(e.target.value)}
              placeholder="e.g. Coding something awesome 🚀"
              maxLength={100}
              className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-xl hover:bg-dark-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-md shadow-brand-500/20 transition-all flex items-center gap-1.5"
            >
              {success ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  Saved!
                </>
              ) : loading ? (
                'Saving...'
              ) : (
                'Save Profile'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
