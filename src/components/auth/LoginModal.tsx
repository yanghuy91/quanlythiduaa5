import React, { useState } from 'react';
import { 
  Lock, 
  KeyRound, 
  GraduationCap, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  ShieldAlert,
  Eye,
  EyeOff,
  CheckSquare,
  Square
} from 'lucide-react';
import { Student, SeatLayoutNode, RoleCode } from '../../types';
import { StudentPicker } from '../student-picker/StudentPicker';
import { getStudentAvatarInitial } from '../../utils/vietnamese';
import { verifyStudentPassword, verifyTeacherPassword } from '../../utils/authService';
import { Logo10A5 } from '../common/Logo10A5';
import { 
  loginWithGoogleFirebase, 
  loginWithGoogleRedirect, 
  checkGoogleRedirectResult,
  isAuthorizedTeacherEmail,
  logoutFirebase
} from '../../services/firebase';

interface LoginModalProps {
  students: Student[];
  layout: SeatLayoutNode[];
  onLoginStudent: (student: Student, role: RoleCode, remember: boolean) => void;
  onLoginTeacher: (remember: boolean, teacherInfo?: { hoTen?: string; email?: string; avatarUrl?: string }) => void;
  classCode: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  students,
  layout,
  onLoginStudent,
  onLoginTeacher,
  classCode,
}) => {
  const [enteredClassCode, setEnteredClassCode] = useState(classCode);
  const [isClassCodeVerified, setIsClassCodeVerified] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberLogin, setRememberLogin] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [teacherLoginMode, setTeacherLoginMode] = useState(false);
  const [teacherPassword, setTeacherPasswordInput] = useState('');
  const [showTeacherPassword, setShowTeacherPassword] = useState(false);

  // Verify class code
  const handleVerifyClassCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredClassCode.trim().toUpperCase() === classCode.toUpperCase()) {
      setIsClassCodeVerified(true);
      setErrorMsg('');
    } else {
      setErrorMsg('Mã lớp không chính xác. Vui lòng liên hệ Giáo viên chủ nhiệm.');
    }
  };

  // Student login
  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      setErrorMsg('Vui lòng chọn học sinh từ danh sách hoặc sơ đồ.');
      return;
    }

    if (isLocked) {
      setErrorMsg('Tài khoản tạm khoá 15 phút do nhập sai 5 lần liên tiếp.');
      return;
    }

    // Verify custom or default password (123456)
    const isValid = verifyStudentPassword(selectedStudent.maHS, password);
    if (isValid) {
      // Determine highest priority role
      const primaryRole = selectedStudent.vaiTro[0] || 'HS';
      onLoginStudent(selectedStudent, primaryRole, rememberLogin);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 5) {
        setIsLocked(true);
        setErrorMsg('Sai mật khẩu 5 lần! Tài khoản bị tạm khoá 15 phút.');
      } else {
        setErrorMsg(`Mật khẩu không đúng (Mặc định ban đầu: 123456). Còn ${5 - newAttempts} lần thử.`);
      }
    }
  };

  // Check if returning from Google Redirect
  React.useEffect(() => {
    let isMounted = true;
    checkGoogleRedirectResult().then(async user => {
      if (!isMounted) return;
      if (user) {
        if (!isAuthorizedTeacherEmail(user.email)) {
          await logoutFirebase();
          setErrorMsg(`⛔ Tài khoản Google "${user.email}" không phải là tài khoản Giáo viên chủ nhiệm lớp 10A5. Chỉ tài khoản yanghuy91@gmail.com mới có quyền quản trị!`);
          return;
        }

        onLoginTeacher(rememberLogin, {
          hoTen: user.displayName || 'Thầy Huy (GVCN)',
          email: user.email || undefined,
          avatarUrl: user.photoURL || undefined,
        });
      }
    }).catch(err => {
      console.error('[GoogleRedirectCheck] Error:', err);
      if (err.code === 'auth/unauthorized-domain') {
        setErrorMsg('Tên miền "thiduabc5.vercel.app" chưa được thêm vào Firebase Authorized domains. Thầy/Cô có thể đăng nhập bằng Mật khẩu Giáo viên bên dưới.');
      }
    });
    return () => { isMounted = false; };
  }, []);

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Teacher Google Login (Popup or Seamless Redirect)
  const handleTeacherGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      setErrorMsg('');
      const googleUser = await loginWithGoogleFirebase();
      if (googleUser) {
        // Strict verification: only authorized teacher email allowed!
        if (!isAuthorizedTeacherEmail(googleUser.email)) {
          await logoutFirebase();
          setErrorMsg(`⛔ Tài khoản Google "${googleUser.email}" không phải là tài khoản Giáo viên chủ nhiệm lớp 10A5. Chỉ tài khoản yanghuy91@gmail.com mới có quyền quản trị!`);
          return;
        }

        onLoginTeacher(rememberLogin, {
          hoTen: googleUser.displayName || 'Thầy Huy (GVCN)',
          email: googleUser.email || undefined,
          avatarUrl: googleUser.photoURL || undefined,
        });
      }
    } catch (err: any) {
      console.error('[GoogleLogin] Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        // User voluntarily dismissed popup
      } else if (err.code === 'auth/unauthorized-domain') {
        setErrorMsg('Tên miền "thiduabc5.vercel.app" cần được thêm vào mục Authorized domains trong Firebase Console. Thầy/Cô có thể đăng nhập ngay bằng Mật khẩu Giáo viên bên dưới.');
      } else {
        // Seamless fallback to direct redirect
        try {
          await loginWithGoogleRedirect();
        } catch (rErr) {
          setErrorMsg('Chưa thể kết nối Google: Thầy/Cô có thể đăng nhập ngay bằng Mật khẩu Giáo viên bên dưới.');
        }
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Direct Teacher Password Login
  const handleTeacherPasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherPassword.trim()) {
      setErrorMsg('Vui lòng nhập mật khẩu Giáo viên.');
      return;
    }
    if (verifyTeacherPassword(teacherPassword)) {
      setErrorMsg('');
      onLoginTeacher(rememberLogin, {
        hoTen: 'Thầy Huy (GVCN)',
        email: 'yanghuy91@gmail.com',
      });
    } else {
      setErrorMsg('Mật khẩu Giáo viên chưa đúng. (Mật khẩu mặc định: gvcn10a5 hoặc 123456)');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-4xl bg-surface border border-token rounded-3xl shadow-2xl p-4 sm:p-6 my-6 space-y-4 animate-scale-up">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Logo10A5 size="xl" showText={false} animate={true} />
          </div>
          <h2 className="text-lg font-black text-main tracking-tight">
            Quản Lý Nề Nếp &amp; Thi Đua
          </h2>
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted">
            <span className="font-bold text-accent">Lớp 10A5</span>
            <span>·</span>
            <span>THPT Số 2 Đức Phổ</span>
          </div>
        </div>

        {/* Step 1: Class Gate Code (if not verified) */}
        {!isClassCodeVerified ? (
          <form onSubmit={handleVerifyClassCode} className="space-y-3 pt-2">
            <div className="p-3 rounded-xl bg-surface-2 border border-token text-xs text-main">
              Nhập mã lớp (6 ký tự) do Giáo viên chủ nhiệm cung cấp để truy cập vào hệ thống lớp 10A5:
            </div>

            <div>
              <input
                type="text"
                value={enteredClassCode}
                onChange={e => setEnteredClassCode(e.target.value)}
                placeholder="VD: 10A5DP"
                className="w-full px-3 py-2 bg-surface border border-token rounded-xl text-center font-bold text-main text-sm uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-[var(--st-bad)] flex items-center gap-1 justify-center">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errorMsg}</span>
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:opacity-95 transition-opacity cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Vào lớp học</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : teacherLoginMode ? (
          /* Step 2: Teacher Portal */
          <div className="space-y-4 pt-2">
            <div className="p-3 rounded-xl bg-[var(--role-gv-bg)] text-[var(--role-gv-fg)] border border-[var(--role-gv-fg)]/20 text-xs flex items-center justify-between">
              <span className="font-semibold flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4" />
                <span>Cổng đăng nhập Giáo viên chủ nhiệm</span>
              </span>
              <button
                type="button"
                onClick={() => { setTeacherLoginMode(false); setErrorMsg(''); }}
                className="text-xs underline font-bold cursor-pointer hover:opacity-80"
              >
                Về học sinh
              </button>
            </div>

            {/* Error Message Box */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-500 space-y-1 animate-scale-up">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Thông báo đăng nhập:</span>
                </div>
                <p className="text-main leading-relaxed pl-5 font-medium">{errorMsg}</p>
              </div>
            )}

            {/* Method 1: Google OAuth Instant Login (Standard & Sleek) */}
            <div className="space-y-2">
              <button
                type="button"
                disabled={isGoogleLoading}
                onClick={handleTeacherGoogleLogin}
                className="w-full py-3 px-4 rounded-xl border border-token bg-surface hover:bg-surface-2 text-main text-xs sm:text-sm font-semibold flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xs hover:shadow active:scale-[0.99] disabled:opacity-60"
              >
                {isGoogleLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-accent border-t-transparent" />
                    <span>Đang kết nối tài khoản Google...</span>
                  </span>
                ) : (
                  <>
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Tiếp tục với Google</span>
                  </>
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-token"></div>
              <span className="flex-shrink mx-3 text-[10px] text-muted uppercase font-bold tracking-wider">
                Hoặc mật khẩu Giáo viên
              </span>
              <div className="flex-grow border-t border-token"></div>
            </div>

            {/* Method 2: Teacher Direct Password */}
            <form onSubmit={handleTeacherPasswordLogin} className="space-y-3">
              <div className="relative">
                <input
                  type={showTeacherPassword ? 'text' : 'password'}
                  value={teacherPassword}
                  onChange={e => setTeacherPasswordInput(e.target.value)}
                  placeholder="Nhập mật khẩu GV (Mặc định: gvcn10a5)..."
                  className="w-full px-3 py-2.5 pr-10 bg-surface-2 border border-token rounded-xl text-xs text-main placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
                <button
                  type="button"
                  onClick={() => setShowTeacherPassword(!showTeacherPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-main cursor-pointer"
                  tabIndex={-1}
                >
                  {showTeacherPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:opacity-95 transition-opacity cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Đăng nhập quyền Giáo viên</span>
              </button>
            </form>

            {/* Remember Login for Teacher */}
            <div className="flex items-start gap-2 pt-1 border-t border-token">
              <input
                type="checkbox"
                id="remember-login-teacher"
                checked={rememberLogin}
                onChange={e => setRememberLogin(e.target.checked)}
                className="mt-0.5 rounded border-token text-accent focus:ring-accent cursor-pointer"
              />
              <label htmlFor="remember-login-teacher" className="text-xs text-main cursor-pointer select-none">
                <span className="font-bold">Ghi nhớ đăng nhập trên thiết bị này</span>
                <span className="block text-[11px] text-muted">
                  {rememberLogin 
                    ? 'Lưu phiên đăng nhập cho lần sau trên trình duyệt này.' 
                    : 'Không lưu: Sẽ tự động đăng xuất khi bạn đóng tab.'}
                </span>
              </label>
            </div>
          </div>
        ) : (
          /* Step 2: Student & Cadre Login */
          <div className="space-y-4">
            {/* Selected Student Banner (Guaranteed Name Visibility) */}
            {selectedStudent ? (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-accent/10 to-indigo-500/10 border-2 border-accent/40 flex items-center justify-between gap-3 animate-scale-up">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-accent shrink-0 shadow-sm bg-surface flex items-center justify-center">
                    {selectedStudent.avatarUrl ? (
                      <img 
                        src={selectedStudent.avatarUrl} 
                        alt={selectedStudent.hoTen} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full bg-accent text-on-accent font-extrabold text-base flex items-center justify-center">
                        {getStudentAvatarInitial(selectedStudent.hoTen)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-accent uppercase tracking-wider">
                      Học sinh đang chọn:
                    </div>
                    <div className="text-base font-extrabold text-main truncate">
                      {selectedStudent.hoTen}
                    </div>
                    <div className="text-xs text-muted flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-main">Tổ {selectedStudent.to}</span>
                      {selectedStudent.vaiTro[0] !== 'HS' && (
                        <span className="font-bold text-accent">
                          ({selectedStudent.vaiTro[0] === 'LT' ? '👑 Lớp trưởng' :
                            selectedStudent.vaiTro[0] === 'BT' ? '🚩 Bí thư' :
                            selectedStudent.vaiTro[0] === 'LP_HT' ? '📖 LP Học tập' :
                            selectedStudent.vaiTro[0] === 'LP_LD' ? '⚡ LP Lao động' : '🛡️ Tổ trưởng'})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="px-2.5 py-1.5 rounded-xl border border-token text-xs font-semibold text-muted hover:text-main hover:bg-surface-2 transition-colors cursor-pointer shrink-0"
                >
                  Chọn lại
                </button>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-surface-2 border border-token text-xs text-muted text-center flex items-center justify-center gap-2">
                <span>👉 Chạm vào ảnh đại diện / chỗ ngồi của bạn bên dưới để đăng nhập:</span>
              </div>
            )}

            {/* Student Picker: Note: showStatusColors = FALSE as required by spec */}
            <div className="space-y-2">
              <StudentPicker
                students={students}
                layout={layout}
                selectedStudentIds={selectedStudent ? [selectedStudent.maHS] : []}
                onSelectStudent={st => {
                  setSelectedStudent(st);
                  setErrorMsg('');
                }}
                showStatusColors={false} // NEVER reveal status colors before login!
                initialDisplayMode="avatar_badge"
              />
            </div>

            {/* Password input */}
            <form onSubmit={handleStudentSubmit} className="space-y-3 pt-1 border-t border-token">
              <div>
                <label className="block text-xs font-semibold text-main mb-1">
                  {selectedStudent ? `Nhập mật khẩu cho [${selectedStudent.hoTen}] (Mặc định: 123456):` : 'Nhập mật khẩu (Mặc định: 123456):'}
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    disabled={!selectedStudent || isLocked}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Mật khẩu tối thiểu 6 ký tự..."
                    className="w-full pl-9 pr-10 py-2 bg-surface border border-token rounded-xl text-xs text-main placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-main cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Login Checkbox */}
              <div className="flex items-start gap-2 pt-0.5">
                <input
                  type="checkbox"
                  id="remember-login-student"
                  checked={rememberLogin}
                  onChange={e => setRememberLogin(e.target.checked)}
                  className="mt-0.5 rounded border-token text-accent focus:ring-accent cursor-pointer"
                />
                <label htmlFor="remember-login-student" className="text-xs text-main cursor-pointer select-none">
                  <span className="font-bold">Ghi nhớ đăng nhập trên thiết bị này</span>
                  <span className="block text-[11px] text-muted">
                    {rememberLogin 
                      ? 'Lưu đăng nhập cho lần sau (không cần đăng nhập lại khi mở trang).' 
                      : 'Không lưu: Phiên đăng nhập sẽ tự xóa khi bạn đóng trình duyệt.'}
                  </span>
                </label>
              </div>

              {errorMsg && (
                <p className="text-xs text-[var(--st-bad)] flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errorMsg}</span>
                </p>
              )}

              <button
                type="submit"
                disabled={!selectedStudent || isLocked}
                className="w-full py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:opacity-95 disabled:opacity-50 transition-opacity cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{selectedStudent ? `Đăng nhập: ${selectedStudent.hoTen}` : 'Chọn tên học sinh để đăng nhập'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Teacher Entry Point Button */}
            <div className="pt-2 text-center border-t border-token">
              <button
                type="button"
                onClick={() => setTeacherLoginMode(true)}
                className="text-xs font-semibold text-muted hover:text-accent transition-colors cursor-pointer"
              >
                Dành cho Giáo viên chủ nhiệm &rarr;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
