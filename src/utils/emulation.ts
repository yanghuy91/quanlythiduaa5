import { DisciplineRecord, StudentWeekSummary, TeacherSettings, WeekEvaluation, StatusColorLevel } from '../types';

export function normalizeStudentName(name?: string): string {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function isRecordMatchingStudent(
  rec: DisciplineRecord,
  maHS: string,
  hoTen?: string
): boolean {
  if (!rec) return false;
  if (rec.maHS && maHS && String(rec.maHS).trim().toLowerCase() === String(maHS).trim().toLowerCase()) {
    return true;
  }
  if (hoTen && rec.hoTen) {
    const normStudent = normalizeStudentName(hoTen);
    const normRec = normalizeStudentName(rec.hoTen);
    if (normStudent && normRec && normStudent === normRec) {
      return true;
    }
  }
  return false;
}

export function parseRecordPoints(rec: DisciplineRecord): { isBonus: boolean; points: number } {
  const rawScore = Number(rec.diemSo);
  const absPoints = Number.isFinite(rawScore) ? Math.abs(rawScore) : 0;
  const rawType = String(rec.loaiDiem || '').trim().toLowerCase();

  const isBonus =
    rawType === 'cong' ||
    rawType === 'cộng' ||
    rawType === 'bonus' ||
    rawType === '+' ||
    (rawType === '' && rawScore > 0 && String(rec.maNoiQuy || '').toUpperCase().startsWith('KT'));

  return {
    isBonus,
    points: absPoints,
  };
}

export function isRecordWithinScoringMilestone(
  rec: DisciplineRecord,
  _settings?: TeacherSettings
): boolean {
  if (!rec) return false;
  // Theo quy tắc chuẩn: Chỉ các tuần GV đánh dấu nghỉ (noDataWeeks) mới không tính điểm;
  // các tuần khác đều tính điểm trừ/cộng bình thường để đồng nhất 100% giữa sổ chi tiết và bảng xếp hạng.
  return true;
}

export function formatEditTimeLimit(minutes?: number): string {
  const m = Number(minutes ?? 0);
  if (!Number.isFinite(m) || m <= 0) return 'Không giới hạn';
  if (m < 60) return `${m} phút`;
  if (m % 1440 === 0) {
    const days = m / 1440;
    return days === 1 ? '24 giờ (1 ngày)' : `${days} ngày`;
  }
  return `${Math.round((m / 60) * 10) / 10} giờ`;
}

export function isWithinEditTimeLimit(recordIsoTime?: string, limitMinutes?: number): boolean {
  const m = Number(limitMinutes ?? 0);
  if (!Number.isFinite(m) || m <= 0) return true; // <= 0 nghĩa là Không giới hạn thời gian
  if (!recordIsoTime) return true;
  const recordMs = new Date(recordIsoTime).getTime();
  if (!Number.isFinite(recordMs)) return true;
  const nowMs = Date.now();
  return nowMs <= recordMs + m * 60 * 1000;
}

export function getRemainingEditTimeLabel(recordIsoTime?: string, limitMinutes?: number): string {
  const m = Number(limitMinutes ?? 0);
  if (!Number.isFinite(m) || m <= 0) return 'Không giới hạn';
  if (!recordIsoTime) return 'Không giới hạn';
  const recordMs = new Date(recordIsoTime).getTime();
  if (!Number.isFinite(recordMs)) return 'Không giới hạn';
  const diffMs = recordMs + m * 60 * 1000 - Date.now();
  if (diffMs <= 0) return `Đã hết hạn (${formatEditTimeLimit(m)})`;
  const diffMinutes = Math.ceil(diffMs / (60 * 1000));
  if (diffMinutes < 60) return `Còn ${diffMinutes} phút`;
  const diffHours = Math.ceil(diffMs / (60 * 60 * 1000));
  if (diffHours <= 48) return `Còn ${diffHours}h`;
  const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  return `Còn ${diffDays} ngày`;
}

export function isWithinExplanationDayLimit(recordIsoTimeOrDate?: string, limitDays?: number): boolean {
  const d = Number(limitDays ?? 0);
  if (!Number.isFinite(d) || d <= 0) return true; // <= 0 nghĩa là Không giới hạn
  if (!recordIsoTimeOrDate) return true;
  const recordMs = new Date(recordIsoTimeOrDate).getTime();
  if (!Number.isFinite(recordMs)) return true;
  return Date.now() <= recordMs + d * 24 * 60 * 60 * 1000;
}

export function calculateStudentWeekSummary(
  maHS: string,
  hoTen: string,
  to: number,
  tuanHoc: number,
  records: DisciplineRecord[],
  settings: TeacherSettings,
  currentWeek?: number
): StudentWeekSummary {
  const targetWeek = Number(tuanHoc);
  const noDataWeeks = (settings.noDataWeeks || []).map(Number);
  const isFutureWeek = currentWeek !== undefined && targetWeek > Number(currentWeek);
  const isNoDataWeek = noDataWeeks.includes(targetWeek);

  if (isFutureWeek || isNoDataWeek) {
    return {
      maHS,
      hoTen,
      to,
      tuanHoc: targetWeek,
      diemKhoiDau: settings.diemKhoiDau,
      tongDiemTru: 0,
      tongDiemCong: 0,
      diemHienTai: settings.diemKhoiDau,
      xepLoai: 'Tot',
      mucMau: 'none',
      soLoiTrongTuan: 0,
      coLoiNang: false,
      chuaCoDiem: true,
      lyDoChuaCoDiem: isFutureWeek ? 'future' : 'no_data',
    };
  }

  // Lọc bản ghi của học sinh trong tuần
  const studentRecords = records.filter(r => 
    isRecordMatchingStudent(r, maHS, hoTen) &&
    Number(r.tuanHoc) === targetWeek &&
    r.trangThai !== 'DaHuy' &&
    r.trangThai !== 'DaChapNhan' // Bản ghi đã chấp nhận giải trình thì không tính điểm
  );

  let tongDiemTru = 0;
  let tongDiemCong = 0;
  let coLoiNang = false;

  studentRecords.forEach(rec => {
    const { isBonus, points } = parseRecordPoints(rec);
    if (!isBonus) {
      tongDiemTru += points;
      if (rec.mucDo === 'Nang') {
        coLoiNang = true;
      }
    } else if (settings.batDiemCong) {
      tongDiemCong += points;
    }
  });

  const diemHienTai = Math.max(0, settings.diemKhoiDau - tongDiemTru + tongDiemCong);

  // Xếp loại cá nhân
  let xepLoai: WeekEvaluation = 'ChuaDat';
  if (diemHienTai >= settings.nguongTot) {
    xepLoai = 'Tot';
  } else if (diemHienTai >= settings.nguongKha) {
    xepLoai = 'Kha';
  } else if (diemHienTai >= settings.nguongDat) {
    xepLoai = 'Dat';
  } else {
    xepLoai = 'ChuaDat';
  }

  // Mức màu trạng thái viền sơ đồ
  let mucMau: StatusColorLevel = 'none';
  if (settings.batDiemCong && tongDiemCong > tongDiemTru && tongDiemTru === 0) {
    mucMau = 'ok';
  } else if (tongDiemTru >= 10 || coLoiNang) {
    mucMau = 'bad';
  } else if (tongDiemTru > 0) {
    mucMau = 'warn';
  } else {
    mucMau = 'none';
  }

  return {
    maHS,
    hoTen,
    to,
    tuanHoc: targetWeek,
    diemKhoiDau: settings.diemKhoiDau,
    tongDiemTru,
    tongDiemCong,
    diemHienTai,
    xepLoai,
    mucMau,
    soLoiTrongTuan: studentRecords.length,
    coLoiNang,
    chuaCoDiem: false,
  };
}

export function getCurrentSession(): 'Sang' | 'Chieu' {
  const hour = new Date().getHours();
  // Buổi sáng: 06:30 -> 12:00, Buổi chiều: 12:00 -> 18:00
  return hour < 12 ? 'Sang' : 'Chieu';
}

export function checkDuplicateRecord(
  records: DisciplineRecord[],
  maHS: string,
  ngayHoc: string,
  buoi: 'Sang' | 'Chieu',
  maNoiQuy: string
): {
  isDuplicate: boolean;
  isIdentical: boolean;
  existingRecords: DisciplineRecord[];
  lanThu: number;
} {
  const existing = records.filter(
    r => r.maHS === maHS &&
         r.ngayHoc === ngayHoc &&
         r.buoi === buoi &&
         r.trangThai !== 'DaHuy'
  );

  if (existing.length === 0) {
    return {
      isDuplicate: false,
      isIdentical: false,
      existingRecords: [],
      lanThu: 1
    };
  }

  const isIdentical = existing.some(r => r.maNoiQuy === maNoiQuy);

  return {
    isDuplicate: true,
    isIdentical,
    existingRecords: existing,
    lanThu: existing.length + 1
  };
}

/**
 * Thuật toán xếp hạng thi đua chuẩn học đường (Dense Ranking - Cùng điểm thì cùng xếp hạng).
 * - Học sinh có cùng số điểm sẽ có cùng một thứ hạng (Đồng hạng).
 * - Thứ hạng tiếp theo tăng lên 1 mức (ví dụ: 100đ -> Hạng 1; 98đ -> Hạng 2; 95đ -> Hạng 3).
 * - Nếu cùng điểm: thứ tự hiển thị ưu tiên người ít bị trừ điểm hơn -> nhiều điểm cộng hơn -> thứ tự bảng chữ cái tiếng Việt.
 */
export function calculateDenseRankings<T extends { student: { hoTen: string } }>(
  items: T[],
  getScore: (item: T) => number,
  getDeductions?: (item: T) => number,
  getBonuses?: (item: T) => number
): Array<T & { officialRank: number; isTied: boolean; tieCount: number }> {
  // 1. Sắp xếp danh sách
  const sorted = [...items].sort((a, b) => {
    const scoreA = getScore(a);
    const scoreB = getScore(b);
    if (scoreB !== scoreA) return scoreB - scoreA;

    if (getDeductions) {
      const dedA = getDeductions(a);
      const dedB = getDeductions(b);
      if (dedA !== dedB) return dedA - dedB; // Ít trừ điểm hơn xếp trên
    }

    if (getBonuses) {
      const bonA = getBonuses(a);
      const bonB = getBonuses(b);
      if (bonB !== bonA) return bonB - bonA; // Nhiều điểm cộng hơn xếp trên
    }

    return a.student.hoTen.localeCompare(b.student.hoTen, 'vi');
  });

  // 2. Đếm số lượng học sinh trùng từng mức điểm
  const scoreFrequency = new Map<number, number>();
  for (const item of sorted) {
    const s = getScore(item);
    scoreFrequency.set(s, (scoreFrequency.get(s) || 0) + 1);
  }

  // 3. Gán thứ hạng: cùng điểm thì cùng xếp hạng (officialRank bằng nhau)
  let currentRank = 1;
  return sorted.map((item, idx) => {
    const currentScore = getScore(item);
    if (idx > 0) {
      const prevScore = getScore(sorted[idx - 1]);
      if (currentScore < prevScore) {
        currentRank += 1;
      }
    }
    const count = scoreFrequency.get(currentScore) || 1;
    return {
      ...item,
      officialRank: currentRank,
      isTied: count > 1,
      tieCount: count,
    };
  });
}

