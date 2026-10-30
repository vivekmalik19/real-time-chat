import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Eye,
  Star,
  CheckCircle2,
  Clock,
  Sparkles,
  Share2,
  Bookmark,
  Play,
  SkipForward,
  History,
  Download,
  AlertTriangle,
  AlertCircle,
  X,
  Zap,
} from 'lucide-react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import CustomVideoPlayer from '../components/player/CustomVideoPlayer';
import CommentsSection from '../components/comments/CommentsSection';
import { api } from '../utils/api';
import { formatTime, formatRelativeTime } from '../utils/formatTime';
import { useAuth } from '../context/AuthContext';
import { getStoredProgress } from '../utils/watchProgressStorage';

export default function VideoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();

  const [video, setVideo] = useState(null);
  const [allVideos, setAllVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [copied, setCopied] = useState(false);

  // Download states
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadQuota, setDownloadQuota] = useState(null);
  const [downloadResult, setDownloadResult] = useState(null);
  const [downloadError, setDownloadError] = useState(null);

  // Load video and catalog
  useEffect(() => {
    async function fetchVideoData() {
      try {
        setLoading(true);
        setError(null);

        const [videoRes, catalogRes] = await Promise.all([
          api.get(`/videos/${id}`),
          api.get('/videos'),
        ]);

        if (videoRes.success) {
          let currentVid = videoRes.video;
          // Check scoped local storage progress if backend progress is null
          if (!currentVid.progress) {
            const local = getStoredProgress(id, user?._id);
            if (local && typeof local.currentTime === 'number' && local.currentTime > 0) {
              const dur = local.duration || currentVid.duration || 1;
              const completionPercentage = Math.min(100, Math.round((local.currentTime / dur) * 100));
              currentVid = {
                ...currentVid,
                progress: {
                  currentTime: local.currentTime,
                  duration: dur,
                  completionPercentage,
                  completed: Boolean(local.completed) || completionPercentage >= 90,
                  lastWatched: local.lastWatched || new Date().toISOString(),
                },
              };
            }
          }
          setVideo(currentVid);
        } else {
          setError(videoRes.message || 'Video not found');
        }

        if (catalogRes.success) {
          const enrichedList = catalogRes.videos.map((v) => {
            if (!v.progress) {
              const local = getStoredProgress(v.id, user?._id);
              if (local && typeof local.currentTime === 'number' && local.currentTime > 0) {
                const dur = local.duration || v.duration || 1;
                const completionPercentage = Math.min(100, Math.round((local.currentTime / dur) * 100));
                return {
                  ...v,
                  progress: {
                    currentTime: local.currentTime,
                    duration: dur,
                    completionPercentage,
                    completed: Boolean(local.completed) || completionPercentage >= 90,
                    lastWatched: local.lastWatched || new Date().toISOString(),
                  },
                };
              }
            }
            return v;
          });
          setAllVideos(enrichedList);
        }
      } catch (err) {
        setError(err.message || 'Failed to load video');
      } finally {
        setLoading(false);
      }
    }

    fetchVideoData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id, user?._id]);

  // Compute related video recommendations & queue
  const otherVideos = allVideos.filter((v) => v.id !== id);

  const recommendedVideos = otherVideos
    .map((v) => {
      let score = 0;
      // Boost if same category
      if (video && v.category === video.category) score += 10;
      // Boost for shared tags
      if (video?.tags && v.tags) {
        const shared = v.tags.filter((t) => video.tags.includes(t));
        score += shared.length * 3;
      }
      // Rating weight
      score += v.rating || 0;
      return { ...v, relevanceScore: score };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Next video is the top recommended video or fallback to sequence
  const nextVideo = recommendedVideos.length > 0 ? recommendedVideos[0] : null;

  // Open download modal and check quota
  const handleOpenDownloadModal = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    setDownloadModalOpen(true);
    setDownloadError(null);
    setDownloadResult(null);

    try {
      const qRes = await api.get('/downloads/quota');
      if (qRes.success) {
        setDownloadQuota(qRes);
      }
    } catch (err) {
      console.warn('Failed to fetch quota:', err);
    }
  };

  // Perform authorized video download
  const handleConfirmDownload = async () => {
    try {
      setDownloadLoading(true);
      setDownloadError(null);

      const idempotencyKey = `req_${user?._id}_${video.id}_${Date.now()}`;
      const res = await api.post('/downloads/request', {
        videoId: video.id,
        quality: video.quality,
        idempotencyKey,
      });

      if (res.success && res.downloadUrl) {
        setDownloadResult(res);

        // Trigger browser download via stream URL
        const fullUrl = `http://localhost:5001${res.downloadUrl}`;
        const a = document.createElement('a');
        a.href = fullUrl;
        a.download = res.fileName || `${video.title}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Refresh quota
        const qRes = await api.get('/downloads/quota');
        if (qRes.success) {
          setDownloadQuota(qRes);
        }
      }
    } catch (err) {
      setDownloadError(err.message || 'Download authorization failed.');
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-950 text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-7xl mx-auto px-4 py-12 w-full animate-pulse">
          <div className="w-40 h-6 bg-surface-800 rounded-lg mb-6" />
          <div className="w-full aspect-video bg-surface-900 rounded-2xl mb-6" />
          <div className="w-3/4 h-8 bg-surface-800 rounded-lg mb-3" />
          <div className="w-1/2 h-5 bg-surface-800 rounded-lg mb-6" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-surface-950 text-slate-100 flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Video Not Found</h2>
          <p className="text-sm text-slate-400 max-w-md mb-6">
            The video stream you are looking for could not be found or is unavailable.
          </p>
          <Link
            to="/videos"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Video Catalog</span>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-950 text-slate-100 flex flex-col">
      <Navbar />

      {/* Theater Mode Wrapper or Standard Container */}
      <div
        className={
          isTheaterMode
            ? 'w-full bg-black py-2 sm:py-4 transition-all duration-300'
            : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2 w-full'
        }
      >
        <div className={isTheaterMode ? 'max-w-[1700px] mx-auto px-2 sm:px-6' : ''}>
          {/* Back link when not in theater mode */}
          {!isTheaterMode && (
            <div className="mb-3">
              <Link
                to="/videos"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Video Catalog</span>
              </Link>
            </div>
          )}

          {/* Custom HTML5 Video Player */}
          <CustomVideoPlayer
            video={video}
            nextVideo={nextVideo}
            onNavigateNext={(nextId) => navigate(`/videos/${nextId}`)}
            isTheaterMode={isTheaterMode}
            onToggleTheater={() => setIsTheaterMode(!isTheaterMode)}
          />
        </div>
      </div>

      {/* Main Content & Up Next Sidebar Layout */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Video Details & Description */}
          <div className="lg:col-span-2">
            {/* Header info */}
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-brand-500/10 text-brand-300 border border-brand-500/20">
                {video.category}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-surface-800 text-slate-300 border border-slate-700">
                {video.quality}
              </span>
              {video.progress?.completed && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Watched</span>
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-tight mb-4">
              {video.title}
            </h1>

            {/* Meaningful Watch Progress & Last Watched Banner */}
            {video.progress && video.progress.currentTime > 0 && (
              <div className="mb-4 p-3 rounded-xl bg-surface-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-xs">
                  <div className={`p-1.5 rounded-lg ${video.progress.completed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-brand-500/20 text-brand-400'}`}>
                    {video.progress.completed ? <CheckCircle2 className="w-4 h-4" /> : <History className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-200">
                      {video.progress.completed
                        ? 'Completed'
                        : `Watched ${formatTime(video.progress.currentTime)} of ${formatTime(video.progress.duration || video.duration)} (${video.progress.completionPercentage}%)`}
                    </span>
                    {video.progress.lastWatched && (
                      <span className="text-slate-400 ml-2 text-[11px]">
                        • Last activity {formatRelativeTime(video.progress.lastWatched)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-full sm:w-36 h-1.5 rounded-full bg-surface-800 overflow-hidden">
                  <div
                    className={`h-full ${video.progress.completed ? 'bg-emerald-500' : 'bg-gradient-to-r from-brand-500 to-indigo-500'}`}
                    style={{ width: `${video.progress.completionPercentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Metrics & Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="font-medium text-slate-300">{video.author}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>{video.views} views</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{video.rating}</span>
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenDownloadModal}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/20 text-xs font-semibold transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-900 hover:bg-surface-800 border border-slate-700/80 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copied ? 'Link Copied!' : 'Share'}</span>
                </button>
              </div>
            </div>

            {/* Description & Tags */}
            <div className="py-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-2">
                About this Masterclass
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line mb-6">
                {video.description}
              </p>

              {/* Tags */}
              {video.tags && video.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {video.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-surface-900 border border-slate-800 text-slate-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Multilingual Comments & Discussion Section (Task 6) */}
            <CommentsSection videoId={id} />
          </div>

          {/* Right Column: Recommended & Up Next Queue */}
          <div className="lg:col-span-1">
            <div className="p-5 rounded-2xl bg-surface-900/60 border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <SkipForward className="w-4 h-4 text-brand-400" />
                  <span>Related & Up Next</span>
                </h3>
                <span className="text-xs text-slate-400">{recommendedVideos.length} videos</span>
              </div>

              <div className="space-y-3">
                {recommendedVideos.map((item, index) => {
                  const isSameCategory = video && item.category === video.category;
                  const isTopNext = index === 0;

                  return (
                    <Link
                      key={item.id}
                      to={`/videos/${item.id}`}
                      className="group flex gap-3 p-2 rounded-xl hover:bg-surface-800/80 transition-colors relative"
                    >
                      {/* Thumbnail */}
                      <div className="relative w-28 h-18 rounded-lg overflow-hidden shrink-0 bg-slate-800">
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded text-[9px] font-mono font-medium bg-black/80 text-white">
                          {item.durationFormatted}
                        </span>
                        {item.progress?.completed && (
                          <span className="absolute top-1 left-1 p-0.5 rounded-full bg-emerald-500 text-white">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>

                      {/* Metadata */}
                      <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            {isTopNext ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-brand-500/20 text-brand-300 border border-brand-500/30">
                                Up Next
                              </span>
                            ) : isSameCategory ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                Related
                              </span>
                            ) : null}
                          </div>
                          <h4 className="text-xs font-semibold text-white group-hover:text-brand-300 transition-colors line-clamp-2 leading-snug">
                            {item.title}
                          </h4>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.author.split('&')[0]}</p>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-brand-400 font-medium">
                          <span className="truncate">{item.category.split('&')[0]}</span>
                          {item.progress && item.progress.currentTime > 0 && !item.progress.completed && (
                            <span className="text-amber-400 font-mono text-[9px]">
                              {item.progress.completionPercentage}%
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Secure Video Download Authorization Modal */}
      {downloadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-surface-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden p-6 text-white">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Download Video</h3>
                  <p className="text-xs text-slate-400">Official Task 2 • Authorized Delivery</p>
                </div>
              </div>
              <button
                onClick={() => setDownloadModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-5 space-y-4">
              {/* Video Snapshot Card */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-950/70 border border-slate-800">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-20 h-14 object-cover rounded-xl border border-slate-800 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white line-clamp-1">{video.title}</h4>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                    <span className="px-1.5 py-0.2 rounded bg-surface-800 text-slate-300 font-bold uppercase text-[9px]">
                      {video.quality}
                    </span>
                    <span>•</span>
                    <span>{video.fileSizeFormatted || 'Estimated 10.5 MB'}</span>
                    <span>•</span>
                    <span className="text-brand-400">{video.category}</span>
                  </div>
                </div>
              </div>

              {/* Inaccessible Video State */}
              {video.allowDownload === false ? (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <div>
                    <strong className="block font-bold mb-0.5">Distribution Restricted</strong>
                    <span>{video.downloadRestrictedReason || 'This masterclass is restricted to in-app stream playback only.'}</span>
                  </div>
                </div>
              ) : downloadQuota?.isExpired ? (
                /* Expired Subscription State */
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <div>
                    <strong className="block font-bold mb-0.5">Subscription Expired</strong>
                    <span>Your active subscription plan has expired. Please renew or upgrade your plan to unlock video downloads.</span>
                    <div className="mt-2.5">
                      <Link
                        to="/downloads"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 text-white font-semibold text-xs"
                      >
                        <span>Manage Subscription & Plan</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ) : downloadQuota && downloadQuota.daily.remaining === 0 ? (
                /* Quota Exhausted State */
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <strong className="block font-bold mb-0.5">Daily Quota Exhausted</strong>
                    <span>
                      You have used all {downloadQuota.daily.limit} download{downloadQuota.daily.limit === 1 ? '' : 's'} for today on your {downloadQuota.planName}. Quota resets at midnight IST.
                    </span>
                    <div className="mt-2.5">
                      <Link
                        to="/downloads"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-600 text-white font-semibold text-xs"
                      >
                        <span>Upgrade Plan on Downloads Page</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                /* Quota Status Gauge */
                downloadQuota && (
                  <div className="p-4 rounded-2xl bg-surface-950/70 border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Current Plan:</span>
                      <strong className="text-white capitalize flex items-center gap-1">
                        <span>{downloadQuota.planName}</span>
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      </strong>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span>Daily Allowance:</span>
                      <strong className="font-mono text-emerald-400">
                        {downloadQuota.daily.remaining} of {downloadQuota.daily.limit} remaining today
                      </strong>
                    </div>

                    <div className="flex items-center justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-800/80">
                      <span>Daily reset:</span>
                      <span>Midnight IST (resets in {Math.floor(downloadQuota.daily.resetsInSeconds / 3600)}h {Math.floor((downloadQuota.daily.resetsInSeconds % 3600) / 60)}m)</span>
                    </div>
                  </div>
                )
              )}

              {/* Deduplication & Success Result Notice */}
              {downloadResult && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                  <div>
                    <strong className="block font-bold mb-0.5">Download Authorized!</strong>
                    <span>Your video transfer has started in your browser.</span>
                    {downloadResult.isDeduplicated && (
                      <p className="mt-1 text-[11px] text-amber-300">
                        ⚡ Free Re-download: Downloaded within the 15-minute window; 0 daily quota consumed!
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Error Notice */}
              {downloadError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{downloadError}</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
              <Link
                to="/downloads"
                onClick={() => setDownloadModalOpen(false)}
                className="text-xs text-brand-400 hover:text-brand-300 transition-colors font-medium"
              >
                View All Downloads
              </Link>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDownloadModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Close
                </button>

                {video.allowDownload !== false && !downloadQuota?.isExpired && (downloadQuota?.daily?.remaining > 0 || downloadResult?.isDeduplicated) && (
                  <button
                    type="button"
                    disabled={downloadLoading}
                    onClick={handleConfirmDownload}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50"
                  >
                    {downloadLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Authorizing...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>{downloadResult ? 'Download Again' : 'Confirm Download'}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
