import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, 
  KeyRound, 
  GraduationCap, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckSquare,
  Square
} from 'lucide-react';
import { Student, SeatLayoutNode, RoleCode } from '../../types';
import { StudentPicker } from '../student-picker/StudentPicker';
import { getStudentAvatarInitial } from '../../utils/vietnamese';
import { verifyStudentPassword } from '../../utils/authService';
import { Logo10A5 } from '../common/Logo10A5';
import { 
  loginWithGoogleFirebase, 
  loginWithGoogleRedirect, 
  checkGoogleRedirectResult,
  loginWithGoogleCredentialToken,
  isAuthorizedTeacherEmail,
  logoutFirebase,
  onFirebaseAuthStateChanged
} from '../../services/firebase';

const GOOGLE_CLIENT_ID = "476490186681-eblrqc13ve6l5rq4dvg69li5e1ounf2u.apps.googleusercontent.com";

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
  const [teacherLoginMode, setTeacherLoginMode] = useState(() => {
    return sessionStorage.getItem('active_login_tab') === 'teacher';
  });

  const handleToggleTeacherMode = (enable: boolean) => {
    setTeacherLoginMode(enable);
    setErrorMsg('');
    if (enable) {
      sessionStorage.setItem('active_login_tab', 'teacher');
    } else {
      sessionStorage.removeItem('active_login_tab');
    }
  };

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
        setErrorMsg(`Mật khẩu không đúng. Còn ${5 - newAttempts} lần thử.`);
      }
    }
  };

  // Automatic Firebase Auth Listener in Modal
  React.useEffect(() => {
    const unsub = onFirebaseAuthStateChanged(async (user) => {
      if (user && user.email) {
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
    });
    return () => unsub();
  }, [rememberLogin]);

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  // Initialize Google Identity Services (GSI - Native, Instant, No Cookie/Storage issues)
  useEffect(() => {
    if (!teacherLoginMode) return;

    let isSubscribed = true;
    const initGsi = () => {
      const google = (window as any).google;
      if (google && google.accounts && google.accounts.id) {
        try {
          google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            auto_select: true,
            callback: async (response: any) => {
              if (!isSubscribed) return;
              try {
                setIsGoogleLoading(true);
                setErrorMsg('');
                // Decode Google ID Token payload
                const base64Url = response.credential.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(
                  atob(base64)
                    .split('')
                    .map((c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
                );
                const payload = JSON.parse(jsonPayload);

                if (!isAuthorizedTeacherEmail(payload.email)) {
                  await logoutFirebase().catch(() => {});
                  setErrorMsg(`⛔ Tài khoản Google "${payload.email}" không phải là tài khoản Giáo viên chủ nhiệm lớp 10A5. Chỉ tài khoản yanghuy91@gmail.com mới có quyền quản trị!`);
                  setIsGoogleLoading(false);
                  return;
                }

                // Sync with Firebase Auth
                try {
                  await loginWithGoogleCredentialToken(response.credential);
                } catch (fbErr) {
                  console.warn('Firebase credential link notice:', fbErr);
                }

                // Log in teacher directly
                onLoginTeacher(rememberLogin, {
                  hoTen: payload.name || 'Thầy Huy (GVCN)',
                  email: payload.email,
                  avatarUrl: payload.picture,
                });
              } catch (err: any) {
                console.error('Google credential parse error:', err);
                setErrorMsg('Đăng nhập Google thất bại: ' + (err.message || 'Vui lòng thử lại.'));
                setIsGoogleLoading(false);
              }
            },
          });

          if (googleBtnContainerRef.current) {
            googleBtnContainerRef.current.innerHTML = '';
            google.accounts.id.renderButton(googleBtnContainerRef.current, {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              text: 'signin_with',
              shape: 'rectangular',
              logo_alignment: 'left',
              width: 320,
            });
          }

          // Trigger One Tap prompt if supported by browser
          google.accounts.id.prompt();
        } catch (e) {
          console.error('Failed to init GSI:', e);
        }
      } else {
        setTimeout(initGsi, 200);
      }
    };

    initGsi();
    return () => { isSubscribed = false; };
  }, [teacherLoginMode, rememberLogin]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-4xl bg-surface border border-token rounded-3xl shadow-2xl p-4 sm:p-6 my-6 space-y-4 animate-scale-up">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Logo10A5 size="xl" showText={false} animate={true} />
          </div>
          <h2 className="text-lg font-black text-main tracking-tight">
            Quản Lý Thi Đua
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
                onClick={() => handleToggleTeacherMode(false)}
                className="text-xs underline font-bold cursor-pointer hover:opacity-80"
              >
                Về học sinh
              </button>
            </div>

            {/* Error Message Box */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-500 space-y-1 animate-scale-up">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Thông báo đăng nhập:</span>
                </div>
                <p className="text-main leading-relaxed pl-5 font-medium">{errorMsg}</p>
              </div>
            )}

            {/* Teacher Google Authentication Center */}
            <div className="space-y-4 py-4 flex flex-col items-center justify-center">
              <div className="text-center space-y-1">
                <div className="text-sm font-bold text-main">
                  Xác thực Giáo viên chủ nhiệm
                </div>
                <p className="text-xs text-muted max-w-sm">
                  Nhấn vào nút bên dưới để đăng nhập bằng tài khoản Google:
                </p>
              </div>

              {/* Official Google GSI Button Container (No redirect URI mismatch, fully authorized) */}
              <div 
                ref={googleBtnContainerRef} 
                className="min-h-[46px] flex items-center justify-center w-full"
              >
                <div className="flex items-center gap-2 text-xs text-muted py-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-accent border-t-transparent" />
                  <span>Đang tải nút xác thực Google...</span>
                </div>
              </div>

              {isGoogleLoading && (
                <div className="flex items-center gap-2 text-xs font-semibold text-accent animate-pulse">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-accent border-t-transparent" />
                  <span>Đang xác thực thông tin tài khoản...</span>
                </div>
              )}
            </div>

            {/* Remember Login for Teacher */}
            <div className="flex items-center gap-2 pt-1 border-t border-token">
              <input
                type="checkbox"
                id="remember-login-teacher"
                checked={rememberLogin}
                onChange={e => setRememberLogin(e.target.checked)}
                className="rounded border-token text-accent focus:ring-accent cursor-pointer"
              />
              <label htmlFor="remember-login-teacher" className="text-xs text-main cursor-pointer select-none font-bold">
                Ghi nhớ đăng nhập trên thiết bị này
              </label>
            </div>
          </div>
        ) : (
          /* Step 2: Student & Cadre Login */
          <div className="space-y-4">
            {/* Selected Student Banner (Guaranteed Name Visibility - No avatar before login) */}
            {selectedStudent ? (
              <div className="p-3.5 rounded-2xl bg-surface-2 border-2 border-accent/40 flex items-center justify-between gap-3 animate-scale-up">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-accent text-on-accent font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs">
                    #{selectedStudent.viTriGhe}
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
                          ({selectedStudent.vaiTro[0] === 'LT' ? '⭐ Lớp trưởng' :
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
                  className="px-2.5 py-1.5 rounded-xl border border-token text-xs font-semibold text-muted hover:text-main hover:bg-surface transition-colors cursor-pointer shrink-0"
                >
                  Chọn lại
                </button>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-surface-2 border border-token text-xs text-muted text-center flex items-center justify-center gap-2">
                <span>👉 Chọn chỗ ngồi hoặc tên học sinh bên dưới để đăng nhập:</span>
              </div>
            )}

            {/* Student Picker: Compact mode before login (No avatars shown) */}
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
                initialDisplayMode="compact"
              />
            </div>

            {/* Password input */}
            <form onSubmit={handleStudentSubmit} className="space-y-3 pt-1 border-t border-token">
              <div>
                <label className="block text-xs font-semibold text-main mb-1">
                  {selectedStudent ? `Nhập mật khẩu cho [${selectedStudent.hoTen}]:` : 'Nhập mật khẩu:'}
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
              <div className="flex items-center gap-2 pt-0.5">
                <input
                  type="checkbox"
                  id="remember-login-student"
                  checked={rememberLogin}
                  onChange={e => setRememberLogin(e.target.checked)}
                  className="rounded border-token text-accent focus:ring-accent cursor-pointer"
                />
                <label htmlFor="remember-login-student" className="text-xs text-main cursor-pointer select-none font-bold">
                  Ghi nhớ đăng nhập trên thiết bị này
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
                onClick={() => handleToggleTeacherMode(true)}
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
