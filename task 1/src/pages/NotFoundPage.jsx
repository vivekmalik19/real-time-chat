import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertTriangle, ArrowLeft } from 'lucide-react';
import Button from '../components/common/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center p-6 text-center">
      {/* Glow */}
      <div className="w-64 h-64 bg-brand-600/15 rounded-full blur-[100px] pointer-events-none absolute" />

      <div className="relative z-10 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-surface-900 border border-slate-700/80 flex items-center justify-center mx-auto mb-6 shadow-xl text-amber-400">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="inline-block px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-mono font-bold text-slate-400 mb-3">
          Error 404
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
          Meeting Room Not Found
        </h1>

        <p className="text-sm text-slate-400 mb-8 leading-relaxed">
          The link you followed may be expired or the address was mistyped. Please check the meeting code or start a new call.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/" className="w-full sm:w-auto">
            <Button
              variant="primary"
              iconLeft={Home}
              fullWidth
            >
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
