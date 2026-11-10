import { DisciplineRecord, StudentWeekSummary, TeacherSettings, WeekEvaluation, StatusColorLevel } from '../types';

export function calculateStudentWeekSummary(
  maHS: string,
  hoTen: string,
  to: number,
  tuanHoc: number,
  records: DisciplineRecord[],
  settings: TeacherSettings
): StudentWeekSummary {
  // Lọc bản ghi của học sinh trong tuần
  const studentRecords = records.filter(r => 
    r.maHS === maHS &&
    r.tuanHoc === tuanHoc &&
    r.trangThai !== 'DaHuy' &&
    r.trangThai !== 'DaChapNhan' // Bản ghi đã chấp nhận giải trình thì không tính điểm
  );

  let tongDiemTru = 0;
  let tongDiemCong = 0;
  let coLoiNang = false;

  studentRecords.forEach(rec => {
    if (rec.loaiDiem === 'Tru') {
      tongDiemTru += rec.diemSo;
      if (rec.mucDo === 'Nang') {
        coLoiNang = true;
      }
    } else if (rec.loaiDiem === 'Cong' && settings.batDiemCong) {
      tongDiemCong += rec.diemSo;
    }
  });

  const diemHienTai = settings.diemKhoiDau - tongDiemTru + tongDiemCong;

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
    tuanHoc,
    diemKhoiDau: settings.diemKhoiDau,
    tongDiemTru,
    tongDiemCong,
    diemHienTai,
    xepLoai,
    mucMau,
    soLoiTrongTuan: studentRecords.length,
    coLoiNang
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

