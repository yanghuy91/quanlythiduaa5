import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Check, 
  Sparkles, 
  Camera, 
  User, 
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';
import { 
  TEACHER_AVATAR_PRESETS, 
  TeacherAvatarPreset, 
  setTeacherAvatar 
} from '../../data/teacherAvatars';

interface TeacherAvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl: string;
  teacherName?: string;
  onSelectAvatar: (avatarUrl: string) => void;
}

export const TeacherAvatarModal: React.FC<TeacherAvatarModalProps> = ({
  isOpen,
  onClose,
  currentAvatarUrl,
  teacherName,
  onSelectAvatar,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'upload'>('presets');
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string>(currentAvatarUrl);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever modal opens or current avatar changes
  useEffect(() => {
    if (isOpen) {
      setSelectedAvatarUrl(currentAvatarUrl);
      setUploadError(null);
    }
  }, [isOpen, currentAvatarUrl]);

  const handleApplyDirect = (avatarUrl: string) => {
    setSelectedAvatarUrl(avatarUrl);
    setTeacherAvatar(avatarUrl);
    onSelectAvatar(avatarUrl);
    onClose();
  };

  if (!isOpen) return null;

  // Handle file upload and convert to compressed Base64 Data URL
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Vui lòng chọn một file ảnh hợp lệ (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setUploadError('Kích thước file ảnh quá lớn (vui lòng chọn ảnh dưới 8MB).');
      return;
    }

    setIsProcessing(true);
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize to maximum 512x512 for optimal storage and sharp rendering
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 512;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setSelectedAvatarUrl(compressedDataUrl);
        }
        setIsProcessing(false);
      };
      img.onerror = () => {
        setUploadError('Không thể xử lý hình ảnh này. Vui lòng thử ảnh khác.');
        setIsProcessing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setUploadError('Lỗi khi đọc file từ thiết bị.');
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleApply = () => {
    setTeacherAvatar(selectedAvatarUrl);
    onSelectAvatar(selectedAvatarUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-700 p-4 sm:p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto no-scrollbar">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-token/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-main flex items-center gap-2">
                <span>ẢNH ĐẠI DIỆN GIÁO VIÊN</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/15 text-accent uppercase">
                  GVCN 10A5
                </span>
              </h3>
              <p className="text-xs text-muted">
                Chọn avatar phong cách hoặc tải ảnh đại diện từ máy tính/điện thoại
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-muted hover:text-main hover:bg-surface-2 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Preview Box */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-surface-2/80 border border-token">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden border-2 border-accent shadow-md bg-surface shrink-0">
                <img
                  src={selectedAvatarUrl}
                  alt="Ảnh đại diện giáo viên"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-accent text-on-accent text-xs flex items-center justify-center shadow-xs border-2 border-surface">
                👨‍🏫
              </span>
            </div>

            <div>
              <span className="text-sm font-black text-main block">
                {teacherName || 'Giáo viên Chủ nhiệm'}
              </span>
              <span className="text-xs text-muted block mt-0.5">
                Lớp 10A5 · THPT Số 2 Đức Phổ
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                <Check className="w-3 h-3" />
                <span>Ảnh đã chọn sẵn sàng lưu</span>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleApply}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-accent text-on-accent text-xs font-bold shadow-xs hover:brightness-110 cursor-pointer transition-all flex items-center justify-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Lưu ảnh đại diện này</span>
          </button>
        </div>

        {/* Tabs Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-surface-2 border border-token text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'presets' 
                ? 'bg-surface text-main shadow-xs' 
                : 'text-muted hover:text-main'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>10 Avatar hoạt hình thiết kế sẵn</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'upload' 
                ? 'bg-surface text-main shadow-xs' 
                : 'text-muted hover:text-main'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-accent" />
            <span>Tải ảnh cá nhân lên</span>
          </button>
        </div>

        {/* Tab 1: Presets */}
        {activeTab === 'presets' && (
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
              <span>👉 Bấm trực tiếp vào ảnh đại diện bất kỳ để áp dụng ngay:</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {TEACHER_AVATAR_PRESETS.map((preset) => {
                const isSelected = selectedAvatarUrl === preset.src;

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyDirect(preset.src)}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer group hover:scale-[1.01] ${
                      isSelected
                        ? 'border-accent bg-accent/10 shadow-md ring-2 ring-accent/30'
                        : 'border-token bg-surface hover:bg-surface-2 hover:border-accent/40'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-13 h-13 rounded-full overflow-hidden border-2 border-token bg-surface shadow-xs">
                        <img
                          src={preset.src}
                          alt={preset.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {isSelected && (
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-accent text-on-accent flex items-center justify-center shadow-xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5 flex-wrap">
                        <span className="text-xs font-black text-main group-hover:text-accent transition-colors">
                          {preset.name}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-surface-2 border border-token text-muted">
                          {preset.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted line-clamp-2 mt-1 leading-snug">
                        {preset.description}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-accent">
                        <span>{isSelected ? '✓ Đang sử dụng' : '👉 Bấm để chọn ngay'}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Upload Custom Photo */}
        {activeTab === 'upload' && (
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">
              Tải ảnh đại diện từ máy tính hoặc điện thoại:
            </span>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-token hover:border-accent rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-surface-2/40 hover:bg-accent/5 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-main mb-1">
                Bấm vào đây để chọn ảnh từ máy tính hoặc điện thoại
              </span>
              <span className="text-[11px] text-muted">
                Hỗ trợ định dạng JPG, PNG, WEBP (Tối đa 8MB). Hệ thống sẽ tự động tối ưu hóa tròn đẹp mắt.
              </span>
            </div>

            {isProcessing && (
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-xs flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Đang xử lý và nén ảnh đại diện...</span>
              </div>
            )}

            {uploadError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-token/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-main font-bold text-xs cursor-pointer transition-colors"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 rounded-xl bg-accent text-on-accent font-bold text-xs cursor-pointer hover:brightness-110 shadow-xs transition-all flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Xác nhận &amp; Lưu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
