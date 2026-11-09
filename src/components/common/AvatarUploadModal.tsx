import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Camera, Upload, Trash2, X, Check, Sparkles, Lock, ShieldAlert } from 'lucide-react';
import { Student, TeacherSettings } from '../../types';
import { getStudentAvatarInitial } from '../../utils/vietnamese';
import { PRESET_STUDENT_AVATARS, StudentAvatarPreset } from '../../data/avatarPresets';

interface AvatarUploadModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
  onSaveAvatar: (studentId: string, avatarUrl: string) => void;
  allStudents?: Student[];
  settings?: TeacherSettings;
}

export const AvatarUploadModal: React.FC<AvatarUploadModalProps> = ({
  student,
  isOpen,
  onClose,
  onSaveAvatar,
  allStudents = [],
  settings,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string>(student?.avatarUrl || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever modal opens or active student changes (e.g. fast demo switcher)
  useEffect(() => {
    if (isOpen && student) {
      setPreviewUrl(student.avatarUrl || '');
      setErrorMsg(null);
    }
  }, [isOpen, student?.avatarUrl, student?.maHS]);

  // Check duplicate setting
  const allowDuplicate = settings?.choPhepTrungAvatar ?? true;

  // Lookup map of avatars already taken by OTHER students in the class - MUST BE BEFORE ANY EARLY RETURN
  const takenAvatarMap = useMemo(() => {
    if (allowDuplicate || !allStudents) return new Map<string, string>();
    const map = new Map<string, string>();
    allStudents.forEach(st => {
      if (st && st.maHS !== student?.maHS && st.avatarUrl && typeof st.hoTen === 'string') {
        map.set(st.avatarUrl, st.hoTen);
      }
    });
    return map;
  }, [allStudents, student?.maHS, allowDuplicate]);

  // Student's gender is fixed by Homeroom Teacher from class file/records (Students CANNOT change it)
  const studentGender = student?.gioiTinh === 'Nu' ? 'Nu' : 'Nam';

  // Filter preset avatars: ONLY show avatars strictly matching student's gender!
  const genderMatchedPresets = useMemo(() => {
    return PRESET_STUDENT_AVATARS.filter(p => p.gender === studentGender);
  }, [studentGender]);

  // Early return ONLY AFTER all hooks are called
  if (!isOpen || !student) return null;

  // Process and resize custom uploaded image file to max 256x256 Base64 data URL
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Vui lòng chọn tệp hình ảnh (PNG, JPG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Kích thước ảnh tối đa 5MB');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 256;
          
          // Center-crop to square
          const minSide = Math.min(img.width, img.height);
          const startX = (img.width - minSide) / 2;
          const startY = (img.height - minSide) / 2;

          canvas.width = maxDim;
          canvas.height = maxDim;

          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas not supported');

          ctx.drawImage(
            img, 
            startX, startY, minSide, minSide, 
            0, 0, maxDim, maxDim
          );

          // Compress to JPEG data URL
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setPreviewUrl(compressedDataUrl);
          setIsProcessing(false);
        } catch {
          setErrorMsg('Không thể xử lý hình ảnh này. Vui lòng thử ảnh khác.');
          setIsProcessing(false);
        }
      };
      img.onerror = () => {
        setErrorMsg('Không thể đọc hình ảnh. Vui lòng chọn tệp hợp lệ.');
        setIsProcessing(false);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      setErrorMsg('Đọc tệp thất bại.');
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Drag and drop handlers
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleSave = () => {
    onSaveAvatar(student.maHS, previewUrl);
    onClose();
  };

  const handleRemove = () => {
    setPreviewUrl('');
    onSaveAvatar(student.maHS, '');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 animate-fade-in">
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-accent/15 via-blue-500/10 to-purple-500/15 border-b border-token flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-accent text-on-accent flex items-center justify-center shadow-xs">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-main leading-tight">
                Chọn Ảnh Đại Diện Học Sinh
              </h3>
              <p className="text-xs text-muted">
                {student.hoTen} · Tổ {student.to}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted hover:text-main hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Avatar Preview */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-3 border-accent/40 shadow-lg bg-surface-2 flex items-center justify-center">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={student.hoTen}
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-accent to-blue-500 text-white flex items-center justify-center text-3xl font-extrabold select-none">
                    {getStudentAvatarInitial(student.hoTen)}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 rounded-xl bg-accent text-on-accent shadow-md hover:scale-105 transition-transform cursor-pointer"
                title="Tải ảnh riêng từ thiết bị"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 50 Curated High Quality Student Avatars (All in one unified list, no category tabs) */}
          <div className="space-y-2.5 pt-2 border-t border-token">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs font-bold text-main">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Kho Avatar ({genderMatchedPresets.length} ảnh):</span>
              </div>
              
              {/* Controls & Badges */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Duplicate Policy Badge */}
                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[11px] font-bold shadow-2xs ${
                  allowDuplicate
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                }`}>
                  {allowDuplicate ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Cho phép trùng</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Cấm trùng avatar (Mỗi HS 1 ảnh)</span>
                    </>
                  )}
                </div>

                {/* Gender badge fixed from school records / teacher */}
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-black shadow-2xs ${
                  studentGender === 'Nu' 
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400' 
                    : 'bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-400'
                }`}>
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span>Giới tính: {studentGender === 'Nu' ? 'Nữ ♀' : 'Nam ♂'}</span>
                </div>
              </div>
            </div>

            {/* Clean Avatar Grid without text descriptions or category tabs */}
            <div className="max-h-64 sm:max-h-80 overflow-y-auto grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 gap-2.5 p-2.5 border border-token rounded-2xl bg-surface-2/40">
              {genderMatchedPresets.map((preset: StudentAvatarPreset) => {
                const isSelected = previewUrl === preset.imageSrc;
                const takenBy = !allowDuplicate ? (takenAvatarMap.get(preset.imageSrc) || takenAvatarMap.get(preset.id)) : null;

                return (
                  <button
                    key={preset.id}
                    type="button"
                    title={takenBy ? `Đã có bạn ${takenBy} chọn (GV cấm trùng Avatar)` : preset.name}
                    onClick={() => {
                      if (takenBy) {
                        setErrorMsg(`Avatar này đã được bạn "${takenBy}" chọn trước. Giáo viên đã bật chế độ không cho phép trùng Avatar trong lớp.`);
                        return;
                      }
                      setPreviewUrl(preset.imageSrc);
                      setErrorMsg(null);
                    }}
                    className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all cursor-pointer shadow-xs ${
                      isSelected
                        ? 'border-accent ring-2 ring-accent/60 scale-105 shadow-md z-10'
                        : takenBy
                        ? 'opacity-40 border-token/60 cursor-not-allowed filter grayscale-[30%]'
                        : 'border-token hover:border-accent/60 hover:scale-105'
                    }`}
                  >
                    <img
                      src={preset.imageSrc}
                      alt={preset.name}
                      className="w-full h-full object-cover"
                    />
                    {takenBy && typeof takenBy === 'string' && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-1 text-center">
                        <Lock className="w-4 h-4 text-amber-300 drop-shadow-md mb-0.5" />
                        <span className="text-[9px] font-bold text-white bg-black/70 px-1 py-0.2 rounded truncate max-w-full leading-tight">
                          {takenBy.split(' ').filter(Boolean).slice(-1)[0] || 'Đã chọn'}
                        </span>
                      </div>
                    )}
                    {isSelected && !takenBy && (
                      <div className="absolute inset-0 bg-accent/35 backdrop-blur-[0.5px] flex items-center justify-center">
                        <span className="w-6 h-6 rounded-full bg-accent text-on-accent flex items-center justify-center shadow-md">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Dropzone for Custom Photo */}
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded-2xl border-2 border-dashed border-token/80 hover:border-accent bg-surface-2/30 hover:bg-accent/5 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer text-center"
          >
            <Upload className="w-5 h-5 text-accent" />
            <span className="text-xs font-bold text-main">
              Hoặc tải ảnh chân dung từ thiết bị của bạn
            </span>
            <span className="text-[10px] text-muted">
              Hỗ trợ PNG, JPG, WebP (Tự động canh vuông chuẩn đẹp)
            </span>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-[var(--st-bad)]/10 text-[var(--st-bad)] text-xs font-semibold text-center">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-surface-2 border-t border-token flex items-center justify-between gap-2 shrink-0">
          {student.avatarUrl ? (
            <button
              type="button"
              onClick={handleRemove}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-500/10 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Gỡ ảnh</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-token text-xs font-semibold text-muted hover:text-main cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:opacity-95 shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isProcessing ? 'Đang nén ảnh...' : 'Lưu ảnh đại diện'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
