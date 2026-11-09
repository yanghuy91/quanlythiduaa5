import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Disc, Music, Play, Sparkles, Volume2 } from 'lucide-react';
import { Student } from '../../../types';
import { soundEffects } from '../../../utils/soundEffects';

interface VinylDJProps {
  candidates: Student[];
  onSelectWinner: (student: Student) => void;
  onBack: () => void;
}

export const VinylDJ: React.FC<VinylDJProps> = ({
  candidates,
  onSelectWinner,
  onBack,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentDJStudent, setCurrentDJStudent] = useState<Student | null>(null);
  const beatTimerRef = useRef<number | null>(null);

  const startMusic = () => {
    if (isPlaying || candidates.length === 0) return;

    setIsPlaying(true);
    let beatCount = 0;

    const playBeat = () => {
      beatCount++;
      const randStudent = candidates[Math.floor(Math.random() * candidates.length)];
      setCurrentDJStudent(randStudent);

      // Rhythm tick (bass/snare alternating)
      soundEffects.tick(beatCount % 2 === 0 ? 300 : 650);

      beatTimerRef.current = window.setTimeout(playBeat, 180);
    };

    playBeat();
  };

  const stopMusicAndPick = () => {
    if (!isPlaying) return;

    if (beatTimerRef.current) clearTimeout(beatTimerRef.current);
    setIsPlaying(false);
    soundEffects.scratch();

    const winner = candidates[Math.floor(Math.random() * candidates.length)];
    setCurrentDJStudent(winner);

    setTimeout(() => {
      soundEffects.fanfare();
      onSelectWinner(winner);
    }, 900);
  };

  useEffect(() => {
    return () => {
      if (beatTimerRef.current) clearTimeout(beatTimerRef.current);
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

        <span className="text-xs font-bold text-violet-500 px-2.5 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/30 flex items-center gap-1">
          <Music className="w-3.5 h-3.5" />
          <span>DJ Đĩa Than &amp; Dừng Nhạc</span>
        </span>
      </div>

      <p className="text-xs text-muted -mt-1">
        Bật nhạc sàn sôi động, khi thầy/cô bấm &quot;Dừng đĩa&quot; sẽ khóa mục tiêu vào bạn may mắn!
      </p>

      {/* Vinyl Turntable Display */}
      <div className="relative w-full p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-gray-950 via-slate-900 to-purple-950 border-2 border-violet-500/40 shadow-2xl flex flex-col items-center justify-center min-h-[300px]">
        {/* Equalizer Bars on top */}
        <div className="flex items-end gap-1.5 h-8 mb-4">
          {[24, 16, 32, 20, 28, 12, 30, 18, 26].map((h, i) => (
            <div
              key={i}
              className={`w-1.5 bg-violet-400 rounded-full transition-all duration-150 ${isPlaying ? 'animate-bounce' : 'opacity-40'}`}
              style={{
                height: isPlaying ? `${Math.floor(Math.random() * 24) + 8}px` : `${h}px`,
                animationDelay: `${i * 80}ms`
              }}
            />
          ))}
        </div>

        {/* Spinning Vinyl Record */}
        <div className="relative">
          <div className={`
            w-40 h-40 sm:w-44 sm:h-44 rounded-full bg-gradient-to-tr from-gray-950 via-black to-gray-800 border-4 border-gray-700 shadow-2xl flex items-center justify-center select-none
            ${isPlaying ? 'animate-spin' : ''}
          `} style={{ animationDuration: '3s' }}>
            {/* Vinyl Grooves */}
            <div className="w-32 h-32 rounded-full border border-gray-700/60 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full border border-gray-700/80 flex items-center justify-center">
                {/* Center Label */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-600 border-2 border-white flex flex-col items-center justify-center text-white shadow-md">
                  <Disc className="w-5 h-5" />
                  <span className="text-[9px] font-black mt-0.5">10A5 DJ</span>
                </div>
              </div>
            </div>
          </div>

          {/* Needle Arm */}
          <div className={`
            absolute top-0 -right-2 w-1.5 h-20 bg-gray-300 rounded-full origin-top transition-transform duration-300
            ${isPlaying ? 'rotate-12' : '-rotate-12'}
          `}>
            <div className="w-3 h-4 bg-red-500 rounded-sm -bottom-1 -left-1 absolute" />
          </div>
        </div>

        {/* Current Name Target */}
        <div className="mt-4 min-h-[36px]">
          {currentDJStudent ? (
            <span className="text-lg font-black text-violet-300 tracking-tight">
              {currentDJStudent.hoTen} · Tổ {currentDJStudent.to}
            </span>
          ) : (
            <span className="text-xs text-muted">
              Nhấn Bật Nhạc DJ để xoay đĩa than
            </span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 mt-1">
        {!isPlaying ? (
          <button
            onClick={startMusic}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white font-black text-base shadow-xl hover:opacity-95 hover:scale-105 active:scale-95 cursor-pointer ring-4 ring-violet-500/20 flex items-center gap-2"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>BẬT NHẠC DJ 🎧</span>
          </button>
        ) : (
          <button
            onClick={stopMusicAndPick}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-black text-base shadow-xl hover:opacity-95 hover:scale-105 active:scale-95 cursor-pointer ring-4 ring-red-500/20 flex items-center gap-2 animate-pulse"
          >
            <span>DỪNG ĐĨA / CHỐT TÊN ✋</span>
          </button>
        )}
      </div>
    </div>
  );
};
