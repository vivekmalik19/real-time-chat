import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, User, Lock, Mail, Sparkles, ArrowRight } from 'lucide-react';

const AVATAR_SEEDS = ['Felix', 'Luna', 'Nova', 'Leo', 'Milo', 'Zara', 'Echo', 'Pixel'];

export default function AuthModal() {
  const { login, register, guestLogin } = useAuth();
  const [tab, setTab] = useState('guest'); // 'guest' | 'login' | 'register'

  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_SEEDS[0]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getAvatarUrl = (seed) => `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed)}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (tab === 'guest') {
        const name = username.trim() || `Guest_${Math.floor(1000 + Math.random() * 9000)}`;
        await guestLogin(name, getAvatarUrl(selectedAvatar));
      } else if (tab === 'login') {
        if (!username || !password) {
          throw new Error('Please enter username and password');
        }
        await login(username, password);
      } else if (tab === 'register') {
        if (!username || !password) {
          throw new Error('Please enter username and password');
        }
        if (password.length < 4) {
          throw new Error('Password must be at least 4 characters');
        }
        await register(username, email, password, getAvatarUrl(selectedAvatar));
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-dark-sidebar border border-dark-border rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-brand-900/40 via-purple-900/20 to-transparent border-b border-dark-border flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              PulseChat
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                MERN
              </span>
            </h2>
            <p className="text-xs text-slate-400">Next-Gen Real-Time Communication</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-dark-border bg-dark-bg/60 p-1.5 gap-1.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => { setTab('guest'); setError(''); }}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              tab === 'guest'
                ? 'bg-brand-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-dark-hover'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Quick Guest
          </button>
          <button
            type="button"
            onClick={() => { setTab('login'); setError(''); }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              tab === 'login'
                ? 'bg-brand-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-dark-hover'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setError(''); }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              tab === 'register'
                ? 'bg-brand-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-dark-hover'
            }`}
          >
            Register
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></span>
              {error}
            </div>
          )}

          {/* Avatar Selection for Guest & Register */}
          {tab !== 'login' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Choose Your Avatar
              </label>
              <div className="flex gap-2 overflow-x-auto py-1 scrollbar-none">
                {AVATAR_SEEDS.map((seed) => (
                  <button
                    key={seed}
                    type="button"
                    onClick={() => setSelectedAvatar(seed)}
                    className={`relative rounded-xl p-1 transition-transform flex-shrink-0 ${
                      selectedAvatar === seed
                        ? 'ring-2 ring-brand-500 scale-105 bg-brand-500/20'
                        : 'opacity-60 hover:opacity-100 bg-dark-card hover:scale-100'
                    }`}
                  >
                    <img
                      src={getAvatarUrl(seed)}
                      alt={seed}
                      className="w-10 h-10 rounded-lg bg-dark-hover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Username Field */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">
              {tab === 'guest' ? 'Display Name (Optional)' : 'Username'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={tab === 'guest' ? 'e.g. Alex (or random)' : 'Enter username'}
                className="w-full pl-9 pr-3 py-2 bg-dark-card border border-dark-border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
          </div>

          {/* Email for Register */}
          {tab === 'register' && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Email (Optional)</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 bg-dark-card border border-dark-border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Password for Login & Register */}
          {tab !== 'guest' && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-dark-card border border-dark-border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>
                  {tab === 'guest'
                    ? 'Enter Chat as Guest'
                    : tab === 'login'
                    ? 'Sign In to PulseChat'
                    : 'Create Account'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
