import { 
  Student, 
  DisciplineRecord, 
  AcademicRecord, 
  ClassSettings, 
  SeatLayoutNode, 
  ViolationRule 
} from '../types';

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
 * Fetch state from the server endpoint /api/state
 * Returns null if server has not initialized a state or if network fails.
 */
export async function fetchServerState(): Promise<ClassroomFullState | null> {
  try {
    const res = await fetch('/api/state', {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.initialized === false) return null;
    return data as ClassroomFullState;
  } catch (err) {
    console.warn('[StorageSync] Không thể kết nối máy chủ, chuyển sang bộ nhớ cục bộ:', err);
    return null;
  }
}

/**
 * Direct POST state to the server endpoint /api/state
 */
export async function saveServerState(state: ClassroomFullState): Promise<boolean> {
  try {
    const res = await fetch('/api/state', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(state),
    });
    if (res.ok) {
      lastSyncTimestamp = Date.now();
      return true;
    }
    return false;
  } catch (err) {
    console.warn('[StorageSync] Lưu máy chủ thất bại:', err);
    return false;
  }
}

/**
 * Debounced sync to server (waits 600ms of inactivity before firing POST)
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
  URL.revokeObjectURL(url);
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
