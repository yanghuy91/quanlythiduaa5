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

let syncTimeout: any = null;
let lastSyncTimestamp = 0;

/**
 * Fetch state: Prioritizes Cloud Firestore, falls back to /api/state or null
 */
export async function fetchServerState(): Promise<ClassroomFullState | null> {
  // 1. Try Cloud Firestore first
  try {
    const cloudState = await fetchCloudClassState();
    if (cloudState && Array.isArray(cloudState.students) && cloudState.students.length > 0) {
      lastSyncTimestamp = Date.now();
      return cloudState;
    }
  } catch (err) {
    console.warn('[StorageSync] Không thể kết nối Cloud Firestore, kiểm tra máy chủ nội bộ:', err);
  }

  // 2. Fall back to local endpoint /api/state
  try {
    const res = await fetch('/api/state', {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.initialized === false) return null;
    return data as ClassroomFullState;
  } catch (err) {
    console.warn('[StorageSync] Không thể kết nối máy chủ nội bộ:', err);
    return null;
  }
}

/**
 * Save state: Saves to Cloud Firestore AND local /api/state
 */
export async function saveServerState(state: ClassroomFullState): Promise<boolean> {
  let cloudSuccess = false;

  // 1. Save to Cloud Firestore
  try {
    cloudSuccess = await saveCloudClassState(state);
    if (cloudSuccess) {
      lastSyncTimestamp = Date.now();
    }
  } catch (err) {
    console.warn('[StorageSync] Lưu Cloud Firestore thất bại:', err);
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
 * Debounced sync to Cloud & local server
 */
export function scheduleServerSync(state: ClassroomFullState): void {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }
  syncTimeout = setTimeout(() => {
    saveServerState(state);
  }, 600);
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
