import { 
  DisciplineRecord, 
  HierarchyPeriodFilter, 
  Student, 
  StudentPeriodSummary, 
  TeacherSettings, 
  TimeHierarchy, 
  WeekEvaluation, 
  StatusColorLevel 
} from '../types';
import { isRecordMatchingStudent, parseRecordPoints } from './emulation';

export const CURRENT_SCHOOL_YEAR = '2026-2027';

// Phân cấp chuẩn theo chỉ đạo: Tuần 1 -> 19 thuộc HK1, Tuần 20 -> 38 thuộc HK2
export const SEMESTER_1_WEEKS = Array.from({ length: 19 }, (_, i) => i + 1); // Tuần 1 -> 19
export const SEMESTER_2_WEEKS = Array.from({ length: 19 }, (_, i) => i + 20); // Tuần 20 -> 38
export const ALL_SCHOOL_WEEKS = Array.from({ length: 38 }, (_, i) => i + 1); // Tuần 1 -> 38

export function getSemesterFromWeek(week: number): 1 | 2 {
  return Number(week) <= 19 ? 1 : 2;
}

// Mapping weeks and semester from date (Tuần 1..19: HK1, Tuần 20..38: HK2)
export function getTimeHierarchyFromDate(dateStr: string, session: 'Sang' | 'Chieu'): TimeHierarchy {
  const d = new Date(dateStr);
  const month = d.getMonth() + 1; // 1..12
  const year = d.getFullYear();

  // School year: from Aug/Sep to May/Jun
  let namHoc = `${year}-${year + 1}`;
  if (month < 8) {
    namHoc = `${year - 1}-${year}`;
  }

  // Calculate week: Week 1..19 in HK1 (Sep -> Jan), Week 20..38 in HK2 (Feb -> May)
  let week = 1;
  if (month === 9) week = Math.min(4, Math.max(1, Math.ceil(d.getDate() / 7)));
  else if (month === 10) week = 4 + Math.min(4, Math.max(1, Math.ceil(d.getDate() / 7)));
  else if (month === 11) week = 8 + Math.min(4, Math.max(1, Math.ceil(d.getDate() / 7)));
  else if (month === 12) week = 12 + Math.min(4, Math.max(1, Math.ceil(d.getDate() / 7)));
  else if (month === 1) week = Math.min(19, 16 + Math.max(1, Math.ceil(d.getDate() / 7)));
  else if (month >= 2 && month <= 5) week = Math.min(38, 19 + (month - 2) * 4 + Math.ceil(d.getDate() / 7));
  else week = 1;

  // Strict semester constraint: 1..19 is HK1, 20..38 is HK2
  const hocKi: 1 | 2 = getSemesterFromWeek(week);

  return {
    namHoc,
    hocKi,
    thang: month,
    tuanHoc: week,
    ngayHoc: dateStr,
    buoi: session,
  };
}

export function filterRecordsByHierarchy(
  records: DisciplineRecord[],
  filter: HierarchyPeriodFilter
): DisciplineRecord[] {
  return records.filter(rec => {
    // Năm học (chấp nhận bản ghi cũ chưa gắn namHoc)
    if (filter.namHoc && rec.namHoc && rec.namHoc !== filter.namHoc) return false;

    // Học kì (nếu xem 1 tuần cụ thể thì ưu tiên khớp theo tuần đó để tránh lệch hocKi khi import)
    if (filter.tuanHoc !== 'all') {
      if (Number(rec.tuanHoc) !== Number(filter.tuanHoc)) return false;
    } else if (filter.hocKi !== 'all') {
      const recSem = rec.hocKi ? Number(rec.hocKi) : getSemesterFromWeek(Number(rec.tuanHoc));
      if (recSem !== Number(filter.hocKi)) return false;
    }

    // Tháng
    if (filter.thang !== 'all' && rec.thang && Number(rec.thang) !== Number(filter.thang)) return false;

    // Ngày
    if (filter.ngayHoc !== 'all' && rec.ngayHoc !== filter.ngayHoc) return false;

    // Buổi
    if (filter.buoi !== 'all' && rec.buoi !== filter.buoi) return false;

    return true;
  });
}

// Calculate summary over a hierarchical period for a student
export function calculateStudentPeriodSummary(
  student: Student,
  records: DisciplineRecord[],
  filter: HierarchyPeriodFilter,
  settings: TeacherSettings,
  currentWeek?: number
): StudentPeriodSummary {
  const noDataWeeks = (settings.noDataWeeks || []).map(Number);
  const maxActiveWeek = currentWeek !== undefined ? Number(currentWeek) : 38;

  // Trường hợp 1: Đang xem 1 tuần cụ thể
  if (filter.tuanHoc !== 'all') {
    const targetWeek = Number(filter.tuanHoc);
    const isFutureWeek = currentWeek !== undefined && targetWeek > maxActiveWeek;
    const isNoDataWeek = noDataWeeks.includes(targetWeek);

    if (isFutureWeek || isNoDataWeek) {
      return {
        maHS: student.maHS,
        hoTen: student.hoTen,
        to: student.to,
        diemTrungBinh: settings.diemKhoiDau,
        tongDiemTru: 0,
        tongDiemCong: 0,
        soLoi: 0,
        xepLoai: 'Tot',
        mucMau: 'none',
        chuaCoDiem: true,
        lyDoChuaCoDiem: isFutureWeek ? 'future' : 'no_data',
        lichSuTuan: [
          {
            tuanHoc: targetWeek,
            diem: settings.diemKhoiDau,
            soLoi: 0,
            chuaCoDiem: true,
          },
        ],
      };
    }

    const studentRecords = filterRecordsByHierarchy(records, filter).filter(
      r =>
        isRecordMatchingStudent(r, student.maHS, student.hoTen) &&
        r.trangThai !== 'DaHuy' &&
        r.trangThai !== 'DaChapNhan'
    );

    let tongDiemTru = 0;
    let tongDiemCong = 0;
    let coLoiNang = false;

    studentRecords.forEach(rec => {
      const { isBonus, points } = parseRecordPoints(rec);
      if (!isBonus) {
        tongDiemTru += points;
        if (rec.mucDo === 'Nang') coLoiNang = true;
      } else if (settings.batDiemCong) {
        tongDiemCong += points;
      }
    });

    const diemTuan = Math.max(0, settings.diemKhoiDau - tongDiemTru + tongDiemCong);

    let xepLoai: WeekEvaluation = 'ChuaDat';
    if (diemTuan >= settings.nguongTot) xepLoai = 'Tot';
    else if (diemTuan >= settings.nguongKha) xepLoai = 'Kha';
    else if (diemTuan >= settings.nguongDat) xepLoai = 'Dat';
    else xepLoai = 'ChuaDat';

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
      maHS: student.maHS,
      hoTen: student.hoTen,
      to: student.to,
      diemTrungBinh: diemTuan,
      tongDiemTru,
      tongDiemCong,
      soLoi: studentRecords.length,
      xepLoai,
      mucMau,
      chuaCoDiem: false,
      lichSuTuan: [
        {
          tuanHoc: targetWeek,
          diem: diemTuan,
          soLoi: studentRecords.length,
          chuaCoDiem: false,
        },
      ],
    };
  }

  // Trường hợp 2: Xem tổng hợp nhiều tuần (Học kì 1, Học kì 2 hoặc Cả năm)
  const baseWeeks =
    filter.hocKi === 1
      ? SEMESTER_1_WEEKS
      : filter.hocKi === 2
        ? SEMESTER_2_WEEKS
        : ALL_SCHOOL_WEEKS;

  // Chỉ tính các tuần <= tuần hiện tại và không nằm trong danh sách tuần nghỉ/không có dữ liệu
  const validScoredWeeks = baseWeeks.filter(
    w => w <= maxActiveWeek && !noDataWeeks.includes(w)
  );

  if (validScoredWeeks.length === 0) {
    const hasFuture = baseWeeks.some(w => w > maxActiveWeek);
    return {
      maHS: student.maHS,
      hoTen: student.hoTen,
      to: student.to,
      diemTrungBinh: settings.diemKhoiDau,
      tongDiemTru: 0,
      tongDiemCong: 0,
      soLoi: 0,
      xepLoai: 'Tot',
      mucMau: 'none',
      chuaCoDiem: true,
      lyDoChuaCoDiem: hasFuture ? 'future' : 'no_data',
      lichSuTuan: [],
    };
  }

  const allMatchingRecords = filterRecordsByHierarchy(records, filter).filter(
    r =>
      isRecordMatchingStudent(r, student.maHS, student.hoTen) &&
      r.trangThai !== 'DaHuy' &&
      r.trangThai !== 'DaChapNhan' &&
      validScoredWeeks.includes(Number(r.tuanHoc))
  );

  let tongDiemTru = 0;
  let tongDiemCong = 0;
  let coLoiNang = false;

  allMatchingRecords.forEach(rec => {
    const { isBonus, points } = parseRecordPoints(rec);
    if (!isBonus) {
      tongDiemTru += points;
      if (rec.mucDo === 'Nang') coLoiNang = true;
    } else if (settings.batDiemCong) {
      tongDiemCong += points;
    }
  });

  const lichSuTuan = validScoredWeeks.map(w => {
    const weekRecs = allMatchingRecords.filter(r => Number(r.tuanHoc) === w);
    let wDeduction = 0;
    let wBonus = 0;
    weekRecs.forEach(r => {
      const { isBonus, points } = parseRecordPoints(r);
      if (!isBonus) wDeduction += points;
      else if (settings.batDiemCong) wBonus += points;
    });
    return {
      tuanHoc: w,
      diem: Math.max(0, settings.diemKhoiDau - wDeduction + wBonus),
      soLoi: weekRecs.length,
      chuaCoDiem: false,
    };
  });

  const totalScoreSum = lichSuTuan.reduce((sum, item) => sum + item.diem, 0);
  const diemTrungBinh = Math.round((totalScoreSum / validScoredWeeks.length) * 10) / 10;

  let xepLoai: WeekEvaluation = 'ChuaDat';
  if (diemTrungBinh >= settings.nguongTot) xepLoai = 'Tot';
  else if (diemTrungBinh >= settings.nguongKha) xepLoai = 'Kha';
  else if (diemTrungBinh >= settings.nguongDat) xepLoai = 'Dat';
  else xepLoai = 'ChuaDat';

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
    maHS: student.maHS,
    hoTen: student.hoTen,
    to: student.to,
    diemTrungBinh,
    tongDiemTru,
    tongDiemCong,
    soLoi: allMatchingRecords.length,
    xepLoai,
    mucMau,
    chuaCoDiem: false,
    lichSuTuan,
  };
}
