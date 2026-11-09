export interface TeacherProfile {
  hoTen: string;
  statusText: string;
  email?: string;
  phone?: string;
  school?: string;
}

const STORAGE_KEY_TEACHER_PROFILE = 'app_teacher_profile_10a5';

export const DEFAULT_TEACHER_PROFILE: TeacherProfile = {
  hoTen: 'Thầy Dương Văn Huy',
  statusText: 'Giáo viên chủ nhiệm Lớp 10A5 • Năm học 2026-2027',
  email: 'yanghuy91@gmail.com',
  school: 'THPT Số 2 Đức Phổ',
};

/**
 * Get saved teacher profile or default
 */
export function getTeacherProfile(): TeacherProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TEACHER_PROFILE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.hoTen) {
        return {
          ...DEFAULT_TEACHER_PROFILE,
          ...parsed,
        };
      }
    }
  } catch (e) {
    console.error('Error reading teacher profile:', e);
  }
  return DEFAULT_TEACHER_PROFILE;
}

/**
 * Save updated teacher profile
 */
export function saveTeacherProfile(profile: Partial<TeacherProfile>): TeacherProfile {
  const current = getTeacherProfile();
  const updated: TeacherProfile = {
    ...current,
    ...profile,
  };
  try {
    localStorage.setItem(STORAGE_KEY_TEACHER_PROFILE, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving teacher profile:', e);
  }
  return updated;
}
