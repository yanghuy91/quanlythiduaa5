import { Student, RoleCode } from '../types';

const STORAGE_KEY_PASSWORDS = 'app_student_passwords_10a5_v1';
const STORAGE_KEY_SESSION_LOCAL = 'app_session_10a5_local';
const STORAGE_KEY_SESSION_SESSION = 'app_session_10a5_session';
const DEFAULT_STUDENT_PASSWORD = '123456';

export interface AuthSession {
  user: Student | { hoTen: string; vaiTro: RoleCode[] };
  role: RoleCode;
  remember: boolean;
  loginTime: string;
}

/**
 * Get map of custom passwords for students from localStorage.
 */
export function getAllStudentPasswords(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PASSWORDS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading student passwords:', e);
  }
  return {};
}

/**
 * Get password for a specific student. Defaults to '123456'.
 */
export function getStudentPassword(maHS: string): string {
  const all = getAllStudentPasswords();
  return all[maHS] || DEFAULT_STUDENT_PASSWORD;
}

/**
 * Verify student's password against stored password or default '123456'.
 */
export function verifyStudentPassword(maHS: string, inputPass: string): boolean {
  const currentPass = getStudentPassword(maHS);
  return inputPass.trim() === currentPass.trim();
}

/**
 * Update student's password. Returns { success: boolean; message: string }.
 */
export function changeStudentPassword(
  maHS: string,
  oldPass: string,
  newPass: string,
  confirmPass: string
): { success: boolean; message: string } {
  // Validate input
  if (!oldPass || !newPass || !confirmPass) {
    return { success: false, message: 'Vui lòng điền đầy đủ các trường thông tin.' };
  }

  if (newPass.length < 6) {
    return { success: false, message: 'Mật khẩu mới phải có tối thiểu 6 ký tự.' };
  }

  if (newPass !== confirmPass) {
    return { success: false, message: 'Mật khẩu mới và xác nhận mật khẩu không khớp nhau.' };
  }

  // Verify old password
  if (!verifyStudentPassword(maHS, oldPass)) {
    return { success: false, message: 'Mật khẩu hiện tại không chính xác (Mặc định: 123456).' };
  }

  if (newPass === oldPass) {
    return { success: false, message: 'Mật khẩu mới không được trùng với mật khẩu cũ.' };
  }

  try {
    const all = getAllStudentPasswords();
    all[maHS] = newPass;
    localStorage.setItem(STORAGE_KEY_PASSWORDS, JSON.stringify(all));
    return { success: true, message: 'Đổi mật khẩu thành công! Vui lòng ghi nhớ mật khẩu mới.' };
  } catch (e) {
    console.error('Error saving new password:', e);
    return { success: false, message: 'Có lỗi xảy ra khi lưu mật khẩu. Vui lòng thử lại.' };
  }
}

/**
 * Save user session (Remember for next time vs Single session)
 */
export function saveAuthSession(
  user: Student | { hoTen: string; vaiTro: RoleCode[] },
  role: RoleCode,
  remember: boolean
): void {
  const sessionData: AuthSession = {
    user,
    role,
    remember,
    loginTime: new Date().toISOString(),
  };

  try {
    if (remember) {
      localStorage.setItem(STORAGE_KEY_SESSION_LOCAL, JSON.stringify(sessionData));
      sessionStorage.removeItem(STORAGE_KEY_SESSION_SESSION);
    } else {
      sessionStorage.setItem(STORAGE_KEY_SESSION_SESSION, JSON.stringify(sessionData));
      localStorage.removeItem(STORAGE_KEY_SESSION_LOCAL);
    }
  } catch (e) {
    console.error('Error saving session:', e);
  }
}

/**
 * Retrieve saved user session from localStorage (if remembered) or sessionStorage
 */
export function getSavedAuthSession(): AuthSession | null {
  try {
    // 1. Check persistent localStorage first
    const localRaw = localStorage.getItem(STORAGE_KEY_SESSION_LOCAL);
    if (localRaw) {
      const parsed = JSON.parse(localRaw);
      if (parsed && parsed.user && parsed.role) {
        return parsed;
      }
    }

    // 2. Check tab-scoped sessionStorage
    const sessionRaw = sessionStorage.getItem(STORAGE_KEY_SESSION_SESSION);
    if (sessionRaw) {
      const parsed = JSON.parse(sessionRaw);
      if (parsed && parsed.user && parsed.role) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading session:', e);
  }
  return null;
}

/**
 * Clear all authentication session stores upon logout
 */
export function clearAuthSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_SESSION_LOCAL);
    sessionStorage.removeItem(STORAGE_KEY_SESSION_SESSION);
  } catch (e) {
    console.error('Error clearing session:', e);
  }
}
