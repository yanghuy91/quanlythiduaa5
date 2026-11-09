import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Bomb, Flame, Sparkles, Play, RotateCcw } from 'lucide-react';
import { Student } from '../../../types';
import { soundEffects } from '../../../utils/soundEffects';

interface TimeBombProps {
  candidates: Student[];
  onSelectWinner: (student: Student) => void;
  onBack: () => void;
}

export const TimeBomb: React.FC<TimeBombProps> = ({
  candidates,
  onSelectWinner,
  onBack,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentCandidate, setCurrentCandidate] = useState<Student | null>(null);
  const [isExploded, setIsExploded] = useState(false);
  const [fusePercent, setFusePercent] = useState(100);
  const timerRef = useRef<number | null>(null);

  const startBomb = () => {
    if (isRunning || candidates.length === 0) return;

    setIsRunning(true);
    setIsExploded(false);
    setFusePercent(100);

    const totalDuration = 4200; // 4.2 seconds
    const startTime = performance.now();
    let tickInterval = 140; // Starts at 140ms, speeds up to 35ms

    const step = () => {
      const now = performance.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / totalDuration, 1);

      // Remaining fuse
      setFusePercent(Math.max(0, 100 - progress * 100));

      // Pick random candidate
      const randomIndex = Math.floor(Math.random() * candidates.length);
      const picked = candidates[randomIndex];
      setCurrentCandidate(picked);

      // Sound tick with rising pitch
      const pitch = 600 + progress * 700;
      soundEffects.tick(pitch);

      if (progress < 1) {
        // Accelerate cycle
        tickInterval = Math.max(35, 140 - progress * 105);
        timerRef.current = window.setTimeout(step, tickInterval);
      } else {
        // BOOM!
        setIsRunning(false);
        setIsExploded(true);
        soundEffects.boom();

        setTimeout(() => {
          onSelectWinner(picked);
        }, 800);
      }
    };

    timerRef.current = window.setTimeout(step, tickInterval);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

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

        <span className="text-xs font-bold text-red-500 px-2.5 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 flex items-center gap-1">
          <Flame className="w-3.5 h-3.5" />
          <span>Chiếc Ghế Nóng &amp; Bom Nổ Chậm</span>
        </span>
      </div>

      {/* Bomb Display Container */}
      <div className={`
        relative w-full p-6 sm:p-8 rounded-3xl border-2 transition-all flex flex-col items-center justify-center min-h-[300px]
        ${isExploded 
          ? 'bg-red-500/20 border-red-500 shadow-2xl scale-105' 
          : isRunning 
            ? 'bg-amber-500/10 border-amber-500/50 shadow-xl animate-pulse' 
            : 'bg-surface border-token shadow-sm'}
      `}>
        {/* Fuse Progress Bar */}
        <div className="w-full max-w-xs h-2.5 bg-surface-2 rounded-full overflow-hidden border border-token mb-6">
          <div 
            className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 transition-all duration-75"
            style={{ width: `${fusePercent}%` }}
          />
        </div>

        {/* Central Graphic */}
        <div className="relative mb-4">
          {isExploded ? (
            <div className="text-6xl sm:text-7xl animate-bounce select-none">
              💥
            </div>
          ) : (
            <div className="relative">
              <div className={`
                w-28 h-28 rounded-full bg-gradient-to-tr from-gray-900 to-gray-700 text-white flex items-center justify-center shadow-2xl border-4 border-gray-600
                ${isRunning ? 'animate-bounce' : ''}
              `}>
                <Bomb className="w-14 h-14 text-red-500" />
              </div>
              {/* Burning Spark */}
              {isRunning && (
                <div className="absolute -top-3 -right-2 text-2xl animate-spin">
                  🔥
                </div>
              )}
            </div>
          )}
        </div>

        {/* Name Display */}
        <div className="min-h-[64px] flex flex-col items-center justify-center">
          {currentCandidate ? (
            <div className="animate-scale-up">
              <h3 className="text-xl sm:text-2xl font-black text-main tracking-tight">
                {currentCandidate.hoTen}
              </h3>
              <p className="text-xs font-bold text-muted mt-0.5">
                Tổ {currentCandidate.to} · Ghế #{currentCandidate.viTriGhe}
              </p>
            </div>
          ) : (
            <div className="text-xs text-muted font-medium">
              Sẵn sàng châm ngòi! Nhấn nút bên dưới để bắt đầu đếm ngược.
            </div>
          )}
        </div>
      </div>

      {/* Control Button */}
      <button
        disabled={isRunning || candidates.length === 0}
        onClick={startBomb}
        className={`
          px-8 py-3.5 rounded-2xl font-black text-base shadow-xl flex items-center gap-2.5 transition-all cursor-pointer mt-2
          ${isRunning 
            ? 'bg-muted text-surface opacity-75 cursor-not-allowed scale-95' 
            : 'bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 text-white hover:opacity-95 hover:scale-105 active:scale-95 ring-4 ring-red-500/20'}
        `}
      >
        <Flame className="w-5 h-5 animate-pulse" />
        <span>{isRunning ? 'ĐANG CHÁY NGÒI NỔ... ⏳' : 'CHÂM NGÒI NỔ 💣'}</span>
      </button>
    </div>
  );
};
