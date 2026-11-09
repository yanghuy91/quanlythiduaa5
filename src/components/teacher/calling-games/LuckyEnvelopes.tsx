import React, { useState } from 'react';
import { ArrowLeft, Sparkles, Gift } from 'lucide-react';
import { Student } from '../../../types';
import { soundEffects } from '../../../utils/soundEffects';

interface LuckyEnvelopesProps {
  candidates: Student[];
  onSelectWinner: (student: Student) => void;
  onBack: () => void;
}

export const LuckyEnvelopes: React.FC<LuckyEnvelopesProps> = ({
  candidates,
  onSelectWinner,
  onBack,
}) => {
  const [openedIndex, setOpenedIndex] = useState<number | null>(null);

  const handleOpenEnvelope = (index: number) => {
    if (openedIndex !== null || candidates.length === 0) return;

    setOpenedIndex(index);
    soundEffects.coin();

    const winner = candidates[Math.floor(Math.random() * candidates.length)];
    setTimeout(() => {
      onSelectWinner(winner);
    }, 1000);
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

        <span className="text-xs font-bold text-red-500 px-2.5 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 flex items-center gap-1">
          <Gift className="w-3.5 h-3.5" />
          <span>Bốc Thăm Bao Lì Xì Đỏ</span>
        </span>
      </div>

      <p className="text-xs text-muted -mt-1">
        Chọn 1 bao lì xì may mắn để nhận thông điệp và gương mặt vàng lên bảng!
      </p>

      {/* Grid of 8 Hanging Envelopes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 w-full">
        {Array.from({ length: 8 }).map((_, i) => {
          const isOpened = openedIndex === i;
          const isOther = openedIndex !== null && !isOpened;

          return (
            <div
              key={i}
              onClick={() => handleOpenEnvelope(i)}
              className={`
                relative aspect-[3/4] rounded-2xl bg-gradient-to-b from-red-600 via-rose-600 to-red-800 border-2 border-amber-400 p-3 shadow-lg flex flex-col items-center justify-between cursor-pointer transition-all duration-300 select-none
                ${isOpened ? 'scale-110 ring-4 ring-amber-400 shadow-2xl z-10' : ''}
                ${isOther ? 'opacity-30 scale-95' : 'hover:-translate-y-1 hover:shadow-xl active:scale-95'}
              `}
            >
              {/* Envelope Flap Accent */}
              <div className="w-full h-8 bg-red-700 rounded-b-2xl border-b border-amber-400/60 flex items-center justify-center shadow-inner">
                <div className="w-6 h-6 rounded-full bg-amber-400 text-red-700 font-bold text-xs flex items-center justify-center shadow-xs">
                  福
                </div>
              </div>

              {/* Center Gold Seal */}
              <div className="flex flex-col items-center">
                <span className="text-2xl animate-pulse">🧧</span>
                <span className="text-xs font-black text-amber-300 tracking-wider mt-1">
                  LÌ XÌ #{i + 1}
                </span>
                <span className="text-[10px] text-amber-200/80 font-medium">
                  10A5 Đức Phổ
                </span>
              </div>

              {/* Gold tassel footer */}
              <div className="w-2 h-4 bg-amber-400 rounded-b-full shadow-xs" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
