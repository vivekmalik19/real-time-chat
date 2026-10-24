import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Video,
  Sparkles,
  Menu,
  X,
  ArrowUpRight,
  Sun,
  Moon,
  User,
  Shield,
  LogOut,
  ChevronDown,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Button from './Button';

/**
 * Navbar component for MeetFlow with authenticated state, security links, and theme toggle
 */
export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const location = useLocation();
  const isHome = location.pathname === '/';

  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    if (!isHome) return;
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-surface-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-500 p-[1px] shadow-lg shadow-brand-500/20 group-hover:shadow-brand-500/40 transition-shadow">
              <div className="w-full h-full bg-surface-950 rounded-[11px] flex items-center justify-center">
                <Video className="w-5 h-5 text-brand-400 group-hover:scale-110 transition-transform duration-200" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-white font-sans">
                  Meet<span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-purple-400">Flow</span>
                </span>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20">
                  Platform
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection('features')}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              About
            </button>
            <Link
              to="/videos"
              className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                location.pathname.startsWith('/videos')
                  ? 'text-brand-400 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Videos
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1"
            >
              Docs <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Quick Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="p-2.5 rounded-xl border border-slate-800 bg-surface-900/80 text-slate-300 hover:text-white hover:bg-surface-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-purple-400" />
              )}
            </button>

            {/* Authenticated User Menu vs Sign In */}
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-surface-900 border border-slate-700/80 hover:border-slate-600 transition-colors shadow-sm select-none"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-brand-600 to-purple-600 p-[1.5px]">
                    <div className="w-full h-full rounded-full bg-surface-950 flex items-center justify-center text-[11px] font-bold text-white uppercase">
                      {user?.name ? user.name.slice(0, 2) : 'MF'}
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-200 max-w-[120px] truncate">
                    {user?.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-surface-900 border border-slate-700 shadow-2xl py-2 z-50 animate-fade-in backdrop-blur-xl">
                    <div className="px-4 py-2 border-b border-slate-800">
                      <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-surface-800 hover:text-white transition-colors"
                      >
                        <User className="w-4 h-4 text-brand-400" />
                        <span>Profile & Theme</span>
                      </Link>

                      <Link
                        to="/security"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-surface-800 hover:text-white transition-colors"
                      >
                        <Shield className="w-4 h-4 text-emerald-400" />
                        <span>Security & Devices</span>
                      </Link>
                    </div>

                    <div className="border-t border-slate-800 pt-1">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openAuthModal('login')}
                >
                  Sign In
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  iconLeft={Sparkles}
                  onClick={() => openAuthModal('register')}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-300 hover:bg-surface-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-purple-400" />
              )}
            </button>

            {isAuthenticated ? (
              <Link to="/profile" className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-purple-600 p-[1px]">
                  <div className="w-full h-full rounded-full bg-surface-950 flex items-center justify-center text-xs font-bold text-white uppercase">
                    {user?.name ? user.name.slice(0, 2) : 'MF'}
                  </div>
                </div>
              </Link>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openAuthModal('login')}
                className="text-xs px-2.5"
              >
                Sign In
              </Button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-surface-800/80 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-surface-950/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-3 animate-fade-in">
          <button
            onClick={() => scrollToSection('features')}
            className="block w-full text-left py-2 px-3 text-base font-medium text-slate-200 hover:bg-surface-800/60 rounded-lg transition-colors"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('about')}
            className="block w-full text-left py-2 px-3 text-base font-medium text-slate-200 hover:bg-surface-800/60 rounded-lg transition-colors"
          >
            About
          </button>
          <Link
            to="/videos"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2 py-2 px-3 text-base font-medium rounded-lg transition-colors ${
              location.pathname.startsWith('/videos')
                ? 'text-brand-400 bg-brand-500/10'
                : 'text-slate-200 hover:bg-surface-800/60'
            }`}
          >
            <BookOpen className="w-4 h-4 text-brand-400" />
            <span>Videos</span>
          </Link>

          {isAuthenticated ? (
            <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 py-2 px-3 text-sm font-medium text-slate-200 hover:bg-surface-800 rounded-lg"
              >
                <User className="w-4 h-4 text-brand-400" />
                <span>Profile & Theme</span>
              </Link>

              <Link
                to="/security"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 py-2 px-3 text-sm font-medium text-slate-200 hover:bg-surface-800 rounded-lg"
              >
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Security & Devices</span>
              </Link>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="flex items-center gap-2 py-2 px-3 text-sm font-medium text-rose-400 hover:bg-rose-500/10 rounded-lg text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
              <Button
                variant="primary"
                fullWidth
                iconLeft={Sparkles}
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuthModal('register');
                }}
              >
                Create Account
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
