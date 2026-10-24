import React from 'react';
import { CheckCircle2, AlertCircle, Info, Sparkles, X } from 'lucide-react';

/**
 * Reusable Toast Notification component
 * @param {Object} props
 * @param {string} props.message
 * @param {'info' | 'success' | 'error'} [props.type='info']
 * @param {() => void} [props.onClose]
 */
export default function Toast({ message, type = 'info', onClose }) {
  if (!message) return null;

  const typeConfig = {
    info: {
      bg: 'bg-surface-900/95 border-brand-500/40 text-slate-100 shadow-brand-500/10',
      icon: Sparkles,
      iconColor: 'text-brand-400',
    },
    success: {
      bg: 'bg-surface-900/95 border-emerald-500/40 text-slate-100 shadow-emerald-500/10',
      icon: CheckCircle2,
      iconColor: 'text-emerald-400',
    },
    error: {
      bg: 'bg-surface-900/95 border-rose-500/40 text-slate-100 shadow-rose-500/10',
      icon: AlertCircle,
      iconColor: 'text-rose-400',
    },
  };

  const config = typeConfig[type] || typeConfig.info;
  const IconComponent = config.icon;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 max-w-md w-[calc(100%-2rem)] sm:w-auto animate-fade-in"
    >
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl ${config.bg}`}
      >
        <div className="shrink-0">
          <IconComponent className={`w-4 h-4 ${config.iconColor}`} />
        </div>
        <p className="text-xs sm:text-sm font-medium leading-tight flex-1 text-slate-200">
          {message}
        </p>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 ml-1"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
