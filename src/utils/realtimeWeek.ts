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

export interface VietnamWeekdayItem {
  dayIndex: number; // 0 = Thứ 2, 1 = Thứ 3, ..., 6 = Chủ nhật
  label: string; // 'Thứ 2', 'Thứ 3', ...
  shortLabel: string; // 'T2', 'T3', ...
  offsetDays: number; // 0..6
}

export const VIETNAM_WEEKDAYS: readonly VietnamWeekdayItem[] = [
  { dayIndex: 0, label: 'Thứ 2', shortLabel: 'T2', offsetDays: 0 },
  { dayIndex: 1, label: 'Thứ 3', shortLabel: 'T3', offsetDays: 1 },
  { dayIndex: 2, label: 'Thứ 4', shortLabel: 'T4', offsetDays: 2 },
  { dayIndex: 3, label: 'Thứ 5', shortLabel: 'T5', offsetDays: 3 },
  { dayIndex: 4, label: 'Thứ 6', shortLabel: 'T6', offsetDays: 4 },
  { dayIndex: 5, label: 'Thứ 7', shortLabel: 'T7', offsetDays: 5 },
  { dayIndex: 6, label: 'Chủ nhật', shortLabel: 'CN', offsetDays: 6 },
] as const;

/**
 * Xác định buổi học hiện tại theo múi giờ Việt Nam (UTC+7)
 * < 12:00 -> 'Sang', >= 12:00 -> 'Chieu'
 */
export function getVietnamCurrentSession(timestampMs: number = getRealtimeNowMs()): 'Sang' | 'Chieu' {
  const vnTimeMs = timestampMs + 7 * 60 * 60 * 1000;
  const vnDate = new Date(vnTimeMs);
  const hour = vnDate.getUTCHours();
  return hour < 12 ? 'Sang' : 'Chieu';
}

/**
 * Tính ngày chính xác (YYYY-MM-DD, DD/MM/YYYY) từ (Tuần, Thứ trong tuần) dựa vào tuần hiện tại và mốc Thứ 2 chuẩn
 */
export function getDateFromWeekAndDayIndex(
  week: number,
  dayIndex: number, // 0 = Thứ 2, ..., 6 = Chủ nhật
  currentRealtimeWeek: number,
  anchorMondayStr: string = getVietnamMondayDateStr()
): { dateStr: string; displayDateStr: string; weekdayLabel: string } {
  if (!anchorMondayStr || !/^\d{4}-\d{2}-\d{2}$/.test(anchorMondayStr)) {
    anchorMondayStr = getVietnamMondayDateStr();
  }

  const [cy, cm, cd] = anchorMondayStr.split('-').map(Number);
  const currentMondayMs = Date.UTC(cy, cm - 1, cd);

  // Chênh lệch tuần so với tuần chuẩn hiện tại
  const diffWeeks = Number(week) - Number(currentRealtimeWeek);
  const safeDayIndex = Math.max(0, Math.min(6, Number(dayIndex) || 0));

  const targetMs = currentMondayMs + (diffWeeks * 7 + safeDayIndex) * 24 * 60 * 60 * 1000;
  const targetDate = new Date(targetMs);

  const y = targetDate.getUTCFullYear();
  const m = String(targetDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(targetDate.getUTCDate()).padStart(2, '0');

  const weekday = VIETNAM_WEEKDAYS[safeDayIndex] || VIETNAM_WEEKDAYS[0];

  return {
    dateStr: `${y}-${m}-${d}`,
    displayDateStr: `${d}/${m}/${y}`,
    weekdayLabel: weekday.label,
  };
}

/**
 * Lấy dayIndex (0 = Thứ 2, ..., 6 = Chủ nhật) từ chuỗi ngày YYYY-MM-DD
 */
export function getDayIndexFromDate(dateStr: string): number {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return 0;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(Date.UTC(y, m - 1, d));
  const dow = dateObj.getUTCDay(); // 0 = Sunday, 1 = Monday, ...
  return dow === 0 ? 6 : dow - 1;
}

/**
 * Kiểm tra xem thời điểm (Tuần, Thứ, Buổi) có thuộc về tương lai (chưa tới) hay không
 * Dùng để giới hạn Ban cán sự: không cho phép ghi nhận vi phạm cho thời gian trong tương lai!
 */
export function isTimeInFuture(
  week: number,
  dayIndex: number, // 0 = Thứ 2, ..., 6 = Chủ nhật
  session: 'Sang' | 'Chieu',
  currentRealtimeWeek: number,
  nowMs: number = getRealtimeNowMs()
): boolean {
  const w = Number(week);
  const crw = Number(currentRealtimeWeek);

  // 1. Tuần lớn hơn tuần hiện tại -> Chắc chắn là tương lai
  if (w > crw) return true;
  // 2. Tuần nhỏ hơn tuần hiện tại -> Chắc chắn là quá khứ
  if (w < crw) return false;

  // 3. Đúng tuần hiện tại: so sánh Thứ với ngày hôm nay
  const todayInfo = getVietnamDateInfo(nowMs);
  const todayDayIndex = todayInfo.dayOfWeek === 0 ? 6 : todayInfo.dayOfWeek - 1;
  const dIdx = Math.max(0, Math.min(6, Number(dayIndex) || 0));

  if (dIdx > todayDayIndex) return true; // Thứ sau ngày hôm nay -> Chưa tới!
  if (dIdx < todayDayIndex) return false; // Thứ trước ngày hôm nay -> Đã qua

  // 4. Đúng ngày hôm nay: so sánh Buổi học
  const currentSession = getVietnamCurrentSession(nowMs);
  // Nếu hiện tại đang là buổi Sáng mà người dùng chọn buổi Chiều -> Chưa tới!
  if (currentSession === 'Sang' && session === 'Chieu') {
    return true;
  }

  return false;
}

/**
 * Lấy toàn bộ thông tin phân cấp thời gian chuẩn hiện tại (HK, Tuần, Thứ, Buổi, Ngày thực tế)
 */
export function getCurrentRealtimeTimeHierarchy(
  currentRealtimeWeek: number,
  nowMs: number = getRealtimeNowMs()
): {
  hocKi: 1 | 2;
  tuanHoc: number;
  dayIndex: number;
  weekdayLabel: string;
  buoi: 'Sang' | 'Chieu';
  dateStr: string;
  displayDateStr: string;
  realtimeDateLabel: string;
} {
  const info = getVietnamDateInfo(nowMs);
  const dayIndex = info.dayOfWeek === 0 ? 6 : info.dayOfWeek - 1;
  const buoi = getVietnamCurrentSession(nowMs);
  const hocKi: 1 | 2 = currentRealtimeWeek <= 19 ? 1 : 2;

  return {
    hocKi,
    tuanHoc: currentRealtimeWeek,
    dayIndex,
    weekdayLabel: info.weekdayLabel,
    buoi,
    dateStr: info.dateStr,
    displayDateStr: info.displayDateStr,
    realtimeDateLabel: `${info.weekdayLabel}, ngày ${info.displayDateStr}`,
  };
}
