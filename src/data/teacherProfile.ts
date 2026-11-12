export interface TeacherProfile {
  hoTen: string;
  statusText: string;
  email?: string;
  phone?: string;
  school?: string;
  isCustomName?: boolean;
}

const STORAGE_KEY_TEACHER_PROFILE = 'app_teacher_profile_10a5';

export const DEFAULT_TEACHER_PROFILE: TeacherProfile = {
  hoTen: 'Giáo viên chủ nhiệm',
  statusText: 'Giáo viên chủ nhiệm Lớp 10A5 • Năm học 2026-2027',
  email: 'yanghuy91@gmail.com',
  school: 'THPT Số 2 Đức Phổ',
};

export function sanitizeTeacherName(rawName?: string, isCustomName?: boolean): string {
  const trimmed = String(rawName || '').trim();
  if (!trimmed) return 'Giáo viên chủ nhiệm';
  if (
    !isCustomName &&
    (trimmed === 'Thầy Dương Văn Huy' ||
      trimmed === 'Thầy Dương Văn Huy (GVCN)' ||
      trimmed === 'Dương Văn Huy')
  ) {
    return 'Giáo viên chủ nhiệm';
  }
  return trimmed;
}

/**
 * Get saved teacher profile or default
 */
export function getTeacherProfile(): TeacherProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TEACHER_PROFILE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const cleanName = sanitizeTeacherName(parsed.hoTen, parsed.isCustomName);
        return {
          ...DEFAULT_TEACHER_PROFILE,
          ...parsed,
          hoTen: cleanName,
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
export function saveTeacherProfile(profile: Partial<TeacherProfile>, explicitCustom = false): TeacherProfile {
  const current = getTeacherProfile();
  const isCustomName = explicitCustom ? true : (profile.isCustomName ?? current.isCustomName);
  const updated: TeacherProfile = {
    ...current,
    ...profile,
    isCustomName,
    hoTen: sanitizeTeacherName(profile.hoTen ?? current.hoTen, isCustomName),
  };
  try {
    localStorage.setItem(STORAGE_KEY_TEACHER_PROFILE, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving teacher profile:', e);
  }
  return updated;
}
