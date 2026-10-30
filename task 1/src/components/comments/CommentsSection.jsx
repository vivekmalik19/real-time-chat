import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  MapPin,
  AlertCircle,
  RefreshCw,
  ShieldAlert,
  ArrowUpDown,
  Lock,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import CommentItem from './CommentItem';
import ReportCommentModal from './ReportCommentModal';
import ModerationQueueModal from './ModerationQueueModal';

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest First' },
  { id: 'most_liked', label: 'Most Liked' },
  { id: 'relevance', label: 'Relevance' },
  { id: 'oldest', label: 'Oldest First' },
];

export default function CommentsSection({ videoId }) {
  const { user, openAuthModal } = useAuth();

  const [comments, setComments] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [supportedLanguages, setSupportedLanguages] = useState([]);

  // New Comment form state
  const [newContent, setNewContent] = useState('');
  const [shareLocation, setShareLocation] = useState(false);
  const [locationText, setLocationText] = useState('Mumbai, Maharashtra, India');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [postSuccess, setPostSuccess] = useState(false);

  // Captcha state (when suspicious attempts threshold is reached)
  const [requiresCaptcha, setRequiresCaptcha] = useState(false);
  const [captchaInput, setCaptchaInput] = useState('');

  // Modals state
  const [reportingComment, setReportingComment] = useState(null);
  const [moderationModalOpen, setModerationModalOpen] = useState(false);

  // Role switching state for demo / testing
  const [roleSwitchLoading, setRoleSwitchLoading] = useState(false);

  const isModerator = user && ['admin', 'moderator'].includes(user.role);

  // Fetch comments
  useEffect(() => {
    if (videoId) {
      loadComments();
    }
  }, [videoId, sort]);

  async function loadComments() {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/videos/${videoId}/comments?sort=${sort}`);
      if (res.success) {
        setComments(res.comments || []);
        setTotalCount(res.count || 0);
        if (res.supportedLanguages) {
          setSupportedLanguages(res.supportedLanguages);
        }
      }
    } catch (err) {
      setError(err.data?.message || err.message || 'Unable to load comments');
    } finally {
      setLoading(false);
    }
  }

  // Handle post top-level comment
  async function handleCreateComment(e) {
    e.preventDefault();
    if (!newContent.trim()) return;

    if (!user) {
      openAuthModal('signin');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);

      const payload = {
        content: newContent.trim(),
        shareLocation,
        location: shareLocation ? locationText : null,
        captchaToken: requiresCaptcha ? captchaInput.trim() : null,
      };

      const res = await api.post(`/videos/${videoId}/comments`, payload);

      if (res.success && res.comment) {
        setNewContent('');
        setRequiresCaptcha(false);
        setCaptchaInput('');
        setPostSuccess(true);
        setTimeout(() => setPostSuccess(false), 2500);

        // Prepend comment to list
        setComments((prev) => [res.comment, ...prev]);
        setTotalCount((prev) => prev + 1);
      }
    } catch (err) {
      if (err.data?.code === 'CAPTCHA_REQUIRED' || err.data?.requiresCaptcha) {
        setRequiresCaptcha(true);
      }
      setSubmitError(err.data?.message || err.message || 'Failed to post comment.');
    } finally {
      setSubmitting(false);
    }
  }

  // Handle comment updated locally
  function handleCommentUpdated(updatedComment) {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === updatedComment.id) {
          return { ...c, ...updatedComment, replies: c.replies };
        }
        if (c.replies && c.replies.length > 0) {
          return {
            ...c,
            replies: c.replies.map((r) => (r.id === updatedComment.id ? { ...r, ...updatedComment } : r)),
          };
        }
        return c;
      })
    );
  }

  // Handle comment deleted locally
  function handleCommentDeleted(deletedId) {
    setComments((prev) => {
      // Check top-level comments
      return prev
        .map((c) => {
          if (c.id === deletedId) {
            // If it has replies, soft-delete placeholder
            if (c.replies && c.replies.length > 0) {
              return {
                ...c,
                isDeleted: true,
                content: '[This comment has been deleted by the author]',
                authorName: '[Deleted User]',
              };
            }
            return null; // remove
          }
          if (c.replies && c.replies.length > 0) {
            return {
              ...c,
              replies: c.replies.filter((r) => r.id !== deletedId),
            };
          }
          return c;
        })
        .filter(Boolean);
    });
    setTotalCount((prev) => Math.max(0, prev - 1));
  }

  // Handle adding reply to a parent comment
  function handleAddReply(parentId, newReply) {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === parentId) {
          return {
            ...c,
            replyCount: (c.replyCount || 0) + 1,
            replies: [...(c.replies || []), newReply],
          };
        }
        return c;
      })
    );
  }

  // Toggle user role between 'user' and 'moderator' for live testing
  async function handleToggleModeratorRole() {
    if (!user) {
      openAuthModal('signin');
      return;
    }
    try {
      setRoleSwitchLoading(true);
      const newRole = user.role === 'moderator' ? 'user' : 'moderator';
      const res = await api.post('/comments/test-set-role', { role: newRole });
      if (res.success) {
        // Refresh comments to adjust moderator view
        window.location.reload();
      }
    } catch (err) {
      alert(err.message || 'Failed to switch role');
    } finally {
      setRoleSwitchLoading(false);
    }
  }

  return (
    <section className="mt-8 pt-8 border-t border-slate-800">
      {/* Header with Title, Count, Sort Selector & Moderator Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Discussion & Comments</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-surface-800 text-brand-300 font-mono">
                {totalCount}
              </span>
            </h3>
            <p className="text-xs text-slate-400">Multilingual threaded community discussion</p>
          </div>
        </div>

        {/* Sort & Moderator Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Moderator Queue button (if moderator) */}
          {isModerator && (
            <button
              onClick={() => setModerationModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold shadow-sm transition-all"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Moderation Queue</span>
            </button>
          )}

          {/* Demo Tester Role Switcher */}
          {user && (
            <button
              onClick={handleToggleModeratorRole}
              disabled={roleSwitchLoading}
              title="Toggle role for testing Task 6 moderator privileges"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-300 text-xs font-medium border border-slate-700/80 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-brand-400" />
              <span>{user.role === 'moderator' ? 'Role: Moderator (Switch to User)' : 'Role: User (Switch to Mod)'}</span>
            </button>
          )}

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-surface-900 border border-slate-800 text-xs text-slate-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id} className="bg-surface-900 text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Comment Input Card */}
      {user ? (
        <form
          onSubmit={handleCreateComment}
          className="p-4 rounded-2xl bg-surface-900/60 border border-slate-800 mb-6 space-y-3"
        >
          <div className="flex items-start gap-3">
            {/* User Avatar */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-md">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-full" />
              ) : (
                <span>{user.name.charAt(0).toUpperCase()}</span>
              )}
            </div>

            {/* Input Box */}
            <div className="flex-1">
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Share your insights, ask a question, or mention someone with @username..."
                rows={3}
                maxLength={2000}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/80 transition-colors resize-none"
              />

              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                <span>Tip: Type @username to tag another learner</span>
                <span>{newContent.length} / 2000</span>
              </div>
            </div>
          </div>

          {/* Location Privacy Consent Bar (Requirement 3) */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-300 select-none">
              <input
                type="checkbox"
                checked={shareLocation}
                onChange={(e) => setShareLocation(e.target.checked)}
                className="accent-brand-500 rounded cursor-pointer"
              />
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Share location with this comment (opt-in only)</span>
              </span>
            </label>

            {shareLocation && (
              <div className="flex items-center gap-2 animate-fade-in">
                <span className="text-[11px] text-slate-500">Location:</span>
                <input
                  type="text"
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                  placeholder="City, Country"
                  maxLength={100}
                  className="px-2.5 py-1 rounded-lg bg-surface-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-brand-500 w-48"
                />
              </div>
            )}
          </div>

          {/* CAPTCHA Challenge Bar (Requirement 5) */}
          {requiresCaptcha && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Security Verification Required</span>
              </div>
              <p className="text-[11px] text-amber-400/90">
                To prevent automated spam and policy abuse, type{' '}
                <code className="px-1.5 py-0.5 rounded bg-black/40 font-mono text-white">
                  meetflow-human-verified
                </code>{' '}
                below to submit your comment:
              </p>
              <input
                type="text"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                placeholder="meetflow-human-verified"
                className="w-full px-3 py-1.5 rounded-lg bg-surface-950 border border-amber-500/40 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
          )}

          {/* Error Banner */}
          {submitError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Success Banner */}
          {postSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Comment posted successfully!</span>
            </div>
          )}

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="submit"
              disabled={submitting || !newContent.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-brand-500/20 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Post Comment</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* Sign-in Callout */
        <div className="p-5 rounded-2xl bg-surface-900/60 border border-slate-800 text-center mb-6 space-y-3">
          <div className="inline-flex p-3 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Join the Community Discussion</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-0.5">
              Sign in with your MeetFlow account to post comments, ask questions, react, and translate replies.
            </p>
          </div>
          <button
            onClick={() => openAuthModal('signin')}
            className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/25 transition-all"
          >
            Sign In to Comment
          </button>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-3">
        {loading && comments.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-400" />
            <p>Loading discussion threads...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-sm font-semibold text-slate-300">No comments yet</p>
            <p className="text-xs text-slate-500">Be the first to share your thoughts on this video!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={user?._id || user?.id}
              isModerator={isModerator}
              onCommentUpdated={handleCommentUpdated}
              onCommentDeleted={handleCommentDeleted}
              onOpenReport={(c) => setReportingComment(c)}
              onAddReply={handleAddReply}
              supportedLanguages={supportedLanguages}
            />
          ))
        )}
      </div>

      {/* Report Modal */}
      <ReportCommentModal
        comment={reportingComment}
        isOpen={Boolean(reportingComment)}
        onClose={() => setReportingComment(null)}
        onReportSubmitted={() => {
          // Refresh list or increment local flag
          loadComments();
        }}
      />

      {/* Moderation Queue Modal (Admin / Moderator) */}
      <ModerationQueueModal
        isOpen={moderationModalOpen}
        onClose={() => setModerationModalOpen(false)}
        onActionCompleted={() => {
          loadComments();
        }}
      />
    </section>
  );
}
