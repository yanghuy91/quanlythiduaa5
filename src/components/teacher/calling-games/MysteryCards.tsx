import React, { useState } from 'react';
import { ArrowLeft, Sparkles, Gift, RotateCcw } from 'lucide-react';
import { Student } from '../../../types';
import { soundEffects } from '../../../utils/soundEffects';
import { getStudentAvatarInitial } from '../../../utils/vietnamese';

interface MysteryCardsProps {
  candidates: Student[];
  onSelectWinner: (student: Student) => void;
  onBack: () => void;
}

export const MysteryCards: React.FC<MysteryCardsProps> = ({
  candidates,
  onSelectWinner,
  onBack,
}) => {
  const [flippedIndex, setFlippedIndex] = useState<number | null>(null);
  const [cardStudents, setCardStudents] = useState<Student[]>(() => {
    // Pick 12 random students from candidates (with replacement if needed)
    const shuffled = [...candidates].sort(() => 0.5 - Math.random());
    const result: Student[] = [];
    for (let i = 0; i < 12; i++) {
      result.push(shuffled[i % shuffled.length]);
    }
    return result;
  });

  const handleCardClick = (index: number) => {
    if (flippedIndex !== null || candidates.length === 0) return;

    setFlippedIndex(index);
    soundEffects.coin();

    const winner = cardStudents[index];
    setTimeout(() => {
      onSelectWinner(winner);
    }, 1000);
  };

  const handleReshuffle = () => {
    setFlippedIndex(null);
    const shuffled = [...candidates].sort(() => 0.5 - Math.random());
    const result: Student[] = [];
    for (let i = 0; i < 12; i++) {
      result.push(shuffled[i % shuffled.length]);
    }
    setCardStudents(result);
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

        <div className="flex items-center gap-2">
          <button
            onClick={handleReshuffle}
            className="px-2.5 py-1 rounded-lg border border-token text-[11px] font-semibold text-muted hover:text-main flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Trộn thẻ</span>
          </button>
          <span className="text-xs font-bold text-purple-500 px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 flex items-center gap-1">
            <Gift className="w-3.5 h-3.5" />
            <span>Rút Thẻ Nhân Phẩm</span>
          </span>
        </div>
      </div>

      <p className="text-xs text-muted -mt-1">
        Chạm vào 1 lá bài may mắn bất kỳ bên dưới để giải mã danh tính người được chọn!
      </p>

      {/* 12 Cards Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 sm:gap-3 w-full">
        {cardStudents.map((st, i) => {
          const isFlipped = flippedIndex === i;
          const isOtherFlipped = flippedIndex !== null && !isFlipped;

          return (
            <div
              key={i}
              onClick={() => handleCardClick(i)}
              className={`
                aspect-[3/4] rounded-2xl cursor-pointer transition-all duration-500 perspective-1000 select-none
                ${isOtherFlipped ? 'opacity-30 scale-95' : 'hover:scale-105 active:scale-95'}
              `}
            >
              <div className={`
                relative w-full h-full rounded-2xl transition-transform duration-500 transform-style-3d shadow-md
                ${isFlipped ? 'rotate-y-180 shadow-2xl ring-4 ring-amber-400' : ''}
              `}>
                {/* Card Back (Hidden Identity) */}
                <div className="absolute inset-0 backface-hidden rounded-2xl bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-700 border-2 border-purple-400/50 flex flex-col items-center justify-center p-2 text-white">
                  <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/30 flex items-center justify-center mb-1 shadow-inner">
                    <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                  </div>
                  <span className="text-[11px] font-black tracking-widest text-amber-300">
                    10A5
                  </span>
                  <span className="text-[9px] text-white/70 font-semibold mt-0.5">
                    Thẻ #{i + 1}
                  </span>
                </div>

                {/* Card Front (Revealed Student) */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl bg-surface border-2 border-amber-400 flex flex-col items-center justify-between p-2 text-main shadow-lg">
                  <span className="text-[9px] font-bold text-amber-500 uppercase">
                    Tổ {st?.to}
                  </span>

                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-amber-400/50 bg-surface-2 flex items-center justify-center">
                    {st?.avatarUrl ? (
                      <img src={st.avatarUrl} alt={st.hoTen} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-extrabold text-accent">
                        {st ? getStudentAvatarInitial(st.hoTen) : '?'}
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] font-black truncate max-w-full">
                    {st?.tenRutGon}
                  </div>
                  <span className="text-[9px] text-muted">
                    Tổ {st?.to}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
