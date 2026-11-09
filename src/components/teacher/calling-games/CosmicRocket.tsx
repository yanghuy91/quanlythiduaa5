import React, { useState, useEffect } from 'react';
import { ArrowLeft, Rocket, Sparkles, Orbit } from 'lucide-react';
import { Student } from '../../../types';
import { soundEffects } from '../../../utils/soundEffects';

interface CosmicRocketProps {
  candidates: Student[];
  onSelectWinner: (student: Student) => void;
  onBack: () => void;
}

export const CosmicRocket: React.FC<CosmicRocketProps> = ({
  candidates,
  onSelectWinner,
  onBack,
}) => {
  const [isLaunching, setIsLaunching] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [candidateName, setCandidateName] = useState('Trạm Vũ trụ 10A5');

  const startLaunch = () => {
    if (isLaunching || candidates.length === 0) return;

    setIsLaunching(true);
    setCountdown(3);
    soundEffects.tick(500);

    // Countdown 3, 2, 1, 0
    let count = 3;
    const countTimer = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
        soundEffects.tick(600 + (3 - count) * 200);
      } else {
        clearInterval(countTimer);
        setCountdown(0);
        soundEffects.whoosh();

        // Cycling candidate names during orbit
        const cycleStart = performance.now();
        const cycleTimer = setInterval(() => {
          const randomStudent = candidates[Math.floor(Math.random() * candidates.length)];
          setCandidateName(randomStudent.hoTen);
          soundEffects.laser();

          if (performance.now() - cycleStart > 2500) {
            clearInterval(cycleTimer);
            setIsLaunching(false);
            setCountdown(null);
            const winner = candidates[Math.floor(Math.random() * candidates.length)];
            setCandidateName(winner.hoTen);
            soundEffects.fanfare();
            setTimeout(() => {
              onSelectWinner(winner);
            }, 800);
          }
        }, 90);
      }
    }, 800);
  };

  return (
    <div className="flex flex-col items-center gap-4 py-2 animate-fade-in w-full max-w-lg mx-auto text-center">
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-token text-xs font-semibold text-muted hover:text-main cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Chọn trò khác</span>
        </button>

        <span className="text-xs font-bold text-cyan-500 px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center gap-1">
          <Orbit className="w-3.5 h-3.5" />
          <span>Phi Thuyền Vũ Trụ</span>
        </span>
      </div>

      {/* Space Viewport */}
      <div className="relative w-full p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-gray-950 via-slate-900 to-indigo-950 border-2 border-indigo-500/40 shadow-2xl flex flex-col items-center justify-center min-h-[300px] overflow-hidden">
        {/* Animated Stars */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none" />

        {/* Orbit Grid Rings */}
        <div className="absolute w-64 h-64 rounded-full border border-cyan-500/20 animate-spin" style={{ animationDuration: '20s' }} />
        <div className="absolute w-44 h-44 rounded-full border border-dashed border-indigo-400/30 animate-spin" style={{ animationDuration: '10s' }} />

        {/* Central Graphic */}
        <div className="relative z-10 flex flex-col items-center mb-3">
          {countdown !== null && countdown > 0 ? (
            <div className="text-7xl font-black text-cyan-400 animate-ping">
              {countdown}
            </div>
          ) : (
            <div className={`
              w-24 h-24 rounded-3xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white flex items-center justify-center shadow-2xl border-2 border-cyan-300
              ${isLaunching ? 'animate-bounce' : ''}
            `}>
              <Rocket className="w-12 h-12 text-white" />
            </div>
          )}
        </div>

        {/* Name Radar Target */}
        <div className="z-10 mt-2">
          <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-widest block mb-1">
            {isLaunching ? '🛰️ Đang quét toạ độ thiên hà...' : 'Toạ độ chỉ định'}
          </span>
          <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {candidateName}
          </div>
        </div>
      </div>

      {/* Controls */}
      <button
        disabled={isLaunching || candidates.length === 0}
        onClick={startLaunch}
        className={`
          px-8 py-3.5 rounded-2xl font-black text-base shadow-xl flex items-center gap-2.5 transition-all cursor-pointer mt-1
          ${isLaunching 
            ? 'bg-muted text-surface opacity-75 cursor-not-allowed scale-95' 
            : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-extrabold hover:opacity-95 hover:scale-105 active:scale-95 ring-4 ring-cyan-500/20'}
        `}
      >
        <Rocket className={`w-5 h-5 ${isLaunching ? 'animate-bounce' : ''}`} />
        <span>{isLaunching ? 'ĐANG PHÓNG VŨ TRỤ... 🚀' : 'PHÓNG TÊN LỬA 🚀'}</span>
      </button>
    </div>
  );
};
