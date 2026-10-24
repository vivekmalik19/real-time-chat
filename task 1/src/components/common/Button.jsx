import React from 'react';

/**
 * Reusable multi-variant Button component
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  iconLeft: IconLeft,
  iconRight: IconRight,
  className = '',
  onClick,
  type = 'button',
  title,
  ...props
}) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-950 active:scale-[0.98] select-none';

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 min-h-[34px]',
    md: 'text-sm px-4 py-2.5 gap-2 min-h-[42px]',
    lg: 'text-base px-6 py-3.5 gap-2.5 min-h-[50px] font-semibold',
    icon: 'p-2.5 w-11 h-11 justify-center',
    iconSm: 'p-1.5 w-8 h-8 justify-center rounded-lg',
  };

  const variantClasses = {
    primary: 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/25 border border-brand-500/30 focus:ring-brand-500',
    secondary: 'bg-surface-800 hover:bg-surface-850 text-slate-100 border border-slate-700/60 hover:border-slate-600 focus:ring-slate-500',
    outline: 'bg-transparent hover:bg-surface-800/60 text-slate-200 border border-slate-700/80 hover:border-slate-500 focus:ring-brand-500',
    ghost: 'bg-transparent hover:bg-surface-800/60 text-slate-300 hover:text-white border-transparent focus:ring-slate-600',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/25 border border-rose-500/30 focus:ring-rose-500',
    dangerGhost: 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 focus:ring-rose-500',
    accent: 'bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/30 border border-indigo-400/30 focus:ring-indigo-500',
  };

  const disabledClasses = disabled
    ? 'opacity-45 cursor-not-allowed pointer-events-none filter grayscale-[30%]'
    : 'cursor-pointer';

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      title={title}
      className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${variantClasses[variant] || variantClasses.primary} ${disabledClasses} ${widthClass} ${className}`}
      {...props}
    >
      {IconLeft && <IconLeft className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />}
      {children}
      {IconRight && <IconRight className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />}
    </button>
  );
}
