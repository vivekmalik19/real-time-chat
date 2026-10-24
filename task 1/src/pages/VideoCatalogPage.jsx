import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Play,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Eye,
  Star,
  Sparkles,
  BookOpen,
  ArrowUpDown,
  Tag,
} from 'lucide-react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { api } from '../utils/api';
import { formatTime } from '../utils/formatTime';

const CATEGORIES = [
  'All',
  'Computer Graphics & 3D Animation',
  'Digital Art & Storytelling',
  'Technology & Web Media',
  'Nature & Exploration',
];

export default function VideoCatalogPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('featured');

  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoading(true);
        const data = await api.get('/videos');
        if (data.success) {
          // Merge local storage progress for any videos where server progress is null
          const enriched = data.videos.map((v) => {
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
          setVideos(enriched);
        }
      } catch (err) {
        console.error('Failed to load videos:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  // Filter & Sort videos
  const filteredVideos = useMemo(() => {
    const list = videos.filter((v) => {
      const matchesCategory =
        selectedCategory === 'All' || v.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        v.title.toLowerCase().includes(query) ||
        v.description.toLowerCase().includes(query) ||
        v.tags?.some((tag) => tag.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });

    switch (sortBy) {
      case 'rating':
        return [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'duration-asc':
        return [...list].sort((a, b) => (a.duration || 0) - (b.duration || 0));
      case 'duration-desc':
        return [...list].sort((a, b) => (b.duration || 0) - (a.duration || 0));
      case 'title':
        return [...list].sort((a, b) => a.title.localeCompare(b.title));
      default:
        return list;
    }
  }, [videos, selectedCategory, searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-surface-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        {/* Header Hero Section */}
        <div className="mb-10 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <BookOpen className="w-3.5 h-3.5 text-brand-400" />
            <span>MeetFlow Learning & Masterclasses</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
            Explore Open Media &{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-indigo-400 to-purple-400">
              Interactive Video
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Stream high-definition open cinema, VFX masterclasses, and technical video streams with our custom HTML5 player. Progress is automatically synced to your account.
          </p>
        </div>

        {/* Search, Category, and Sort Toolbar */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search tutorials, 3D films, VFX, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-900 border border-slate-700/80 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <ArrowUpDown className="w-4 h-4 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort videos"
                className="bg-surface-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-brand-500 cursor-pointer"
              >
                <option value="featured">Sort: Featured</option>
                <option value="rating">Sort: Top Rated</option>
                <option value="duration-asc">Sort: Shortest First</option>
                <option value="duration-desc">Sort: Longest First</option>
                <option value="title">Sort: Alphabetical</option>
              </select>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/25'
                    : 'bg-surface-900 text-slate-300 hover:text-white hover:bg-surface-800 border border-slate-700/80'
                }`}
              >
                {category === 'All' ? 'All Masterclasses' : category}
              </button>
            ))}
          </div>
        </div>

        {/* Video Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-2xl bg-surface-900 border border-slate-800 h-72" />
            ))}
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="text-center py-16 bg-surface-900/50 rounded-2xl border border-slate-800 p-8">
            <Filter className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No videos found</h3>
            <p className="text-xs text-slate-400 mb-4">
              Try adjusting your search terms or selecting a different category filter.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-white text-xs font-semibold transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video) => {
              const progress = video.progress;
              const hasProgress = progress && progress.currentTime > 5;
              const isCompleted = progress && progress.completed;

              return (
                <Link
                  key={video.id}
                  to={`/videos/${video.id}`}
                  className="group flex flex-col rounded-2xl bg-surface-900/80 hover:bg-surface-900 border border-slate-800 hover:border-slate-700 transition-all duration-200 overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-1"
                >
                  {/* Thumbnail Container */}
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                    {/* Center Play Button on Hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 rounded-full bg-brand-600/90 text-white flex items-center justify-center shadow-lg shadow-brand-600/40 transform scale-90 group-hover:scale-100 transition-transform">
                        <Play className="w-5 h-5 fill-white translate-x-0.5" />
                      </div>
                    </div>

                    {/* Duration Badge */}
                    <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-black/80 text-white backdrop-blur-sm">
                      {video.durationFormatted}
                    </span>

                    {/* Quality Badge */}
                    <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black/60 text-slate-300 border border-white/10 backdrop-blur-sm">
                      {video.quality.includes('1080p') ? '1080p' : '720p'}
                    </span>

                    {/* Completion Status Badge */}
                    {isCompleted && (
                      <span className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/90 text-white shadow-md backdrop-blur-sm">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Completed</span>
                      </span>
                    )}

                    {/* Watch Progress Bar */}
                    {hasProgress && (
                      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20">
                        <div
                          className={`h-full ${
                            isCompleted ? 'bg-emerald-500' : 'bg-brand-500'
                          }`}
                          style={{ width: `${progress.completionPercentage}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-brand-400 mb-1.5">
                        <span className="truncate">{video.category}</span>
                        {hasProgress && !isCompleted && (
                          <span className="text-amber-400 font-mono">
                            {progress.completionPercentage}% watched
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-brand-300 transition-colors line-clamp-2 mb-2 leading-snug">
                        {video.title}
                      </h3>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                        {video.description}
                      </p>
                    </div>

                    {/* Author & Stats Footer */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <span className="truncate max-w-[140px] font-medium text-slate-300">
                        {video.author.split('&')[0]}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>{video.views}</span>
                        </span>
                        <span className="flex items-center gap-1 text-amber-400">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{video.rating}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
