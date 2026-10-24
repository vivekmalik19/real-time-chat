import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, LogIn, ArrowRight, Shield, Zap, Sparkles } from 'lucide-react';
import Button from '../common/Button';
import RoomInput from '../common/RoomInput';
import MeetingPreviewMockup from './MeetingPreviewMockup';
import { generateRoomId, validateRoomId } from '../../utils/roomId';

export default function HeroSection() {
  const navigate = useNavigate();
  const [inputRoomId, setInputRoomId] = useState('');
  const [inputError, setInputError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Flow 1: Create Meeting
  const handleCreateMeeting = () => {
    setIsGenerating(true);
    const newRoomId = generateRoomId();
    // Smooth transition
    setTimeout(() => {
      navigate(`/room/${newRoomId}`);
    }, 150);
  };

  // Flow 2: Join Meeting
  const handleJoinMeeting = (e) => {
    if (e) e.preventDefault();
    const validation = validateRoomId(inputRoomId);
    if (!validation.isValid) {
      setInputError(validation.error || 'Please enter a valid Meeting ID');
      return;
    }

    setInputError('');
    navigate(`/room/${validation.sanitizedId}`);
  };

  return (
    <section id="hero" className="relative pt-8 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-32 overflow-hidden">
      {/* Dynamic ambient background glow */}
      <div className="absolute top-10 left-1/4 w-[450px] h-[450px] bg-brand-600/15 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Heading & Flows */}
          <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left">
            
            {/* Status chip */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/25 text-brand-300 text-xs font-semibold mb-6 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
              </span>
              <span>Next-Gen Real-Time Video Platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] mb-6">
              Connect.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-indigo-300 to-purple-400">
                Collaborate.
              </span>{' '}
              Anywhere.
            </h1>

            {/* Supporting Text */}
            <p className="text-base sm:text-lg text-slate-300 mb-8 max-w-xl leading-relaxed">
              Create instant, high-definition video meetings with zero friction. Free browser-based rooms with crisp audio, instant screen sharing, and end-to-end security.
            </p>

            {/* Actions Card: Create + Join */}
            <div className="w-full max-w-md bg-surface-900/80 border border-white/[0.08] p-5 sm:p-6 rounded-2xl shadow-xl backdrop-blur-md space-y-5">
              
              {/* Primary Action: Create Meeting */}
              <div>
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  iconLeft={Video}
                  iconRight={ArrowRight}
                  onClick={handleCreateMeeting}
                  disabled={isGenerating}
                  className="group relative overflow-hidden"
                >
                  <span className="relative z-10">
                    {isGenerating ? 'Creating Room...' : 'Create Meeting'}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-500 via-indigo-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-0"></div>
                </Button>
                <div className="flex items-center justify-center gap-1.5 mt-2 text-[11px] text-slate-400">
                  <Sparkles className="w-3 h-3 text-brand-400" />
                  <span>Generates an instant unique room ID (e.g. MF-A7K29X)</span>
                </div>
              </div>

              {/* Divider with "OR JOIN EXISTING" */}
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800"></div>
                </div>
                <div className="relative bg-surface-900 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Or Join Existing
                </div>
              </div>

              {/* Secondary Action: Join Meeting Form */}
              <form onSubmit={handleJoinMeeting} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <RoomInput
                    value={inputRoomId}
                    onChange={(e) => {
                      setInputRoomId(e.target.value);
                      if (inputError) setInputError('');
                    }}
                    onClear={() => {
                      setInputRoomId('');
                      setInputError('');
                    }}
                    error={inputError}
                    placeholder="Enter Room ID (e.g. MF-A7K29X)"
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    variant="secondary"
                    iconLeft={LogIn}
                    className="sm:w-auto shrink-0 py-3"
                  >
                    Join Meeting
                  </Button>
                </div>
              </form>
            </div>

            {/* Trust Badges */}
            <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-5 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-brand-400" />
                <span>Zero signup required to test</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>Instant sub-second room creation</span>
              </div>
            </div>

          </div>

          {/* Right Column: Visual Mockup */}
          <div className="lg:col-span-6 flex justify-center">
            <MeetingPreviewMockup />
          </div>

        </div>
      </div>
    </section>
  );
}
