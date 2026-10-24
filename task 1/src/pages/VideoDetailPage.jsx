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
} from 'lucide-react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import CustomVideoPlayer from '../components/player/CustomVideoPlayer';
import { api } from '../utils/api';
import { formatTime } from '../utils/formatTime';

export default function VideoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [video, setVideo] = useState(null);
  const [allVideos, setAllVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [copied, setCopied] = useState(false);

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
          // Check local storage progress if backend progress is null
          if (!currentVid.progress) {
            try {
              const local = localStorage.getItem(`meetflow_progress_${id}`);
              if (local) {
                const p = JSON.parse(local);
                if (p && typeof p.currentTime === 'number' && p.currentTime > 0) {
                  const dur = p.duration || currentVid.duration || 1;
                  const completionPercentage = Math.min(100, Math.round((p.currentTime / dur) * 100));
                  currentVid = {
                    ...currentVid,
                    progress: {
                      currentTime: p.currentTime,
                      duration: dur,
                      completionPercentage,
                      completed: completionPercentage >= 90,
                      lastWatched: p.timestamp ? new Date(p.timestamp) : new Date(),
                    },
                  };
                }
              }
            } catch {
              // Ignore parse error
            }
          }
          setVideo(currentVid);
        } else {
          setError(videoRes.message || 'Video not found');
        }

        if (catalogRes.success) {
          const enrichedList = catalogRes.videos.map((v) => {
            if (!v.progress) {
              try {
                const local = localStorage.getItem(`meetflow_progress_${v.id}`);
                if (local) {
                  const p = JSON.parse(local);
                  if (p && typeof p.currentTime === 'number' && p.currentTime > 0) {
                    const dur = p.duration || v.duration || 1;
                    const completionPercentage = Math.min(100, Math.round((p.currentTime / dur) * 100));
                    return {
                      ...v,
                      progress: {
                        currentTime: p.currentTime,
                        duration: dur,
                        completionPercentage,
                        completed: completionPercentage >= 90,
                        lastWatched: p.timestamp ? new Date(p.timestamp) : new Date(),
                      },
                    };
                  }
                }
              } catch {
                // Ignore parse errors
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
  }, [id]);

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
    </div>
  );
}
