import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Reusable accessible modal dialog
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  icon: Icon,
  iconClassName = "text-brand-400 bg-brand-500/10 border-brand-500/20",
  children,
  maxWidth = "max-w-md",
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div
        className={`bg-surface-900 border border-slate-700/80 rounded-2xl p-6 w-full ${maxWidth} shadow-2xl relative text-left`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-800 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {Icon && (
          <div
            className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-4 ${iconClassName}`}
          >
            <Icon className="w-6 h-6" />
          </div>
        )}

        {title && (
          <h3 className="text-lg font-bold text-white mb-2 tracking-tight">
            {title}
          </h3>
        )}

        <div className="text-slate-300 text-sm">{children}</div>
      </div>
    </div>
  );
}
