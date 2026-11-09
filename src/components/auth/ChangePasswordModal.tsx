import React, { useState } from 'react';
import { 
  KeyRound, 
  X, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  ShieldCheck 
} from 'lucide-react';
import { Student } from '../../types';
import { changeStudentPassword } from '../../utils/authService';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  onSuccess?: (msg: string) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  student,
  onSuccess,
}) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const result = changeStudentPassword(
      student.maHS,
      oldPassword,
      newPassword,
      confirmPassword
    );

    if (result.success) {
      setIsSuccess(true);
      if (onSuccess) {
        onSuccess(result.message);
      }
      setTimeout(() => {
        setIsSuccess(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        onClose();
      }, 1500);
    } else {
      setErrorMsg(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-surface border border-token shadow-2xl p-5 sm:p-6 overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-token">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-main">
                Đổi Mật Khẩu Cá Nhân
              </h3>
              <p className="text-xs text-muted">
                {student.hoTen} · STT #{student.viTriGhe} · Tổ {student.to}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted hover:text-main hover:bg-surface-2 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert */}
        {isSuccess ? (
          <div className="py-8 text-center space-y-3 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-extrabold text-main">
              Đổi Mật Khẩu Thành Công!
            </h4>
            <p className="text-xs text-muted max-w-xs mx-auto">
              Mật khẩu mới đã được lưu an toàn. Vui lòng ghi nhớ mật khẩu này cho các lần đăng nhập tiếp theo.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 pt-4">
            {/* Old Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-main">
                  Mật khẩu hiện tại:
                </label>
                <span className="text-[10px] text-muted italic">
                  (Mặc định ban đầu: 123456)
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showOldPass ? 'text' : 'password'}
                  required
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại..."
                  className="w-full pl-9 pr-10 py-2 rounded-xl bg-surface-2 border border-token text-xs text-main placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPass(!showOldPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-main cursor-pointer"
                >
                  {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-bold text-main mb-1">
                Mật khẩu mới:
              </label>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showNewPass ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Mật khẩu mới (tối thiểu 6 ký tự)..."
                  className="w-full pl-9 pr-10 py-2 rounded-xl bg-surface-2 border border-token text-xs text-main placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-main cursor-pointer"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-bold text-main mb-1">
                Xác nhận mật khẩu mới:
              </label>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới..."
                  className="w-full pl-9 pr-10 py-2 rounded-xl bg-surface-2 border border-token text-xs text-main placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-main cursor-pointer"
                >
                  {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-surface-2 hover:bg-surface border border-token text-xs font-bold text-muted hover:text-main cursor-pointer transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-accent text-on-accent text-xs font-bold cursor-pointer shadow-md hover:opacity-95 active:scale-95 transition-all"
              >
                Xác nhận đổi mật khẩu
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
