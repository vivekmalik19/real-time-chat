import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Mail,
  Calendar,
  Shield,
  Sun,
  Moon,
  Clock,
  Check,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import Button from '../components/common/Button';

export default function ProfilePage() {
  const { user } = useAuth();
  const { theme, themePreference, setPreference, istHour } = useTheme();
  const [saveStatus, setSaveStatus] = useState('');

  const handleSelectPreference = async (pref) => {
    await setPreference(pref, true);
    setSaveStatus('Theme preference saved to your profile.');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Recently';

  return (
    <div className="min-h-screen flex flex-col bg-surface-950 text-slate-100 selection:bg-brand-500/30">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Header Title */}
        <div className="mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Account Profile</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Profile & Settings
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your personal profile, display theme, and account security.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: User Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-surface-900 border border-slate-700/80 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="flex flex-col items-center text-center">
                {/* Avatar */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 p-[2px] shadow-lg mb-4">
                  <div className="w-full h-full rounded-full bg-surface-950 flex items-center justify-center text-2xl font-bold text-white uppercase tracking-wider">
                    {user?.name ? user.name.slice(0, 2) : 'MF'}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white">{user?.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>

                <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Account Verified</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    Member since
                  </span>
                  <span className="font-medium text-slate-200">{memberSince}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-slate-500" />
                    Trusted devices
                  </span>
                  <span className="font-medium text-brand-300">
                    {user?.trustedDeviceCount || 1} active
                  </span>
                </div>
              </div>

              {/* Quick link to security */}
              <div className="mt-6 pt-4 border-t border-slate-800">
                <Link to="/security">
                  <Button variant="secondary" fullWidth size="sm" iconRight={ArrowRight}>
                    Manage Account Security
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Theme Settings & Preferences */}
          <div className="lg:col-span-2 space-y-6">
            {/* Theme Preference Section */}
            <div className="bg-surface-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Display Theme</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Choose your interface theme or let MeetFlow match your local daylight automatically.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-950 border border-slate-800 text-xs font-mono text-slate-300">
                  <span>Current:</span>
                  <strong className="text-brand-300 capitalize">{theme} Mode</strong>
                </div>
              </div>

              {saveStatus && (
                <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs animate-fade-in">
                  <Check className="w-4 h-4" />
                  <span>{saveStatus}</span>
                </div>
              )}

              {/* Theme Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                {/* 1. Auto Option (IST 05:00 - 12:00) */}
                <button
                  type="button"
                  onClick={() => handleSelectPreference('auto')}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all select-none ${
                    themePreference === 'auto'
                      ? 'bg-brand-600/10 border-brand-500 ring-2 ring-brand-500/20 text-white shadow-lg'
                      : 'bg-surface-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm block text-white">Auto (IST)</span>
                      {themePreference === 'auto' && (
                        <Check className="w-4 h-4 text-brand-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Light theme 05:00–12:00 IST, dark theme otherwise. (Current IST Hour: {istHour}:00).
                    </p>
                  </div>
                </button>

                {/* 2. Light Theme */}
                <button
                  type="button"
                  onClick={() => handleSelectPreference('light')}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all select-none ${
                    themePreference === 'light'
                      ? 'bg-brand-600/10 border-brand-500 ring-2 ring-brand-500/20 text-white shadow-lg'
                      : 'bg-surface-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                      <Sun className="w-4 h-4" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm block text-white">Light Mode</span>
                      {themePreference === 'light' && (
                        <Check className="w-4 h-4 text-brand-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Crisp, high-contrast light surfaces for bright working environments.
                    </p>
                  </div>
                </button>

                {/* 3. Dark Theme */}
                <button
                  type="button"
                  onClick={() => handleSelectPreference('dark')}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all select-none ${
                    themePreference === 'dark'
                      ? 'bg-brand-600/10 border-brand-500 ring-2 ring-brand-500/20 text-white shadow-lg'
                      : 'bg-surface-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
                      <Moon className="w-4 h-4" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm block text-white">Dark Mode</span>
                      {themePreference === 'dark' && (
                        <Check className="w-4 h-4 text-brand-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Classic dark slate styling tailored for night and low-light sessions.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Security Quick Link Banner */}
            <div className="bg-gradient-to-r from-surface-900 via-surface-850 to-surface-900 border border-white/[0.08] rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Device Security & Login Audit
                  </h4>
                  <p className="text-xs text-slate-400">
                    Review recent sign-ins, manage trusted devices, and revoke active sessions.
                  </p>
                </div>
              </div>
              <Link to="/security" className="shrink-0 w-full sm:w-auto">
                <Button variant="primary" size="sm" iconRight={ArrowRight}>
                  Open Security Center
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
