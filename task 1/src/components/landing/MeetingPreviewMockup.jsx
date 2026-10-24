import React from 'react';
import { Mic, Video, MonitorUp, MessageSquare, Users, PhoneOff, Shield, Radio, Sparkles } from 'lucide-react';

export default function MeetingPreviewMockup() {
  return (
    <div className="relative w-full max-w-lg lg:max-w-none mx-auto">
      {/* Decorative background glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-brand-600 via-indigo-500 to-purple-600 rounded-3xl blur-2xl opacity-30 group-hover:opacity-60 transition duration-1000 -z-10" />

      {/* Main Mockup Container */}
      <div className="relative rounded-2xl bg-surface-900/90 border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Mock Window Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-surface-950/60">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
            <span className="ml-2 text-xs font-mono text-slate-400 font-medium">MeetFlow // MF-A7K29X</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Room
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-800 text-slate-300 border border-slate-700">
              <Shield className="w-2.5 h-2.5 text-brand-400" /> Encrypted
            </span>
          </div>
        </div>

        {/* Video Stage Canvas */}
        <div className="relative aspect-[16/10] bg-gradient-to-b from-surface-950/80 to-surface-900/90 flex flex-col items-center justify-center p-6 overflow-hidden">
          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Central Active Speaker Avatar Representation */}
          <div className="relative flex flex-col items-center">
            {/* Glowing audio activity wave rings */}
            <div className="absolute -inset-4 rounded-full bg-brand-500/15 animate-ping duration-1000 opacity-60"></div>
            <div className="absolute -inset-8 rounded-full bg-indigo-500/10 animate-pulse"></div>

            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-brand-600 to-purple-600 p-[2px] shadow-xl shadow-brand-500/20">
              <div className="w-full h-full rounded-full bg-surface-900 flex items-center justify-center text-white font-bold text-xl sm:text-2xl tracking-wider">
                MF
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 bg-surface-950/80 border border-slate-700/60 px-3 py-1 rounded-full shadow-lg">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-slate-200">Active Speaker Space</span>
              <div className="flex items-center gap-0.5 ml-1">
                <span className="w-0.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></span>
                <span className="w-0.5 h-4 bg-emerald-400 rounded-full animate-pulse delay-75"></span>
                <span className="w-0.5 h-3 bg-emerald-400 rounded-full animate-pulse delay-150"></span>
              </div>
            </div>
          </div>

          {/* Mini Self-Preview PIP box in corner */}
          <div className="absolute bottom-4 right-4 w-28 sm:w-32 aspect-video rounded-xl bg-surface-950/90 border border-brand-500/30 shadow-xl p-2 flex flex-col justify-between overflow-hidden">
            <div className="flex justify-between items-center text-[10px] text-slate-400">
              <span className="font-medium text-brand-300">You (Host)</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
            </div>
            <div className="flex items-center justify-center flex-1">
              <span className="text-xs font-medium text-slate-500">Camera preview</span>
            </div>
          </div>

          {/* Floating feature pill badge */}
          <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-900/90 border border-white/10 shadow-lg text-[11px] text-slate-300 backdrop-blur-md">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>HD WebRTC Canvas</span>
          </div>
        </div>

        {/* Mock Bottom Control Bar */}
        <div className="px-4 py-3 bg-surface-950 border-t border-white/[0.08] flex items-center justify-between">
          <div className="text-xs font-mono text-slate-400 hidden sm:block">
            00:14:32
          </div>

          {/* Centered Controls Mockup */}
          <div className="flex items-center justify-center gap-2 mx-auto sm:mx-0">
            <div className="w-8 h-8 rounded-lg bg-surface-800 text-slate-200 flex items-center justify-center border border-slate-700/60 shadow-sm">
              <Mic className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="w-8 h-8 rounded-lg bg-surface-800 text-slate-200 flex items-center justify-center border border-slate-700/60 shadow-sm">
              <Video className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="w-8 h-8 rounded-lg bg-surface-800 text-slate-200 flex items-center justify-center border border-slate-700/60 shadow-sm">
              <MonitorUp className="w-4 h-4 text-slate-300" />
            </div>
            <div className="relative w-8 h-8 rounded-lg bg-surface-800 text-slate-200 flex items-center justify-center border border-slate-700/60 shadow-sm">
              <MessageSquare className="w-4 h-4 text-slate-300" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-500 rounded-full border border-surface-950"></span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-surface-800 text-slate-200 flex items-center justify-center border border-slate-700/60 shadow-sm">
              <Users className="w-4 h-4 text-slate-300" />
            </div>
            <div className="w-8 h-8 rounded-lg bg-rose-600/90 text-white flex items-center justify-center shadow-sm ml-1">
              <PhoneOff className="w-4 h-4" />
            </div>
          </div>

          <div className="text-xs text-slate-400 hidden sm:flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>24ms latency</span>
          </div>
        </div>
      </div>
    </div>
  );
}
