import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  X,
  CheckCircle2,
  EyeOff,
  Trash2,
  RefreshCw,
  AlertTriangle,
  MessageSquare,
  Clock,
  User,
} from 'lucide-react';
import { api } from '../../utils/api';
import { formatRelativeTime } from '../../utils/formatTime';

export default function ModerationQueueModal({ isOpen, onClose, onActionCompleted }) {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchQueue();
    }
  }, [isOpen]);

  async function fetchQueue() {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/comments/moderation/queue');
      if (res.success) {
        setQueue(res.items || []);
      }
    } catch (err) {
      setError(err.data?.message || err.message || 'Unable to load moderation queue');
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(commentId, action, reason = '') {
    try {
      setActionLoadingId(commentId);
      const res = await api.post(`/comments/moderation/${commentId}/action`, {
        action,
        reason,
      });

      if (res.success) {
        setSuccessMsg(`Action '${action}' executed successfully`);
        // Remove item from local queue
        setQueue((prev) => prev.filter((item) => item.id !== commentId));
        if (onActionCompleted) {
          onActionCompleted();
        }
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err) {
      setError(err.data?.message || err.message || 'Action failed');
    } finally {
      setActionLoadingId(null);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-surface-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Community Moderation Queue</h3>
              <p className="text-xs text-slate-400">
                Review reported and flagged comments requiring moderator review
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchQueue}
              title="Refresh Queue"
              className="p-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-300 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-surface-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {successMsg && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Queue Content List */}
        <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-1">
          {loading && queue.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-400" />
              <p>Loading moderation queue...</p>
            </div>
          ) : queue.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-semibold text-white">Queue Clean!</p>
              <p className="text-xs text-slate-400">There are no flagged or reported comments pending review.</p>
            </div>
          ) : (
            queue.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-surface-950/80 border border-slate-800/90 space-y-3"
              >
                {/* Comment Meta */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-white">{item.authorName}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">{formatRelativeTime(item.createdAt)}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">Video: {item.videoId}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {item.reportCount} Report{item.reportCount === 1 ? '' : 's'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.moderationStatus === 'flagged'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.moderationStatus}
                    </span>
                  </div>
                </div>

                {/* Comment Content */}
                <div className="p-3 rounded-xl bg-surface-900 border border-slate-800/80 text-xs text-slate-200">
                  <p className="break-words">{item.content}</p>
                </div>

                {/* Reports details if any */}
                {item.reports && item.reports.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-slate-400 block">
                      Submitted Report Reasons:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.reports.map((rep) => (
                        <div
                          key={rep.id}
                          className="px-2.5 py-1 rounded-lg bg-surface-900 border border-rose-500/20 text-[11px] text-slate-300"
                        >
                          <strong className="text-rose-400 capitalize">{rep.reason}</strong>
                          {rep.details && <span className="ml-1 text-slate-400 italic">"{rep.details}"</span>}
                          <span className="ml-1 text-slate-500">by {rep.reporterName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800/60">
                  <button
                    disabled={actionLoadingId === item.id}
                    onClick={() => handleAction(item.id, 'dismiss_reports')}
                    className="px-3 py-1.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-300 text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    Dismiss Reports
                  </button>

                  <button
                    disabled={actionLoadingId === item.id}
                    onClick={() => handleAction(item.id, 'approve')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Approve</span>
                  </button>

                  <button
                    disabled={actionLoadingId === item.id}
                    onClick={() => handleAction(item.id, 'hide', 'Moderator hidden')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                    <span>Hide Comment</span>
                  </button>

                  <button
                    disabled={actionLoadingId === item.id}
                    onClick={() => handleAction(item.id, 'delete', 'Violates community guidelines')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/20 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
