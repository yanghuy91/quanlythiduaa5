import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Camera, Upload, Trash2, X, Check, Sparkles, Lock, ShieldAlert } from 'lucide-react';
import { Student, TeacherSettings } from '../../types';
import { getStudentAvatarInitial } from '../../utils/vietnamese';
import { PRESET_STUDENT_AVATARS, StudentAvatarPreset, resolveStudentAvatar } from '../../data/avatarPresets';

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
  const [previewUrl, setPreviewUrl] = useState<string>(resolveStudentAvatar(student?.avatarUrl) || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever modal opens or active student changes (e.g. fast demo switcher)
  useEffect(() => {
    if (isOpen && student) {
      setPreviewUrl(resolveStudentAvatar(student.avatarUrl) || '');
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
        const resolved = resolveStudentAvatar(st.avatarUrl) || st.avatarUrl;
        map.set(resolved, st.hoTen);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-up text-slate-900"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-sky-50 via-indigo-50/70 to-purple-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                Chọn Ảnh Đại Diện Học Sinh
              </h3>
              <p className="text-xs font-semibold text-slate-600">
                {student.hoTen} · Tổ {student.to}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto bg-white">
          {/* Avatar Preview */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-3 border-sky-400 shadow-md bg-slate-100 flex items-center justify-center">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={student.hoTen}
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center text-3xl font-extrabold select-none">
                    {getStudentAvatarInitial(student.hoTen)}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:scale-105 transition-all cursor-pointer"
                title="Tải ảnh riêng từ thiết bị"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 50 Curated High Quality Student Avatars (All in one unified list, no category tabs) */}
          <div className="space-y-2.5 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Kho Avatar ({genderMatchedPresets.length} ảnh):</span>
              </div>
              
              {/* Controls & Badges */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Duplicate Policy Badge */}
                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[11px] font-bold shadow-2xs ${
                  allowDuplicate
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
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
                    ? 'bg-rose-50 border-rose-200 text-rose-700' 
                    : 'bg-sky-50 border-sky-200 text-sky-700'
                }`}>
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span>Giới tính: {studentGender === 'Nu' ? 'Nữ ♀' : 'Nam ♂'}</span>
                </div>
              </div>
            </div>

            {/* Clean Avatar Grid without text descriptions or category tabs */}
            <div className="max-h-64 sm:max-h-80 overflow-y-auto grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 gap-2.5 p-2.5 border border-slate-200 rounded-2xl bg-slate-50/80">
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
                        ? 'border-indigo-600 ring-2 ring-indigo-500 scale-105 shadow-md z-10'
                        : takenBy
                        ? 'opacity-40 border-slate-200 cursor-not-allowed filter grayscale-[30%]'
                        : 'border-slate-200 hover:border-indigo-400 hover:scale-105 bg-white'
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
                      <div className="absolute inset-0 bg-indigo-600/40 backdrop-blur-[0.5px] flex items-center justify-center">
                        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md">
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
            className="p-3 rounded-2xl border-2 border-dashed border-sky-300 hover:border-indigo-500 bg-sky-50/40 hover:bg-sky-50/80 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer text-center"
          >
            <Upload className="w-5 h-5 text-indigo-600" />
            <span className="text-xs font-bold text-slate-900">
              Hoặc tải ảnh chân dung từ thiết bị của bạn
            </span>
            <span className="text-[10px] font-medium text-slate-500">
              Hỗ trợ PNG, JPG, WebP (Tự động canh vuông chuẩn đẹp)
            </span>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold text-center">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
          {student.avatarUrl ? (
            <button
              type="button"
              onClick={handleRemove}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-1.5 transition-colors cursor-pointer"
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
              className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
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
