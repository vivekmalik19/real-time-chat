import React from 'react';
import { Keyboard, X, AlertCircle } from 'lucide-react';

/**
 * Reusable Room ID input component with error messaging
 */
export default function RoomInput({
  value,
  onChange,
  onClear,
  onKeyDown,
  error,
  placeholder = "e.g. MF-A7K29X",
  className = "",
  autoFocus = false,
  disabled = false,
}) {
  return (
    <div className={`relative flex flex-col ${className}`}>
      <div className="relative flex items-center">
        <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
          <Keyboard className="w-4 h-4 text-slate-400" />
        </div>
        <input
          type="text"
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={disabled}
          maxLength={15}
          spellCheck={false}
          autoCapitalize="characters"
          className={`w-full pl-10 pr-10 py-3 bg-surface-900/80 border rounded-xl text-slate-100 placeholder-slate-500 font-mono text-sm tracking-wide transition-all duration-200 outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-950 ${
            error
              ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/40 bg-rose-500/5'
              : 'border-slate-700/80 hover:border-slate-600 focus:border-brand-500 focus:ring-brand-500/30'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        {value && !disabled && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-surface-800 transition-colors"
            title="Clear text"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1.5 mt-2 text-rose-400 text-xs font-medium animate-fade-in pl-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
