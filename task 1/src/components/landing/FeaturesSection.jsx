import React from 'react';
import { Video, MonitorUp, MessageSquareText, ShieldCheck, Zap, Globe, Sparkles } from 'lucide-react';
import FeatureCard from '../common/FeatureCard';

export default function FeaturesSection() {
  const features = [
    {
      icon: Video,
      title: "HD Video & Crystal Audio",
      description: "Adaptive resolution and intelligent noise dampening provide an intimate, crystal-clear conferencing experience regardless of bandwidth.",
      tag: "Adaptive Bitrate",
      iconColor: "text-indigo-400",
      iconBg: "bg-indigo-500/10 border-indigo-500/20",
    },
    {
      icon: MonitorUp,
      title: "One-Click Screen Sharing",
      description: "Present full desktops, specific application windows, or browser tabs with zero perceptible delay and high frame rates.",
      tag: "60 FPS Ready",
      iconColor: "text-brand-400",
      iconBg: "bg-brand-500/10 border-brand-500/20",
    },
    {
      icon: MessageSquareText,
      title: "In-Call Real-Time Chat",
      description: "Send live comments, links, code snippets, and questions directly within the call without interrupting the speaker.",
      tag: "Instant Sync",
      iconColor: "text-purple-400",
      iconBg: "bg-purple-500/10 border-purple-500/20",
    },
    {
      icon: ShieldCheck,
      title: "Enterprise Secure Meetings",
      description: "End-to-end encrypted rooms, non-reusable tokens, and zero tracking ensure your private calls stay strictly confidential.",
      tag: "DTLS / SRTP",
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-500/10 border-emerald-500/20",
    },
  ];

  return (
    <section id="features" className="py-20 sm:py-28 relative">
      {/* Decorative gradient glow in background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-brand-600/10 blur-[130px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Built for Modern Remote Work</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-4">
            Everything you need for seamless meetings
          </h2>
          <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
            Lightweight, instant, and frictionless. MeetFlow eliminates complicated downloads and bloated interfaces in favor of pure performance.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              tag={feature.tag}
              iconColor={feature.iconColor}
              iconBg={feature.iconBg}
            />
          ))}
        </div>

        {/* Highlights banner below cards */}
        <div id="about" className="mt-14 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-surface-900 via-surface-850 to-surface-900 border border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6 text-brand-400" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Browser-First Zero Installation</h4>
              <p className="text-sm text-slate-400">Join instantly from Chrome, Firefox, Safari, or Edge without downloading any desktop software.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 bg-surface-800/80 px-4 py-2 rounded-xl border border-slate-700/60">
              <Globe className="w-4 h-4 text-brand-400" />
              <span>Global Low Latency</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
