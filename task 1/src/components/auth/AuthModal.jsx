import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Shield,
  KeyRound,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';

export default function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalTab,
    setAuthModalTab,
    login,
    register,
    verifyOtp,
    resendOtp,
    pendingOtp,
    cancelOtp,
  } = useAuth();

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [trustDevice, setTrustDevice] = useState(true);

  // Status states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // OTP Countdown Timers
  const [expirySeconds, setExpirySeconds] = useState(600); // 10 minutes
  const [resendCooldown, setResendCooldown] = useState(0);

  // Reset states when modal opens/closes or tab changes
  useEffect(() => {
    setErrorMessage('');
    setSuccessMessage('');
    if (pendingOtp) {
      setExpirySeconds(pendingOtp.expiresInSeconds || 600);
      setResendCooldown(60); // 60s cooldown initially
    }
  }, [authModalTab, isAuthModalOpen, pendingOtp]);

  // Expiry timer countdown
  useEffect(() => {
    if (!pendingOtp || expirySeconds <= 0) return;
    const timer = setInterval(() => {
      setExpirySeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [pendingOtp, expirySeconds]);

  // Resend cooldown timer countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isAuthModalOpen) return null;

  // Format MM:SS
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  // Submit Login / Register
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      if (authModalTab === 'login') {
        const res = await login(email, password);
        if (res?.requiresOtp) {
          setSuccessMessage(res.message || 'Verification code sent to your email.');
          setOtp('');
        }
      } else {
        await register(name, email, password);
      }
    } catch (err) {
      setErrorMessage(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!otp || otp.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyOtp(otp.trim(), trustDevice);
    } catch (err) {
      setErrorMessage(err.message || 'Invalid verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend Code
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await resendOtp();
      setSuccessMessage(res.message || 'New code sent to your email.');
      setResendCooldown(60);
      setExpirySeconds(600);
    } catch (err) {
      setErrorMessage(err.message || 'Unable to resend verification code.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
    >
      <div
        className="bg-surface-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative text-left overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-surface-800 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Ambient Top Glow */}
        <div className="absolute -top-16 -left-16 w-36 h-36 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* =========================================================================
            STATE 1: EMAIL OTP VERIFICATION SCREEN
           ========================================================================= */}
        {pendingOtp ? (
          <div className="space-y-5 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Verify Your Device
                </h3>
                <p className="text-xs text-slate-400">
                  New browser or unverified location detected
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-surface-950/70 p-3 rounded-xl border border-slate-800">
              We sent a 6-digit security code to{' '}
              <strong className="text-brand-300">{pendingOtp.email}</strong>. Please enter it
              below to complete sign in.
            </p>

            {/* Error / Success Messages */}
            {errorMessage && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs animate-fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* OTP Form */}
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Verification Code
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <KeyRound className="w-5 h-5 text-brand-400" />
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    autoFocus
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setOtp(val);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="123456"
                    className="w-full pl-11 pr-4 py-3.5 bg-surface-950/90 border border-slate-700/80 rounded-xl text-center text-2xl font-mono tracking-[0.5em] text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:tracking-normal placeholder:text-slate-600"
                  />
                </div>
              </div>

              {/* Expiry Timer Pill */}
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    Expires in:{' '}
                    <strong className="font-mono text-slate-200">
                      {formatTime(expirySeconds)}
                    </strong>
                  </span>
                </div>

                {/* Resend Action */}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0}
                  className={`text-xs font-medium transition-colors ${
                    resendCooldown > 0
                      ? 'text-slate-500 cursor-not-allowed'
                      : 'text-brand-400 hover:text-brand-300 underline'
                  }`}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>

              {/* Trust this device checkbox */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-950/60 border border-slate-800/80 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={trustDevice}
                  onChange={(e) => setTrustDevice(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-brand-600 rounded bg-surface-900 border-slate-700 focus:ring-brand-500"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-200 block">
                    Trust this browser for 30 days
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    Skips OTP verification on this device during subsequent logins.
                  </span>
                </div>
              </label>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
                disabled={isSubmitting || otp.length !== 6 || expirySeconds <= 0}
                className="mt-2"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                  </span>
                ) : (
                  'Verify & Log In'
                )}
              </Button>

              {/* Cancel Button */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={cancelOtp}
                  className="text-xs text-slate-400 hover:text-white transition-colors"
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* =========================================================================
              STATE 2: STANDARD LOGIN / REGISTER FORM
             ========================================================================= */
          <div className="space-y-6 animate-fade-in">
            {/* Modal Title & Tab Switcher */}
            <div>
              <h3 className="text-2xl font-extrabold text-white tracking-tight mb-2">
                {authModalTab === 'login' ? 'Welcome Back' : 'Create Your Account'}
              </h3>
              <p className="text-xs text-slate-400">
                {authModalTab === 'login'
                  ? 'Sign in to access your profile, saved preferences, and meeting history.'
                  : 'Get started with MeetFlow for high-definition, secure video collaboration.'}
              </p>

              {/* Tab Pills */}
              <div className="flex bg-surface-950/80 p-1 rounded-xl border border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalTab('login');
                    setErrorMessage('');
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    authModalTab === 'login'
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalTab('register');
                    setErrorMessage('');
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    authModalTab === 'register'
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Register
                </button>
              </div>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Field (Register only) */}
              {authModalTab === 'register' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative flex items-center">
                    <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Miller"
                      className="w-full pl-10 pr-4 py-2.5 bg-surface-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={
                      authModalTab === 'register' ? 'Min 8 chars, 1 letter & 1 number' : '••••••••'
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
                disabled={isSubmitting}
                className="mt-3"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                  </span>
                ) : authModalTab === 'login' ? (
                  <span className="flex items-center gap-1.5">
                    Sign In <ArrowRight className="w-4 h-4" />
                  </span>
                ) : (
                  'Create Free Account'
                )}
              </Button>
            </form>

            {/* Bottom info badge */}
            <div className="pt-2 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-brand-400" />
              <span>Protected by device verification and bcrypt encryption</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
