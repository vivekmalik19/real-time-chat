import React from 'react';

/**
 * Reusable FeatureCard component
 */
export default function FeatureCard({
  icon: Icon,
  title,
  description,
  tag,
  iconColor = "text-brand-400",
  iconBg = "bg-brand-500/10 border-brand-500/20",
}) {
  return (
    <div className="group relative rounded-2xl bg-surface-900/60 hover:bg-surface-900 border border-white/[0.06] hover:border-brand-500/30 p-6 sm:p-7 transition-all duration-300 hover:shadow-xl hover:shadow-brand-500/5 hover:-translate-y-1">
      <div className="flex items-center justify-between mb-5">
        <div className={`w-12 h-12 rounded-xl ${iconBg} border flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        {tag && (
          <span className="text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-md bg-white/[0.04] text-slate-400 border border-white/[0.06]">
            {tag}
          </span>
        )}
      </div>
      <h3 className="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-brand-300 transition-colors">
        {title}
      </h3>
      <p className="text-sm text-slate-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
