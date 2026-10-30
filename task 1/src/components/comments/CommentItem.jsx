import React, { useState } from 'react';
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Edit2,
  Trash2,
  Flag,
  Globe,
  MapPin,
  Clock,
  Check,
  X,
  RefreshCw,
  AlertCircle,
  CornerDownRight,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../../utils/api';
import { formatRelativeTime } from '../../utils/formatTime';

export default function CommentItem({
  comment,
  currentUserId,
  isModerator,
  onCommentUpdated,
  onCommentDeleted,
  onOpenReport,
  onAddReply,
  supportedLanguages = [],
}) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyShareLocation, setReplyShareLocation] = useState(false);
  const [replyLocation, setReplyLocation] = useState('Mumbai, Maharashtra, India');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replyError, setReplyError] = useState(null);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content || '');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);

  // Translation state
  const [targetLang, setTargetLang] = useState('en');
  const [translation, setTranslation] = useState(null);
  const [translating, setTranslating] = useState(false);
  const [translationError, setTranslationError] = useState(null);
  const [showOriginal, setShowOriginal] = useState(false);

  // Reaction state
  const [likeCount, setLikeCount] = useState(comment.likeCount || 0);
  const [dislikeCount, setDislikeCount] = useState(comment.dislikeCount || 0);
  const [userReaction, setUserReaction] = useState(comment.userReaction || null);
  const [reactionLoading, setReactionLoading] = useState(false);

  const isAuthor = currentUserId && comment.authorId && currentUserId.toString() === comment.authorId.toString();
  const canDelete = isAuthor || isModerator;

  // React (Like / Dislike)
  async function handleReaction(type) {
    if (!currentUserId) {
      alert('Please sign in to react to comments.');
      return;
    }
    try {
      setReactionLoading(true);
      const res = await api.post(`/comments/${comment.id}/reaction`, { type });
      if (res.success) {
        setLikeCount(res.likeCount);
        setDislikeCount(res.dislikeCount);
        setUserReaction(res.userReaction);
      }
    } catch (err) {
      console.error('Reaction error:', err);
    } finally {
      setReactionLoading(false);
    }
  }

  // Handle Edit
  async function handleSaveEdit(e) {
    e.preventDefault();
    if (!editText.trim()) return;

    try {
      setEditLoading(true);
      setEditError(null);

      const res = await api.patch(`/comments/${comment.id}`, {
        content: editText.trim(),
      });

      if (res.success) {
        setIsEditing(false);
        // Reset any translation since text changed
        setTranslation(null);
        if (onCommentUpdated) {
          onCommentUpdated(res.comment);
        }
      }
    } catch (err) {
      setEditError(err.data?.message || err.message || 'Unable to update comment');
    } finally {
      setEditLoading(false);
    }
  }

  // Handle Delete
  async function handleDelete() {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      const res = await api.delete(`/comments/${comment.id}`);
      if (res.success) {
        if (onCommentDeleted) {
          onCommentDeleted(comment.id);
        }
      }
    } catch (err) {
      alert(err.data?.message || err.message || 'Unable to delete comment');
    }
  }

  // Handle Translation
  async function handleTranslate() {
    try {
      setTranslating(true);
      setTranslationError(null);
      const res = await api.post(`/comments/${comment.id}/translate`, {
        targetLanguage: targetLang,
      });

      if (res.success && res.translation) {
        setTranslation(res.translation);
        setShowOriginal(false);
      }
    } catch (err) {
      setTranslationError(
        err.data?.message || 'Translation service currently unavailable.'
      );
    } finally {
      setTranslating(false);
    }
  }

  // Handle Submit Reply
  async function handleSubmitReply(e) {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      setReplySubmitting(true);
      setReplyError(null);

      const payload = {
        content: replyText.trim(),
        parentId: comment.id,
        shareLocation: replyShareLocation,
        location: replyShareLocation ? replyLocation : null,
      };

      const res = await api.post(`/videos/${comment.videoId}/comments`, payload);
      if (res.success) {
        setReplyText('');
        setIsReplying(false);
        if (onAddReply) {
          onAddReply(comment.id, res.comment);
        }
      }
    } catch (err) {
      setReplyError(err.data?.message || err.message || 'Failed to post reply.');
    } finally {
      setReplySubmitting(false);
    }
  }

  // Render text with @mentions highlighted
  function renderFormattedContent(text) {
    if (!text) return '';
    const parts = text.split(/(@[a-zA-Z0-9_\.\-]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span
            key={i}
            className="font-semibold text-brand-400 hover:text-brand-300 cursor-pointer bg-brand-500/10 px-1 py-0.5 rounded"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  }

  return (
    <div
      className={`group relative rounded-2xl p-4 transition-colors ${
        comment.parentId ? 'bg-surface-950/40 border border-slate-800/60 mt-2.5 ml-6' : 'bg-surface-900/50 border border-slate-800/80 mb-3'
      }`}
    >
      {/* If this is a reply, show connecting corner guide */}
      {comment.parentId && (
        <div className="absolute -left-4 top-4 text-slate-700">
          <CornerDownRight className="w-3.5 h-3.5" />
        </div>
      )}

      {/* Header: Author Avatar, Name, Timestamp, Location, Badges */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
            {comment.authorAvatar ? (
              <img src={comment.authorAvatar} alt={comment.authorName} className="w-full h-full object-cover" />
            ) : (
              <span>{comment.authorName ? comment.authorName.charAt(0).toUpperCase() : 'U'}</span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-white truncate">{comment.authorName}</span>

              {/* Author badge if commenting on their own video */}
              {isAuthor && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  You
                </span>
              )}

              {/* Relative Time */}
              <span className="text-[11px] text-slate-500">
                {formatRelativeTime(comment.createdAt)}
              </span>

              {/* Edited indicator */}
              {comment.isEdited && (
                <span
                  title={comment.editedAt ? `Edited ${formatRelativeTime(comment.editedAt)}` : 'Edited'}
                  className="text-[10px] text-slate-400 italic"
                >
                  (edited)
                </span>
              )}

              {/* Location Badge: ONLY shown if explicitly consented/supplied */}
              {comment.location && (
                <span
                  title={`Location shared by user: ${comment.location}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                >
                  <MapPin className="w-2.5 h-2.5" />
                  <span className="truncate max-w-[120px]">{comment.location}</span>
                </span>
              )}

              {/* Moderator badge on flagged comments */}
              {isModerator && comment.moderationStatus === 'flagged' && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <ShieldAlert className="w-2.5 h-2.5" />
                  Flagged ({comment.reportCount})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Top Right Action: Report & Delete */}
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          {!comment.isDeleted && (
            <button
              onClick={() => onOpenReport && onOpenReport(comment)}
              title="Report Comment"
              className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-surface-800 transition-colors"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
          )}

          {canDelete && !comment.isDeleted && (
            <button
              onClick={handleDelete}
              title="Delete Comment"
              className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-surface-800 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="mt-2 text-xs text-slate-200 pl-10">
        {isEditing ? (
          <form onSubmit={handleSaveEdit} className="space-y-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              maxLength={2000}
              rows={3}
              className="w-full px-3 py-2 rounded-xl bg-surface-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
            {editError && (
              <p className="text-[11px] text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>{editError}</span>
              </p>
            )}
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 rounded-lg bg-surface-800 hover:bg-surface-700 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editLoading}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
              >
                {editLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                <span>Save</span>
              </button>
            </div>
          </form>
        ) : (
          <div>
            {/* Soft-deleted message styling */}
            {comment.isDeleted ? (
              <p className="italic text-slate-500">{comment.content}</p>
            ) : translation && !showOriginal ? (
              <div className="space-y-1.5">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200">
                  <div className="flex items-center justify-between text-[10px] text-indigo-400 mb-1">
                    <span className="font-semibold flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      Translated to {translation.targetLanguage.toUpperCase()} (via {translation.provider})
                      {translation.cached && <span className="text-slate-400 font-normal">• cached</span>}
                    </span>
                    <button
                      onClick={() => setShowOriginal(true)}
                      className="underline hover:text-white"
                    >
                      Show Original
                    </button>
                  </div>
                  <p className="leading-relaxed whitespace-pre-wrap">{translation.translatedText}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="leading-relaxed whitespace-pre-wrap">
                  {renderFormattedContent(comment.content)}
                </p>
                {translation && showOriginal && (
                  <button
                    onClick={() => setShowOriginal(false)}
                    className="text-[10px] text-indigo-400 hover:underline"
                  >
                    View Translation
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Translation Error */}
        {translationError && (
          <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>{translationError}</span>
          </p>
        )}

        {/* Action Toolbar: Like, Dislike, Reply, Translate, Edit */}
        {!comment.isDeleted && !isEditing && (
          <div className="flex items-center gap-4 mt-3 pt-1 text-slate-400 text-xs flex-wrap">
            {/* Like */}
            <button
              onClick={() => handleReaction('like')}
              disabled={reactionLoading}
              className={`flex items-center gap-1.5 transition-colors ${
                userReaction === 'like' ? 'text-brand-400 font-semibold' : 'hover:text-slate-200'
              }`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${userReaction === 'like' ? 'fill-brand-400' : ''}`} />
              <span>{likeCount}</span>
            </button>

            {/* Dislike */}
            <button
              onClick={() => handleReaction('dislike')}
              disabled={reactionLoading}
              className={`flex items-center gap-1.5 transition-colors ${
                userReaction === 'dislike' ? 'text-rose-400 font-semibold' : 'hover:text-slate-200'
              }`}
            >
              <ThumbsDown className={`w-3.5 h-3.5 ${userReaction === 'dislike' ? 'fill-rose-400' : ''}`} />
              <span>{dislikeCount > 0 ? dislikeCount : ''}</span>
            </button>

            {/* Reply toggle */}
            {!comment.parentId && (
              <button
                onClick={() => setIsReplying(!isReplying)}
                className="flex items-center gap-1 hover:text-slate-200 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Reply</span>
              </button>
            )}

            {/* Edit (only available within 15 mins for author) */}
            {isAuthor && comment.canEdit && (
              <button
                onClick={() => {
                  setEditText(comment.content);
                  setIsEditing(true);
                }}
                className="flex items-center gap-1 hover:text-slate-200 transition-colors"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit</span>
              </button>
            )}

            {/* Translate Button & Language Selector */}
            <div className="flex items-center gap-1.5 ml-auto">
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="px-2 py-0.5 rounded-lg bg-surface-950 border border-slate-800 text-[11px] text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                {supportedLanguages.length > 0 ? (
                  supportedLanguages.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="ja">Japanese</option>
                    <option value="zh">Chinese</option>
                  </>
                )}
              </select>

              <button
                onClick={handleTranslate}
                disabled={translating}
                title="Translate comment"
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-[11px] font-medium transition-colors disabled:opacity-50"
              >
                <Globe className={`w-3 h-3 ${translating ? 'animate-spin' : ''}`} />
                <span>{translating ? 'Translating...' : 'Translate'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inline Reply Form */}
      {isReplying && (
        <form onSubmit={handleSubmitReply} className="mt-3 pl-10 space-y-2 animate-fade-in">
          <div className="relative">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Reply to @${comment.authorName}...`}
              maxLength={2000}
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-surface-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-none"
            />
          </div>

          {/* Location Consent Checkbox for Reply */}
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-300">
              <input
                type="checkbox"
                checked={replyShareLocation}
                onChange={(e) => setReplyShareLocation(e.target.checked)}
                className="accent-brand-500 rounded"
              />
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-400" />
                <span>Share location</span>
              </span>
            </label>

            {replyShareLocation && (
              <input
                type="text"
                value={replyLocation}
                onChange={(e) => setReplyLocation(e.target.value)}
                placeholder="City, Country"
                className="px-2 py-0.5 rounded bg-surface-950 border border-slate-700 text-[11px] text-slate-200 focus:outline-none focus:border-brand-500 w-44"
              />
            )}
          </div>

          {replyError && (
            <p className="text-[11px] text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>{replyError}</span>
            </p>
          )}

          <div className="flex items-center gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={() => {
                setIsReplying(false);
                setReplyText('');
              }}
              className="px-3 py-1 rounded-lg bg-surface-800 hover:bg-surface-700 text-slate-300 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={replySubmitting || !replyText.trim()}
              className="px-3.5 py-1 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-600/20 disabled:opacity-50"
            >
              {replySubmitting ? 'Posting...' : 'Reply'}
            </button>
          </div>
        </form>
      )}

      {/* Render Nested Threaded Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-2 border-l border-slate-800/80 pl-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              isModerator={isModerator}
              onCommentUpdated={onCommentUpdated}
              onCommentDeleted={onCommentDeleted}
              onOpenReport={onOpenReport}
              supportedLanguages={supportedLanguages}
            />
          ))}
        </div>
      )}
    </div>
  );
}
