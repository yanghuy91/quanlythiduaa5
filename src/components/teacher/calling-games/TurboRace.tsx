import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Flag, Play, Sparkles, Zap } from 'lucide-react';
import { Student } from '../../../types';
import { soundEffects } from '../../../utils/soundEffects';

interface TurboRaceProps {
  candidates: Student[];
  onSelectWinner: (student: Student) => void;
  onBack: () => void;
}

interface Racer {
  id: number;
  student: Student;
  color: string;
  name: string;
  progress: number;
}

const RACER_COLORS = [
  { bg: 'from-red-500 to-rose-600', car: '🏎️', border: 'border-red-500' },
  { bg: 'from-blue-500 to-indigo-600', car: '🏎️', border: 'border-blue-500' },
  { bg: 'from-emerald-500 to-teal-600', car: '🏎️', border: 'border-emerald-500' },
  { bg: 'from-amber-500 to-orange-600', car: '🏎️', border: 'border-amber-500' },
];

export const TurboRace: React.FC<TurboRaceProps> = ({
  candidates,
  onSelectWinner,
  onBack,
}) => {
  const [isRacing, setIsRacing] = useState(false);
  const [racers, setRacers] = useState<Racer[]>([]);
  const [winnerRacer, setWinnerRacer] = useState<Racer | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Initialize 4 racers from candidates
  useEffect(() => {
    const shuffled = [...candidates].sort(() => 0.5 - Math.random());
    const initRacers: Racer[] = [];
    for (let i = 0; i < 4; i++) {
      const student = shuffled[i % shuffled.length];
      initRacers.push({
        id: i + 1,
        student,
        color: RACER_COLORS[i].bg,
        name: student ? student.tenRutGon : `Tay đua ${i + 1}`,
        progress: 0,
      });
    }
    setRacers(initRacers);
  }, [candidates]);

  const startRace = () => {
    if (isRacing || racers.length === 0) return;

    setIsRacing(true);
    setWinnerRacer(null);
    soundEffects.whoosh();

    // Reset progress
    setRacers(prev => prev.map(r => ({ ...r, progress: 0 })));

    let currentProgress = [0, 0, 0, 0];
    const target = 100;

    const raceInterval = setInterval(() => {
      let someoneWon = false;
      let winningIndex = -1;

      currentProgress = currentProgress.map((p, idx) => {
        if (p >= target) return p;
        // Random speed boost
        const boost = Math.random() * 4 + 1.2;
        const next = Math.min(target, p + boost);
        if (next >= target && !someoneWon) {
          someoneWon = true;
          winningIndex = idx;
        }
        return next;
      });

      setRacers(prev => prev.map((r, i) => ({ ...r, progress: currentProgress[i] })));

      if (someoneWon) {
        clearInterval(raceInterval);
        setIsRacing(false);
        const champion = racers[winningIndex];
        setWinnerRacer(champion);
        soundEffects.fanfare();
        setTimeout(() => {
          onSelectWinner(champion.student);
        }, 800);
      }
    }, 70);
  };

  return (
    <div className="flex flex-col items-center gap-4 py-2 animate-fade-in w-full max-w-xl mx-auto text-center">
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-token text-xs font-semibold text-muted hover:text-main cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Chọn trò khác</span>
        </button>

        <span className="text-xs font-bold text-rose-500 px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center gap-1">
          <Zap className="w-3.5 h-3.5" />
          <span>Đua Xe F1 Lớp 10A5</span>
        </span>
      </div>

      <p className="text-xs text-muted -mt-1">
        4 tay đua đại diện đang vào vị trí xuất phát! Tay đua cán đích đầu tiên sẽ lên bảng!
      </p>

      {/* Racetrack */}
      <div className="w-full p-3 sm:p-4 rounded-3xl bg-gray-900 border-2 border-token shadow-2xl flex flex-col gap-2 relative overflow-hidden">
        {/* Track Lines */}
        {racers.map((racer, idx) => {
          return (
            <div
              key={racer.id}
              className="relative h-14 sm:h-16 rounded-2xl bg-gray-800/80 border border-gray-700/80 p-2 flex items-center overflow-hidden"
            >
              {/* Lane Number & Student Name */}
              <div className="w-24 sm:w-28 text-left z-10 shrink-0">
                <span className="text-[10px] font-bold text-gray-400 block">
                  Làn #{racer.id} · T{racer.student?.to}
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-white truncate block">
                  {racer.student?.tenRutGon}
                </span>
              </div>

              {/* Race Track Area */}
              <div className="flex-1 relative h-full flex items-center pr-8">
                {/* Dashed Center Road Line */}
                <div className="absolute inset-x-0 h-0.5 border-b border-dashed border-gray-600/50" />

                {/* Car Moving Element */}
                <div 
                  className="absolute transition-all duration-75 flex items-center gap-1"
                  style={{ left: `calc(${racer.progress}% * 0.82)` }}
                >
                  <span className="text-2xl sm:text-3xl select-none filter drop-shadow">
                    🏎️
                  </span>
                  {isRacing && (
                    <span className="text-xs animate-pulse select-none">
                      💨
                    </span>
                  )}
                </div>

                {/* Finish Line Flag */}
                <div className="absolute right-0 top-0 bottom-0 w-6 flex items-center justify-center border-l-2 border-dashed border-white bg-checkered opacity-80">
                  <Flag className="w-4 h-4 text-white animate-bounce" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <button
        disabled={isRacing || candidates.length === 0}
        onClick={startRace}
        className={`
          px-8 py-3.5 rounded-2xl font-black text-base shadow-xl flex items-center gap-2.5 transition-all cursor-pointer mt-1
          ${isRacing 
            ? 'bg-muted text-surface opacity-75 cursor-not-allowed scale-95' 
            : 'bg-gradient-to-r from-red-600 via-orange-600 to-yellow-500 text-white font-extrabold hover:opacity-95 hover:scale-105 active:scale-95 ring-4 ring-red-500/20'}
        `}
      >
        <Play className={`w-5 h-5 ${isRacing ? 'animate-spin' : ''}`} />
        <span>{isRacing ? 'CUỘC ĐUA ĐANG NGHẸT THỞ... 🏁' : 'XUẤT PHÁT F1 🏎️'}</span>
      </button>
    </div>
  );
};
