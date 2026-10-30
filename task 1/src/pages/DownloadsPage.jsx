import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  XCircle,
  RotateCcw,
  Trash2,
  Play,
  Sparkles,
  Shield,
  Zap,
  ArrowRight,
  Filter,
  RefreshCw,
  Layers,
} from 'lucide-react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import Button from '../components/common/Button';
import { api } from '../utils/api';
import { formatTime, formatRelativeTime } from '../utils/formatTime';
import { useAuth } from '../context/AuthContext';

export default function DownloadsPage() {
  const { user } = useAuth();

  const [quota, setQuota] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'completed' | 'interrupted' | 'failed'
  const [actionMessage, setActionMessage] = useState(null);
  const [switchingPlan, setSwitchingPlan] = useState(false);

  // Load quota and history
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [quotaRes, historyRes] = await Promise.all([
        api.get('/downloads/quota').catch(() => null),
        api.get('/downloads/history').catch(() => null),
      ]);

      if (quotaRes?.success) {
        setQuota(quotaRes);
      }
      if (historyRes?.success) {
        setRecords(historyRes.records || []);
      }
    } catch (err) {
      console.error('Failed to load downloads data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Demo Plan Switcher: allows switching between Free, Bronze, Silver, Gold, or Expired
  const handleSwitchPlan = async (targetPlan, targetStatus = 'active') => {
    try {
      setSwitchingPlan(true);
      const res = await api.post('/subscription/change', {
        plan: targetPlan,
        status: targetStatus,
      });

      if (res.success) {
        setActionMessage({
          type: 'success',
          text: `Plan switched to ${targetPlan.toUpperCase()} (${targetStatus}). Quotas updated.`,
        });
        setTimeout(() => setActionMessage(null), 4000);
        await loadData();
      }
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to switch plan.',
      });
    } finally {
      setSwitchingPlan(false);
    }
  };

  // Re-download or retry
  const handleDownload = async (record) => {
    try {
      const res = await api.post('/downloads/request', {
        videoId: record.videoId,
        quality: record.quality,
        idempotencyKey: `retry_${record._id}_${Date.now()}`,
      });

      if (res.success && res.downloadUrl) {
        // Trigger browser download via stream URL
        const fullUrl = `http://localhost:5001${res.downloadUrl}`;
        const a = document.createElement('a');
        a.href = fullUrl;
        a.download = res.fileName || 'video.mp4';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setActionMessage({
          type: 'success',
          text: res.isDeduplicated
            ? 'Download started! (Free re-download within 15m window, 0 quota used)'
            : 'Download started successfully!',
        });
        setTimeout(() => setActionMessage(null), 5000);
        await loadData();
      }
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Download authorization failed.',
      });
    }
  };

  // Delete history item
  const handleDeleteRecord = async (id) => {
    try {
      await api.delete(`/downloads/records/${id}`);
      setRecords((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      console.error('Failed to delete download record:', err);
    }
  };

  // Filtered records
  const filteredRecords = records.filter((r) => {
    if (activeTab === 'completed') return r.status === 'completed';
    if (activeTab === 'interrupted') return r.status === 'interrupted';
    if (activeTab === 'failed') return r.status === 'failed';
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-surface-950 text-slate-100 selection:bg-brand-500/30">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold mb-3">
            <Download className="w-3.5 h-3.5" />
            <span>Official Task 2 • Secure Download Manager</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Video Downloads & Quota
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your authorized offline downloads, monitor remaining daily and monthly allowances, and stream securely.
          </p>
        </div>

        {/* Action message banner */}
        {actionMessage && (
          <div
            className={`mb-6 p-4 rounded-2xl flex items-center gap-3 text-xs sm:text-sm animate-fade-in ${
              actionMessage.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
            }`}
          >
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            )}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* Quota Cards Section */}
        {quota && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            {/* 1. Active Plan Card */}
            <div className="bg-surface-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Active Subscription
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      quota.subscriptionStatus === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {quota.subscriptionStatus}
                  </span>
                </div>
                <h3 className="text-2xl font-extrabold text-white capitalize flex items-center gap-2">
                  <span>{quota.planName || quota.plan}</span>
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </h3>
                <p className="text-xs text-slate-400 mt-2">
                  Qualities allowed: {quota.allowedQualities?.join(', ') || '720p HD'}
                </p>
                {quota.isExpired && (
                  <div className="mt-3 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Plan expired. Offline downloads paused.</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800 text-[11px] text-slate-400">
                <span>Deduplication window: </span>
                <strong className="text-brand-300">{quota.deduplicationWindowMinutes} minutes</strong>
              </div>
            </div>

            {/* 2. Daily Quota Gauge */}
            <div className="bg-surface-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Daily Download Quota
                  </span>
                  <span className="text-xs font-mono font-bold text-white">
                    {quota.daily.used} / {quota.daily.limit} used
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-extrabold text-white">
                    {quota.daily.remaining}
                  </span>
                  <span className="text-xs text-slate-400">remaining today</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2.5 rounded-full bg-surface-950 overflow-hidden mb-3 border border-white/[0.04]">
                  <div
                    className={`h-full transition-all duration-300 ${
                      quota.daily.remaining === 0
                        ? 'bg-rose-500'
                        : quota.daily.used > 0
                        ? 'bg-brand-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${Math.min(100, (quota.daily.used / (quota.daily.limit || 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Resets at Midnight IST
                </span>
                <span className="font-mono text-brand-300 text-[11px]">
                  in {Math.floor(quota.daily.resetsInSeconds / 3600)}h {Math.floor((quota.daily.resetsInSeconds % 3600) / 60)}m
                </span>
              </div>
            </div>

            {/* 3. Monthly Quota Gauge */}
            <div className="bg-surface-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Monthly Quota
                  </span>
                  <span className="text-xs font-mono font-bold text-white">
                    {quota.monthly.used} / {quota.monthly.limit} used
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-extrabold text-white">
                    {quota.monthly.remaining}
                  </span>
                  <span className="text-xs text-slate-400">remaining this month</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2.5 rounded-full bg-surface-950 overflow-hidden mb-3 border border-white/[0.04]">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (quota.monthly.used / (quota.monthly.limit || 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Monthly reset: 1st of month (IST)</span>
                <span className="font-mono text-slate-300 text-[11px]">
                  {Math.round((quota.monthly.used / quota.monthly.limit) * 100)}% consumed
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Demo Plan Testing Simulator Toolbar */}
        <div className="mb-8 p-5 rounded-3xl bg-surface-900/60 border border-slate-800 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Demo Plan Testing Switcher
                </h4>
                <p className="text-[11px] text-slate-400">
                  Switch subscription tiers on-demand to test Free limit, Bronze, Silver, Gold, or Expired states.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={switchingPlan}
                onClick={() => handleSwitchPlan('free', 'active')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  quota?.plan === 'free' && !quota?.isExpired
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'bg-surface-950 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                Free (1/day)
              </button>

              <button
                type="button"
                disabled={switchingPlan}
                onClick={() => handleSwitchPlan('bronze', 'active')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  quota?.plan === 'bronze' && !quota?.isExpired
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-surface-950 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                Bronze (3/day)
              </button>

              <button
                type="button"
                disabled={switchingPlan}
                onClick={() => handleSwitchPlan('silver', 'active')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  quota?.plan === 'silver' && !quota?.isExpired
                    ? 'bg-slate-400 text-slate-950 font-bold shadow-md'
                    : 'bg-surface-950 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                Silver (10/day)
              </button>

              <button
                type="button"
                disabled={switchingPlan}
                onClick={() => handleSwitchPlan('gold', 'active')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  quota?.plan === 'gold' && !quota?.isExpired
                    ? 'bg-yellow-500 text-yellow-950 font-bold shadow-md'
                    : 'bg-surface-950 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                Gold (50/day)
              </button>

              <button
                type="button"
                disabled={switchingPlan}
                onClick={() => handleSwitchPlan('silver', 'expired')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  quota?.isExpired
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-surface-950 text-rose-400 hover:text-rose-300 border border-rose-900/40'
                }`}
              >
                Simulate Expired
              </button>
            </div>
          </div>
        </div>

        {/* Downloads History Table */}
        <div className="bg-surface-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Download History & Transfers</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-surface-950 text-slate-300 border border-slate-800">
                  {records.length}
                </span>
              </h2>
            </div>

            {/* Sub-tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-950 border border-slate-800 self-start sm:self-auto">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'all'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({records.length})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'completed'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => setActiveTab('interrupted')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'interrupted'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Interrupted
              </button>
              <button
                onClick={() => setActiveTab('failed')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'failed'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Failed
              </button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3 animate-pulse py-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-surface-950 rounded-2xl" />
              ))}
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Download className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">No download records found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
                You haven't initiated any video downloads yet, or no items match the selected tab.
              </p>
              <Link to="/videos">
                <Button variant="primary" size="sm" iconRight={ArrowRight}>
                  Browse Masterclass Catalog
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRecords.map((item) => {
                const isCompleted = item.status === 'completed';
                const isInterrupted = item.status === 'interrupted';
                const isFailed = item.status === 'failed';
                const isAuthorized = item.status === 'authorized';

                return (
                  <div
                    key={item._id}
                    className="p-4 rounded-2xl bg-surface-950/80 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    {/* Left: Thumbnail & Meta */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative w-20 h-14 rounded-xl overflow-hidden shrink-0 bg-slate-900 border border-slate-800">
                        {item.videoThumbnail ? (
                          <img
                            src={item.videoThumbnail}
                            alt={item.videoTitle}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="w-5 h-5 text-slate-600" />
                          </div>
                        )}
                        <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded text-[8px] font-bold uppercase bg-black/80 text-slate-200">
                          {item.quality}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-400 truncate max-w-[140px]">
                            {item.category}
                          </span>
                          <span className="text-slate-500 text-[10px]">•</span>
                          <span className="text-[10px] text-slate-400">
                            {formatRelativeTime(item.initiatedAt)}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-white truncate mb-1">
                          {item.videoTitle}
                        </h4>

                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                          <span>Size: <strong className="text-slate-200">{item.fileSizeFormatted}</strong></span>
                          <span>•</span>
                          <span>Plan: <strong className="text-slate-200 uppercase">{item.planSnapshot?.plan || 'Free'}</strong></span>
                          {item.isDeduplicated && (
                            <>
                              <span>•</span>
                              <span className="text-amber-400 font-semibold">Deduplicated (0 Quota)</span>
                            </>
                          )}
                        </div>

                        {item.failedReason && (
                          <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>{item.failedReason}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Status Pill & Actions */}
                    <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                      {/* Status badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                          isCompleted
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : isAuthorized
                            ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                            : isInterrupted
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {isAuthorized && <Clock className="w-3.5 h-3.5" />}
                        {isInterrupted && <AlertTriangle className="w-3.5 h-3.5" />}
                        {isFailed && <XCircle className="w-3.5 h-3.5" />}
                        <span>{item.status}</span>
                      </span>

                      {/* Download / Retry button */}
                      <button
                        onClick={() => handleDownload(item)}
                        title="Download / Re-download video"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600/20 hover:bg-brand-600 text-brand-300 hover:text-white text-xs font-semibold transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{isCompleted ? 'Re-download' : 'Retry'}</span>
                      </button>

                      {/* Watch link */}
                      <Link
                        to={`/videos/${item.videoId}`}
                        title="Watch video in player"
                        className="p-2 rounded-xl bg-surface-900 hover:bg-surface-800 text-slate-300 hover:text-white transition-colors border border-slate-800"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </Link>

                      {/* Delete record */}
                      <button
                        onClick={() => handleDeleteRecord(item._id)}
                        title="Remove from history"
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
