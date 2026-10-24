import React from 'react';
import { X, Keyboard } from 'lucide-react';

/**
 * Keyboard Shortcuts Modal
 * Displays available keyboard controls for the custom HTML5 video player.
 */
export default function ShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space / K', desc: 'Toggle Play / Pause' },
    { key: '← / →', desc: 'Seek 10 seconds backward / forward' },
    { key: 'Shift + ← / →', desc: 'Seek 30 seconds backward / forward' },
    { key: '↑ / ↓', desc: 'Volume up / down (10%)' },
    { key: 'M', desc: 'Toggle Mute / Unmute' },
    { key: 'F', desc: 'Toggle Fullscreen' },
    { key: 'T', desc: 'Toggle Theater mode' },
    { key: 'P', desc: 'Toggle Picture-in-Picture (when supported)' },
    { key: 'C', desc: 'Toggle Captions / Subtitles (when available)' },
    { key: '> / <', desc: 'Increase / Decrease playback speed (0.5x–2x)' },
    { key: 'Shift + N', desc: 'Play next video in queue' },
    { key: '?', desc: 'Show / Hide keyboard shortcuts' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-surface-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-white max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Keyboard Shortcuts</h3>
              <p className="text-xs text-slate-400">Control the video player directly from your keyboard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="mt-4 grid grid-cols-1 gap-2.5">
          {shortcuts.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 px-3 rounded-xl bg-surface-950/60 border border-white/[0.04]"
            >
              <span className="text-xs text-slate-300 font-medium">{item.desc}</span>
              <kbd className="px-2 py-1 text-[11px] font-mono font-semibold rounded-md bg-surface-800 border border-slate-700 text-brand-300 shadow-sm">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-3 border-t border-slate-800 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-white font-medium text-xs transition-colors"
          >
            Got it (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
