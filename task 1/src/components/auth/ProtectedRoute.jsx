import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, LogIn, Loader2 } from 'lucide-react';
import Button from '../common/Button';

/**
 * Route Guard Component
 * Ensures user is authenticated before rendering protected views
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, openAuthModal } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center p-6 text-slate-300">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin mb-3" />
        <span className="text-sm font-medium">Verifying authorization...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="max-w-md w-full bg-surface-900 border border-slate-700/80 rounded-3xl p-8 shadow-2xl relative">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Sign In Required</h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            You must be signed in to view your profile and manage account security settings.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              variant="primary"
              fullWidth
              size="lg"
              iconLeft={LogIn}
              onClick={() => openAuthModal('login')}
            >
              Sign In to Continue
            </Button>
            <a
              href="/"
              className="text-xs text-slate-400 hover:text-white transition-colors py-2"
            >
              ← Return to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
