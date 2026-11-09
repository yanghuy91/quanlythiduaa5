import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Sparkles, 
  Check, 
  X, 
  Camera, 
  Tag, 
  Smile, 
  ShieldCheck,
  Edit3
} from 'lucide-react';
import { TeacherProfile, saveTeacherProfile } from '../../data/teacherProfile';
import { getTeacherAvatar } from '../../data/teacherAvatars';

interface TeacherProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: TeacherProfile;
  currentAvatarUrl?: string;
  onOpenAvatarPicker?: () => void;
  onSaveSuccess?: (updatedProfile: TeacherProfile) => void;
  onSaveProfile?: (updatedProfile: TeacherProfile) => void;
}

const STATUS_PRESETS = [
  'Giáo viên chủ nhiệm Lớp 10A5 • Năm học 2026-2027',
  'Đang trực ban thi đua lớp học',
  'Quản trị viên hệ thống • THPT Số 2 Đức Phổ',
  '🟢 Trực tuyến • Sẵn sàng hỗ trợ học sinh',
  'Đang tổng kết thi đua tuần',
];

export const TeacherProfileModal: React.FC<TeacherProfileModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  currentAvatarUrl,
  onOpenAvatarPicker,
  onSaveSuccess,
  onSaveProfile,
}) => {
  const [hoTen, setHoTen] = useState(currentProfile?.hoTen || 'Thầy Dương Văn Huy');
  const [statusText, setStatusText] = useState(currentProfile?.statusText || 'Giáo viên chủ nhiệm Lớp 10A5');
  const [school, setSchool] = useState(currentProfile?.school || 'THPT Số 2 Đức Phổ');

  // Always sync internal state when modal opens or currentProfile changes
  useEffect(() => {
    if (isOpen && currentProfile) {
      setHoTen(currentProfile.hoTen || 'Thầy Dương Văn Huy');
      setStatusText(currentProfile.statusText || 'Giáo viên chủ nhiệm Lớp 10A5');
      setSchool(currentProfile.school || 'THPT Số 2 Đức Phổ');
    }
  }, [isOpen, currentProfile]);

  if (!isOpen) return null;

  const effectiveAvatarUrl = currentAvatarUrl || getTeacherAvatar();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hoTen.trim()) return;

    const updated = saveTeacherProfile({
      hoTen: hoTen.trim(),
      statusText: statusText.trim(),
      school: school.trim(),
    });

    onSaveSuccess?.(updated);
    onSaveProfile?.(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
      <div 
        className="w-full max-w-lg bg-surface border border-token rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-accent text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/15 backdrop-blur-xs border border-white/20">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>Hồ Sơ & Danh Xưng Giáo Viên</span>
              </h2>
              <p className="text-xs text-white/80 mt-0.5 font-medium">
                Đổi tên hiển thị của Thầy và dòng trạng thái bên dưới
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4">
          {/* Avatar Preview & Quick Switch */}
          <div className="p-4 rounded-2xl bg-surface-2 border border-token flex items-center gap-4">
            <div className="relative group">
              <img
                src={effectiveAvatarUrl}
                alt={hoTen}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-token shadow-sm ring-2 ring-accent/30"
              />
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAvatarPicker?.();
                }}
                className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer text-xs"
                title="Đổi ảnh đại diện"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-main">Ảnh đại diện Giáo viên</span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAvatarPicker?.();
                  }}
                  className="text-xs font-bold text-accent hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Đổi ảnh đại diện</span>
                </button>
              </div>
              <p className="text-[11px] text-muted mt-1 leading-snug">
                Thầy có thể chọn từ kho ảnh 3D hiện đại hoặc tự tải ảnh chân dung riêng của mình lên.
              </p>
            </div>
          </div>

          {/* Teacher Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-main flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5 text-accent" />
              <span>Tên hiển thị của Thầy (Họ và tên):</span>
            </label>
            <input
              type="text"
              required
              value={hoTen}
              onChange={e => setHoTen(e.target.value)}
              placeholder="Ví dụ: Thầy Dương Văn Huy, Thầy Huy (GVCN)..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-token focus:border-accent focus:ring-2 focus:ring-accent/20 text-xs sm:text-sm font-bold text-main outline-none transition-all"
            />
          </div>

          {/* Teacher Status Text Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-main flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-accent" />
              <span>Dòng trạng thái hiển thị bên dưới tên:</span>
            </label>
            <input
              type="text"
              value={statusText}
              onChange={e => setStatusText(e.target.value)}
              placeholder="Ví dụ: Giáo viên chủ nhiệm Lớp 10A5 • Năm học 2026-2027"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-token focus:border-accent focus:ring-2 focus:ring-accent/20 text-xs sm:text-sm font-semibold text-main outline-none transition-all"
            />

            {/* Quick Status Presets */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
                Gợi ý trạng thái nhanh (Bấm để chọn):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setStatusText(preset)}
                    className="px-2.5 py-1 rounded-lg bg-surface border border-token hover:border-accent text-[11px] font-medium text-muted hover:text-main transition-colors text-left cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-accent/10 via-indigo-500/10 to-blue-500/10 border border-accent/30 space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-accent tracking-wider block">
              Xem trước hiển thị trên thanh Header & Bảng điều khiển:
            </span>
            <div className="flex items-center gap-2.5 pt-1">
              <img
                src={effectiveAvatarUrl}
                alt={hoTen}
                className="w-10 h-10 rounded-full object-cover border border-token shrink-0 shadow-xs"
              />
              <div className="min-w-0">
                <div className="text-xs font-black text-main flex items-center gap-1.5">
                  <span>{hoTen}</span>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-600 dark:text-amber-300">
                    GVCN
                  </span>
                </div>
                <div className="text-[11px] text-muted font-medium truncate mt-0.5">
                  {statusText || 'Giáo viên chủ nhiệm'}
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-token">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-token text-xs font-semibold text-muted hover:text-main transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-accent text-on-accent text-xs font-bold shadow-md hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Lưu thay đổi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
