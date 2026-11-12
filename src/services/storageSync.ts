import { 
  Student, 
  DisciplineRecord, 
  AcademicRecord, 
  ClassSettings, 
  SeatLayoutNode, 
  ViolationRule,
  MailMessage
} from '../types';
import { fetchCloudClassState, saveCloudClassState } from './firebase';

export interface ClassroomFullState {
  students: Student[];
  records: DisciplineRecord[];
  academicRecords: AcademicRecord[];
  settings: ClassSettings;
  layout: SeatLayoutNode[];
  rules: ViolationRule[];
  teacherAvatar: string;
  teacherProfile?: any;
  currentWeek?: number;
  studentBadgesMap?: Record<string, string[]>;
  studentActiveBadges?: Record<string, string>;
  badgeCatalog?: any[];
  studentPasswords?: Record<string, string>;
  teacherPassword?: string;
  mailMessages?: MailMessage[];
  updatedAt: string;
  version: number;
}

let syncTimeout: ReturnType<typeof setTimeout> | null = null;
let lastSyncTimestamp = 0;
let lastSyncedFingerprint = '';
let cloudHydrated = false;

/**
 * Check whether initial data from Firebase Realtime Database has been loaded.
 * While false, automatic background saves are locked to prevent overwriting cloud data.
 */
export function isCloudHydrated(): boolean {
  return cloudHydrated;
}

/**
 * Compute deterministic content fingerprint (ignoring volatile updatedAt & version fields)
 * so we only write to Cloud when classroom data has genuinely changed.
 */
export function computeStateFingerprint(state: ClassroomFullState): string {
  try {
    return JSON.stringify({
      students: state.students,
      records: state.records,
      academicRecords: state.academicRecords,
      settings: state.settings,
      layout: state.layout,
      rules: state.rules,
      teacherAvatar: state.teacherAvatar,
      teacherProfile: state.teacherProfile,
      currentWeek: state.currentWeek,
      studentBadgesMap: state.studentBadgesMap || {},
      studentActiveBadges: state.studentActiveBadges || {},
      badgeCatalog: state.badgeCatalog,
      studentPasswords: state.studentPasswords || {},
      teacherPassword: state.teacherPassword,
      mailMessages: state.mailMessages || [],
    });
  } catch {
    return '';
  }
}

/**
 * Check if an incoming remote state differs from the last applied/synced fingerprint
 */
export function hasRemoteStateChanged(state: ClassroomFullState): boolean {
  const fp = computeStateFingerprint(state);
  if (!fp) return false;
  return fp !== lastSyncedFingerprint;
}

/**
 * Record the fingerprint of a remote state update from Firebase and unlock cloud sync
 */
export function markRemoteStateApplied(state: ClassroomFullState): void {
  const fp = computeStateFingerprint(state);
  if (fp) {
    lastSyncedFingerprint = fp;
  }
  cloudHydrated = true;
}

/**
 * Fetch state strictly from Firebase Realtime Database.
 * Does NOT fall back to static project files (/api/state) so repository mock data never overwrites real data.
 */
export async function fetchServerState(): Promise<ClassroomFullState | null> {
  try {
    const cloudState = await fetchCloudClassState();
    if (cloudState && Array.isArray(cloudState.students) && cloudState.students.length > 0) {
      lastSyncTimestamp = Date.now();
      markRemoteStateApplied(cloudState);
      return cloudState;
    }
  } catch (err) {
    console.warn('[StorageSync] Không thể kết nối Firebase Realtime Database:', err);
  }

  return null;
}

/**
 * Save state strictly to Firebase Realtime Database.
 * Blocked if cloudHydrated is false (unless force=true from an explicit teacher import/restore action).
 */
export async function saveServerState(state: ClassroomFullState, force: boolean = false): Promise<boolean> {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
    syncTimeout = null;
  }

  // Protect Firebase data: never overwrite Cloud before initial Firebase hydration completes
  if (!cloudHydrated && !force) {
    console.info('[StorageSync] Đã chặn lệnh ghi sớm vì chưa tải xong dữ liệu gốc từ Firebase.');
    return false;
  }

  const currentFingerprint = computeStateFingerprint(state);
  if (!force && currentFingerprint && currentFingerprint === lastSyncedFingerprint) {
    return true;
  }

  try {
    const cloudSuccess = await saveCloudClassState(state);
    if (cloudSuccess) {
      cloudHydrated = true;
      lastSyncTimestamp = Date.now();
      if (currentFingerprint) {
        lastSyncedFingerprint = currentFingerprint;
      }
    }
    return cloudSuccess;
  } catch (err) {
    console.warn('[StorageSync] Lưu Firebase Realtime Database thất bại:', err);
    return false;
  }
}

/**
 * Debounced sync to Firebase Realtime Database (1500ms coalescing window + hydration lock + diff check)
 */
export function scheduleServerSync(state: ClassroomFullState): void {
  if (!cloudHydrated) {
    return;
  }

  const candidateFingerprint = computeStateFingerprint(state);
  if (candidateFingerprint && candidateFingerprint === lastSyncedFingerprint) {
    return;
  }

  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }
  syncTimeout = setTimeout(() => {
    syncTimeout = null;
    saveServerState(state);
  }, 1500);
}

/**
 * Get timestamp of last successful sync
 */
export function getLastSyncTime(): number {
  return lastSyncTimestamp;
}

/**
 * Download classroom state as a JSON backup file
 */
export function downloadStateAsJson(state: ClassroomFullState, filename = 'lop10a5_du_lieu_dong_bo.json'): void {
  const jsonStr = JSON.stringify(state, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Parse uploaded JSON file and validate structure
 */
export function parseImportedJsonState(jsonString: string): ClassroomFullState | null {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || !Array.isArray(parsed.students) || !Array.isArray(parsed.records)) {
      throw new Error('Dữ liệu JSON không đúng định dạng Lớp 10A5');
    }
    return parsed as ClassroomFullState;
  } catch (e) {
    console.error('[StorageSync] Lỗi phân tích file JSON:', e);
    return null;
  }
}
