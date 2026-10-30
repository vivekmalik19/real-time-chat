import React, { useState } from 'react';
import { Flag, X, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { api } from '../../utils/api';

const REPORT_REASONS = [
  { id: 'spam', label: 'Spam or Promotional', desc: 'Commercial solicitation, repetitive text, or unwanted links' },
  { id: 'harassment', label: 'Harassment or Bullying', desc: 'Targeting, personal attacks, or aggressive behavior' },
  { id: 'offensive', label: 'Offensive or Hateful Content', desc: 'Hate speech, slurs, discrimination, or vulgar language' },
  { id: 'misinformation', label: 'Misinformation', desc: 'Demonstrably false, deceptive, or misleading claims' },
  { id: 'other', label: 'Other Guidelines Violation', desc: 'Other behavior violating community guidelines' },
];

export default function ReportCommentModal({ comment, isOpen, onClose, onReportSubmitted }) {
  const [selectedReason, setSelectedReason] = useState('spam');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !comment) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const res = await api.post(`/comments/${comment.id}/report`, {
        reason: selectedReason,
        details: details.trim(),
      });

      if (res.success) {
        setSuccess(true);
        if (onReportSubmitted) {
          onReportSubmitted(comment.id);
        }
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 1800);
      }
    } catch (err) {
      setError(err.data?.message || err.message || 'Unable to submit report.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-surface-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Report Comment</h3>
              <p className="text-xs text-slate-400">Moderators review all reported content</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-3">
            <div className="inline-flex p-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-sm font-bold text-white">Report Submitted</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Thank you for keeping MeetFlow safe. Our moderation team will review this comment.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Snippet of the comment being reported */}
            <div className="p-3 rounded-xl bg-surface-950/80 border border-slate-800 text-xs text-slate-300">
              <span className="font-semibold text-slate-400 block mb-1">
                Author: {comment.authorName}
              </span>
              <p className="italic line-clamp-2 text-slate-300">"{comment.content}"</p>
            </div>

            {/* Reason Radio Group */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Why are you reporting this comment?
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {REPORT_REASONS.map((r) => (
                  <label
                    key={r.id}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      selectedReason === r.id
                        ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                        : 'bg-surface-950/50 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={r.id}
                      checked={selectedReason === r.id}
                      onChange={() => setSelectedReason(r.id)}
                      className="mt-0.5 accent-rose-500"
                    />
                    <div>
                      <span className="font-medium block">{r.label}</span>
                      <span className="text-[11px] text-slate-400">{r.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Optional Details */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Additional Details (Optional)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder="Provide context or explanation..."
                className="w-full px-3 py-2 rounded-xl bg-surface-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50 resize-none"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/20 transition-all disabled:opacity-50"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{loading ? 'Submitting...' : 'Submit Report'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
