import React, { useState } from 'react';
import { ArrowLeft, Sparkles, Play } from 'lucide-react';
import { Student } from '../../../types';
import { soundEffects } from '../../../utils/soundEffects';

interface ClawMachineProps {
  candidates: Student[];
  onSelectWinner: (student: Student) => void;
  onBack: () => void;
}

export const ClawMachine: React.FC<ClawMachineProps> = ({
  candidates,
  onSelectWinner,
  onBack,
}) => {
  const [isClawing, setIsClawing] = useState(false);
  const [clawState, setClawState] = useState<'idle' | 'dropping' | 'grabbing' | 'lifting'>('idle');

  const startClaw = () => {
    if (isClawing || candidates.length === 0) return;

    setIsClawing(true);
    setClawState('dropping');
    soundEffects.lever();

    setTimeout(() => {
      setClawState('grabbing');
      soundEffects.tick(700);

      setTimeout(() => {
        setClawState('lifting');
        soundEffects.coin();

        setTimeout(() => {
          setIsClawing(false);
          setClawState('idle');
          const winner = candidates[Math.floor(Math.random() * candidates.length)];
          soundEffects.fanfare();
          onSelectWinner(winner);
        }, 1200);
      }, 700);
    }, 1000);
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

        <span className="text-xs font-bold text-pink-500 px-2.5 py-0.5 rounded-full bg-pink-500/15 border border-pink-500/30 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Máy Gắp Thú Arcade</span>
        </span>
      </div>

      {/* Arcade Claw Machine Cabinet */}
      <div className="relative w-full p-4 sm:p-6 rounded-3xl bg-gradient-to-b from-pink-500 via-rose-600 to-purple-800 border-4 border-pink-300 shadow-2xl flex flex-col items-center">
        {/* Cabinet Marquee */}
        <div className="px-4 py-1 rounded-full bg-white/20 border border-white/40 text-white font-black text-xs uppercase tracking-widest mb-3">
          ★ 10A5 LUCKY CLAW ★
        </div>

        {/* Glass Box */}
        <div className="relative w-full h-56 rounded-2xl bg-gradient-to-b from-sky-900/60 via-purple-900/60 to-slate-900/80 border-2 border-white/30 p-3 shadow-inner flex flex-col justify-between overflow-hidden">
          {/* Top Rail & Claw */}
          <div className="relative w-full h-2 bg-gray-400 rounded-full">
            <div 
              className={`
                absolute -top-1 transition-all duration-700 flex flex-col items-center
                ${clawState === 'dropping' || clawState === 'grabbing' ? 'top-20' : 'top-0'}
              `}
              style={{ left: '50%', transform: 'translateX(-50%)' }}
            >
              <div className="w-1 h-14 bg-gray-300" />
              <div className="text-3xl select-none filter drop-shadow">
                {clawState === 'grabbing' || clawState === 'lifting' ? '✊' : '🖐️'}
              </div>
            </div>
          </div>

          {/* Bottom Plushie/Capsule Pit */}
          <div className="flex items-center justify-center gap-2 overflow-hidden py-1">
            {['🧸', '🦊', '🐯', '🐼', '🐰', '🦁', '⭐', '🎁'].map((emoji, idx) => (
              <span 
                key={idx} 
                className="text-2xl sm:text-3xl select-none animate-pulse"
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                {emoji}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <button
        disabled={isClawing || candidates.length === 0}
        onClick={startClaw}
        className={`
          px-8 py-3.5 rounded-2xl font-black text-base shadow-xl flex items-center gap-2.5 transition-all cursor-pointer mt-1
          ${isClawing 
            ? 'bg-muted text-surface opacity-75 cursor-not-allowed scale-95' 
            : 'bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white font-extrabold hover:opacity-95 hover:scale-105 active:scale-95 ring-4 ring-pink-500/20'}
        `}
      >
        <Play className={`w-5 h-5 ${isClawing ? 'animate-spin' : ''}`} />
        <span>{isClawing ? 'ĐANG GẮP PHẦN THƯỞNG... 🕹️' : 'HẠ CÀNG GẮP THÚ 🕹️'}</span>
      </button>
    </div>
  );
};
