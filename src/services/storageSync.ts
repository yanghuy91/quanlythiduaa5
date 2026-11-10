import { 
  Student, 
  DisciplineRecord, 
  AcademicRecord, 
  ClassSettings, 
  SeatLayoutNode, 
  ViolationRule 
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
  studentBadgesMap?: Record<string, string[]>;
  studentActiveBadges?: Record<string, string>;
  updatedAt: string;
  version: number;
}

let syncTimeout: ReturnType<typeof setTimeout> | null = null;
let lastSyncTimestamp = 0;
let lastSyncedFingerprint = '';

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
      studentBadgesMap: state.studentBadgesMap,
      studentActiveBadges: state.studentActiveBadges,
    });
  } catch {
    return '';
  }
}

/**
 * Record the fingerprint of a remote state update so we don't echo-save it back to Cloud
 */
export function markRemoteStateApplied(state: ClassroomFullState): void {
  const fp = computeStateFingerprint(state);
  if (fp) {
    lastSyncedFingerprint = fp;
  }
}

/**
 * Fetch state: Prioritizes Firebase Realtime Database, falls back to /api/state or null
 */
export async function fetchServerState(): Promise<ClassroomFullState | null> {
  // 1. Try Firebase Realtime Database first
  try {
    const cloudState = await fetchCloudClassState();
    if (cloudState && Array.isArray(cloudState.students) && cloudState.students.length > 0) {
      lastSyncTimestamp = Date.now();
      markRemoteStateApplied(cloudState);
      return cloudState;
    }
  } catch (err) {
    console.warn('[StorageSync] Không thể kết nối Realtime Database, kiểm tra máy chủ nội bộ:', err);
  }

  // 2. Fall back to local endpoint /api/state
  try {
    const res = await fetch('/api/state', {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.initialized === false) return null;
    const parsed = data as ClassroomFullState;
    markRemoteStateApplied(parsed);
    return parsed;
  } catch (err) {
    console.warn('[StorageSync] Không thể kết nối máy chủ nội bộ:', err);
    return null;
  }
}

/**
 * Save state: Saves to Firebase Realtime Database AND local /api/state
 * Skips redundant network writes if content fingerprint is identical unless force=true.
 */
export async function saveServerState(state: ClassroomFullState, force: boolean = false): Promise<boolean> {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
    syncTimeout = null;
  }

  const currentFingerprint = computeStateFingerprint(state);
  if (!force && currentFingerprint && currentFingerprint === lastSyncedFingerprint) {
    return true;
  }

  let cloudSuccess = false;

  // 1. Save to Firebase Realtime Database
  try {
    cloudSuccess = await saveCloudClassState(state);
    if (cloudSuccess) {
      lastSyncTimestamp = Date.now();
      if (currentFingerprint) {
        lastSyncedFingerprint = currentFingerprint;
      }
    }
  } catch (err) {
    console.warn('[StorageSync] Lưu Realtime Database thất bại:', err);
  }

  // 2. Save to local /api/state if available
  try {
    await fetch('/api/state', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(state),
    });
  } catch (err) {
    // Ignore local api errors when running in production
  }

  return cloudSuccess;
}

/**
 * Debounced sync to Cloud & local server (1500ms coalescing window + diff check)
 */
export function scheduleServerSync(state: ClassroomFullState): void {
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
