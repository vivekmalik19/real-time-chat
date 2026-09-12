import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { Hash, X, AlignLeft, ShieldCheck } from 'lucide-react';

export default function CreateChannelModal({ isOpen, onClose }) {
  const { createChannel } = useChat();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const cleanName = name.trim().toLowerCase().replace(/\s+/g, '-');
    if (!cleanName) {
      setError('Channel name is required');
      return;
    }

    setLoading(true);
    try {
      await createChannel(cleanName, description.trim(), isPrivate);
      setName('');
      setDescription('');
      setIsPrivate(false);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create channel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-dark-sidebar border border-dark-border rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-dark-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create Channel</h3>
              <p className="text-xs text-slate-400">Create a place for your team or topics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Channel Name
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">#</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                placeholder="new-channel"
                required
                className="w-full pl-8 pr-3 py-2 bg-dark-card border border-dark-border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Description (Optional)
            </label>
            <div className="relative">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this channel about?"
                rows={3}
                className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-dark-card border border-dark-border">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-brand-400" />
              <div>
                <p className="text-xs font-semibold text-slate-200">Private Channel</p>
                <p className="text-[11px] text-slate-400">Only invited members can view</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-dark-border bg-dark-bg cursor-pointer"
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
              disabled={loading || !name.trim()}
              className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-md shadow-brand-500/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
