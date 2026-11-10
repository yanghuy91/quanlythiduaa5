import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Sparkles, Dices, RotateCcw } from 'lucide-react';
import { Student } from '../../../types';
import { soundEffects } from '../../../utils/soundEffects';

interface SlotMachineProps {
  candidates: Student[];
  onSelectWinner: (student: Student) => void;
  onBack: () => void;
}

const MISSIONS = [
  'Giải câu hỏi bài cũ ⭐',
  'Lên bảng chữa bài tập ✏️',
  'Nhận +1 điểm cộng nếu đúng 🎁',
  'Đọc thuộc định lý / thơ 📖',
  'Hỏi đáp nhanh 30 giây ⚡',
  'Trợ lý đắc lực của GVCN 🎯'
];

export const SlotMachine: React.FC<SlotMachineProps> = ({
  candidates,
  onSelectWinner,
  onBack,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [reel1, setReel1] = useState('Tổ 1');
  const [reel2, setReel2] = useState('Chọn học sinh');
  const [reel3, setReel3] = useState('Nhiệm vụ vui');
  const [leverPulled, setLeverPulled] = useState(false);

  const spinSlots = () => {
    if (isSpinning || candidates.length === 0) return;

    setIsSpinning(true);
    setLeverPulled(true);
    soundEffects.lever();

    setTimeout(() => setLeverPulled(false), 400);

    const winner = candidates[Math.floor(Math.random() * candidates.length)];
    const chosenMission = MISSIONS[Math.floor(Math.random() * MISSIONS.length)];
    const chosenTo = `Tổ ${winner.to}`;

    // Roll Reel 1 for 1.2s, Reel 2 for 2.2s, Reel 3 for 3.2s
    const startTime = performance.now();

    const intervalId = window.setInterval(() => {
      const now = performance.now();
      const elapsed = now - startTime;

      soundEffects.tick(1000);

      if (elapsed < 1200) {
        setReel1(`Tổ ${Math.floor(Math.random() * 4) + 1}`);
      } else {
        setReel1(chosenTo);
      }

      if (elapsed < 2400) {
        const tempStudent = candidates[Math.floor(Math.random() * candidates.length)];
        setReel2(tempStudent.tenRutGon);
      } else {
        setReel2(winner.tenRutGon);
      }

      if (elapsed < 3400) {
        setReel3(MISSIONS[Math.floor(Math.random() * MISSIONS.length)]);
      } else {
        setReel3(chosenMission);
      }

      if (elapsed >= 3500) {
        clearInterval(intervalId);
        setIsSpinning(false);
        soundEffects.coin();
        setTimeout(() => {
          onSelectWinner(winner);
        }, 600);
      }
    }, 90);
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

        <span className="text-xs font-bold text-amber-500 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Máy Xèng Tri Thức 777</span>
        </span>
      </div>

      {/* Arcade Slot Machine Cabinet */}
      <div className="relative w-full p-4 sm:p-6 rounded-3xl bg-gradient-to-b from-amber-600 via-amber-700 to-amber-900 border-4 border-amber-400 shadow-2xl flex items-center justify-center">
        {/* Lights bar on top */}
        <div className="absolute top-2 inset-x-6 flex items-center justify-between px-4">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-300 animate-ping" />
          <span className="text-[11px] font-black text-yellow-300 uppercase tracking-widest">
            ★ 10A5 LUCKY SLOTS ★
          </span>
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-300 animate-ping" />
        </div>

        {/* 3 Reels Grid */}
        <div className="grid grid-cols-3 gap-2 w-full mt-4 bg-amber-950/90 p-3 rounded-2xl border-2 border-amber-300 shadow-inner">
          {/* Reel 1: Tổ */}
          <div className="h-28 rounded-xl bg-gradient-to-b from-amber-50 via-white to-amber-50 border-2 border-amber-300 flex flex-col items-center justify-center p-2 overflow-hidden shadow-md">
            <span className="text-[9px] uppercase font-extrabold text-slate-600 mb-1">Dãy / Tổ</span>
            <div className={`text-base sm:text-lg font-black text-blue-700 truncate ${isSpinning ? 'blur-[0.5px] animate-pulse' : ''}`}>
              {reel1}
            </div>
          </div>

          {/* Reel 2: Tên Học Sinh */}
          <div className="h-28 rounded-xl bg-gradient-to-b from-amber-50 via-white to-amber-50 border-2 border-amber-500 flex flex-col items-center justify-center p-2 overflow-hidden shadow-lg">
            <span className="text-[9px] uppercase font-extrabold text-amber-700 mb-1">Gương mặt</span>
            <div className={`text-base sm:text-lg font-black text-amber-600 truncate ${isSpinning ? 'blur-[0.5px] animate-pulse' : ''}`}>
              {reel2}
            </div>
          </div>

          {/* Reel 3: Nhiệm vụ */}
          <div className="h-28 rounded-xl bg-gradient-to-b from-amber-50 via-white to-amber-50 border-2 border-amber-300 flex flex-col items-center justify-center p-2 overflow-hidden shadow-md">
            <span className="text-[9px] uppercase font-extrabold text-slate-600 mb-1">Thử thách</span>
            <div className={`text-xs sm:text-xs font-extrabold text-slate-900 line-clamp-2 ${isSpinning ? 'blur-[0.5px] animate-pulse' : ''}`}>
              {reel3}
            </div>
          </div>
        </div>

        {/* Mechanical Lever Arm on Right (Visible on sm+) */}
        <div 
          onClick={spinSlots}
          className={`absolute -right-4 top-1/2 -translate-y-1/2 cursor-pointer transition-transform duration-200 hidden sm:block ${leverPulled ? 'translate-y-4' : ''}`}
          title="Kéo cần gạt"
        >
          <div className="w-3 h-20 bg-gray-400 border border-gray-600 rounded-full flex flex-col justify-start items-center">
            <div className="w-7 h-7 rounded-full bg-red-600 border-2 border-white shadow-lg -mt-3.5 hover:scale-110 transition-transform" />
          </div>
        </div>
      </div>

      {/* Button to Spin */}
      <button
        disabled={isSpinning || candidates.length === 0}
        onClick={spinSlots}
        className={`
          px-8 py-3.5 rounded-2xl font-black text-base shadow-xl flex items-center gap-2.5 transition-all cursor-pointer mt-1
          ${isSpinning 
            ? 'bg-muted text-surface opacity-75 cursor-not-allowed scale-95' 
            : 'bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 text-black font-extrabold hover:opacity-95 hover:scale-105 active:scale-95 ring-4 ring-yellow-500/20'}
        `}
      >
        <Dices className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
        <span>{isSpinning ? 'ĐANG QUAY CUỘN...' : 'GIẬT CẦN GẠT 🎰'}</span>
      </button>
    </div>
  );
};
