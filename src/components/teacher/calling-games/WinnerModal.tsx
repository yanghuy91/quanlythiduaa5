import React, { useEffect } from 'react';
import { Sparkles, Trophy, Award, Plus, Minus, RotateCcw, X, Check } from 'lucide-react';
import { Student, RoleCode } from '../../../types';
import { ROLE_CONFIG } from '../../../data/mockData';
import { soundEffects } from '../../../utils/soundEffects';
import { getStudentAvatarInitial } from '../../../utils/vietnamese';

interface WinnerModalProps {
  student: Student | null;
  isOpen: boolean;
  gameTitle: string;
  onClose: () => void;
  onPlayAgain: () => void;
  onQuickRecord?: (student: Student, type: 'Cong' | 'Tru') => void;
}

const FUN_TITLES = [
  '🎯 Chiến thần lên bảng hôm nay!',
  '🌟 Gương mặt vàng trong làng kiểm tra bài!',
  '🚀 Người được vũ trụ 10A5 lựa chọn!',
  '🔥 Thử thách nhân phẩm thành công rực rỡ!',
  '⚡ Tự tin tỏa sáng ghi điểm tuyệt đối nào!',
  '📚 Bậc thầy kiến thức lớp 10A5!',
  '👑 Ngôi sao sáng nhất tiết học hôm nay!'
];

export const WinnerModal: React.FC<WinnerModalProps> = ({
  student,
  isOpen,
  gameTitle,
  onClose,
  onPlayAgain,
  onQuickRecord,
}) => {
  useEffect(() => {
    if (isOpen && student) {
      soundEffects.fanfare();
    }
  }, [isOpen, student]);

  if (!isOpen || !student) return null;

  const topRole = student.vaiTro[0] || 'HS';
  const roleConfig = ROLE_CONFIG[topRole];
  const randomTitle = FUN_TITLES[Math.floor(Math.random() * FUN_TITLES.length)];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-md bg-surface border-2 border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-center animate-scale-up relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Top ambient glow */}
        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-amber-500/25 to-transparent pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-10 p-1.5 rounded-xl text-muted hover:text-main hover:bg-surface-2 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-6 pt-7 flex flex-col items-center">
          {/* Game Tag */}
          <div className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-1.5 mb-3">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>{gameTitle} gọi tên</span>
          </div>

          {/* Avatar with Halo Ring */}
          <div className="relative mb-3.5">
            <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-amber-500 shadow-xl bg-surface-2 flex items-center justify-center ring-4 ring-amber-500/20">
              {student.avatarUrl ? (
                <img
                  src={student.avatarUrl}
                  alt={student.hoTen}
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-amber-500 to-accent text-white flex items-center justify-center text-3xl font-extrabold select-none">
                  {getStudentAvatarInitial(student.hoTen)}
                </div>
              )}
            </div>

            {/* Seat Badge */}
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs font-extrabold px-2 py-0.5 rounded-full bg-surface text-main border-2 border-amber-500 shadow-md">
              Ghế #{student.viTriGhe}
            </span>
          </div>

          {/* Student Name */}
          <h2 className="text-xl sm:text-2xl font-black text-main tracking-tight mt-1">
            {student.hoTen}
          </h2>

          {/* Sub details: Group & Role */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap justify-center">
            <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-surface-2 text-muted border border-token">
              Tổ {student.to}
            </span>

            {topRole !== 'HS' && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1"
                style={{
                  color: roleConfig.fg,
                  backgroundColor: roleConfig.bg,
                  borderColor: roleConfig.fg,
                }}
              >
                <span>{roleConfig.label}</span>
              </span>
            )}
          </div>

          {/* Motivational Title */}
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-3 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 max-w-sm">
            {randomTitle}
          </p>

          {/* Quick Actions for Teacher */}
          <div className="w-full grid grid-cols-2 gap-2 mt-5">
            <button
              onClick={() => onQuickRecord && onQuickRecord(student, 'Cong')}
              className="py-2.5 px-3 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Ghi điểm cộng</span>
            </button>

            <button
              onClick={() => onQuickRecord && onQuickRecord(student, 'Tru')}
              className="py-2.5 px-3 rounded-2xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-600 dark:text-red-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Minus className="w-4 h-4 stroke-[3]" />
              <span>Ghi vi phạm</span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 bg-surface-2 border-t border-token flex items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-token text-xs font-semibold text-muted hover:text-main"
          >
            Đóng
          </button>

          <button
            onClick={onPlayAgain}
            className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:opacity-95 shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Gọi bạn khác</span>
          </button>
        </div>
      </div>
    </div>
  );
};
