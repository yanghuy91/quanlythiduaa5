import { ref as rtdbRef, onValue as rtdbOnValue } from 'firebase/database';
import { rtdb } from '../services/firebase';

let serverTimeOffsetMs = 0;
let isOffsetSubscribed = false;
const offsetListeners = new Set<(offsetMs: number) => void>();

/**
 * Kết nối với đồng hồ thời gian thực của máy chủ Firebase Realtime Database (.info/serverTimeOffset)
 */
export function initRealtimeClockSync(onSync?: (nowMs: number) => void): () => void {
  if (!isOffsetSubscribed) {
    isOffsetSubscribed = true;
    try {
      const offsetRef = rtdbRef(rtdb, '.info/serverTimeOffset');
      rtdbOnValue(offsetRef, (snap) => {
        const val = snap.val();
        if (typeof val === 'number' && !Number.isNaN(val)) {
          serverTimeOffsetMs = val;
          offsetListeners.forEach(cb => cb(serverTimeOffsetMs));
        }
      });
    } catch (err) {
      console.warn('[RealtimeClock] Fallback to device clock:', err);
    }
  }

  if (onSync) {
    const listener = (offset: number) => onSync(Date.now() + offset);
    offsetListeners.add(listener);
    return () => {
      offsetListeners.delete(listener);
    };
  }
  return () => {};
}

/**
 * Lấy thời gian thực chính xác (ms) đã đồng bộ với máy chủ đám mây
 */
export function getRealtimeNowMs(): number {
  return Date.now() + serverTimeOffsetMs;
}

/**
 * Chuyển timestamp sang thông tin ngày theo múi giờ Việt Nam (Asia/Ho_Chi_Minh - GMT+7)
 */
export function getVietnamDateInfo(timestampMs: number = getRealtimeNowMs()): {
  year: number;
  month: number;
  day: number;
  dayOfWeek: number; // 0 = CN, 1 = Thứ 2, ..., 6 = Thứ 7
  dateStr: string; // YYYY-MM-DD
  displayDateStr: string; // DD/MM/YYYY
  weekdayLabel: string;
} {
  // Chuyển sang giờ Việt Nam chuẩn UTC+7
  const vnTimeMs = timestampMs + 7 * 60 * 60 * 1000;
  const vnDate = new Date(vnTimeMs);

  const year = vnDate.getUTCFullYear();
  const month = vnDate.getUTCMonth() + 1;
  const day = vnDate.getUTCDate();
  const dayOfWeek = vnDate.getUTCDay();

  const yyyy = String(year);
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');

  const weekdays = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

  return {
    year,
    month,
    day,
    dayOfWeek,
    dateStr: `${yyyy}-${mm}-${dd}`,
    displayDateStr: `${dd}/${mm}/${yyyy}`,
    weekdayLabel: weekdays[dayOfWeek] || '',
  };
}

/**
 * Tìm ngày Thứ 2 đầu tuần (YYYY-MM-DD) của một thời điểm theo múi giờ Việt Nam (GMT+7)
 */
export function getVietnamMondayDateStr(timestampMs: number = getRealtimeNowMs()): string {
  const info = getVietnamDateInfo(timestampMs);
  const utcMidnight = Date.UTC(info.year, info.month - 1, info.day);
  // Nếu Chủ nhật (0) thì lùi 6 ngày về Thứ 2; các thứ khác lùi (dayOfWeek - 1) ngày
  const diffDaysToMonday = info.dayOfWeek === 0 ? -6 : 1 - info.dayOfWeek;
  const mondayUtcMs = utcMidnight + diffDaysToMonday * 24 * 60 * 60 * 1000;
  const mondayDate = new Date(mondayUtcMs);

  const y = mondayDate.getUTCFullYear();
  const m = String(mondayDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(mondayDate.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Lấy ngày Thứ 2 của tuần kế tiếp (hiển thị DD/MM/YYYY) để báo cho Giáo viên
 */
export function getNextVietnamMondayDisplayStr(timestampMs: number = getRealtimeNowMs()): string {
  const mondayStr = getVietnamMondayDateStr(timestampMs);
  const [y, m, d] = mondayStr.split('-').map(Number);
  const nextMondayMs = Date.UTC(y, m - 1, d) + 7 * 24 * 60 * 60 * 1000;
  const nextMonday = new Date(nextMondayMs);
  const dd = String(nextMonday.getUTCDate()).padStart(2, '0');
  const mm = String(nextMonday.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = nextMonday.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Tính số tuần (số ngày Thứ 2) đã trôi qua giữa ngày Thứ 2 gốc và ngày Thứ 2 hiện tại
 */
export function calculateMondaysElapsed(anchorMondayStr?: string, currentMondayStr: string = getVietnamMondayDateStr()): number {
  if (!anchorMondayStr || !/^\d{4}-\d{2}-\d{2}$/.test(anchorMondayStr)) return 0;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(currentMondayStr)) return 0;

  const [ay, am, ad] = anchorMondayStr.split('-').map(Number);
  const [cy, cm, cd] = currentMondayStr.split('-').map(Number);

  const anchorMs = Date.UTC(ay, am - 1, ad);
  const currentMs = Date.UTC(cy, cm - 1, cd);

  const diffMs = currentMs - anchorMs;
  if (diffMs <= 0) return 0;

  return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
}
