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

export const CURRENT_SCHOOL_YEAR = '2026-2027';

// Phân cấp chuẩn theo chỉ đạo: Tuần 1 -> 19 thuộc HK1, Tuần 20 -> 38 thuộc HK2
export const SEMESTER_1_WEEKS = Array.from({ length: 19 }, (_, i) => i + 1); // Tuần 1 -> 19
export const SEMESTER_2_WEEKS = Array.from({ length: 19 }, (_, i) => i + 20); // Tuần 20 -> 38
export const ALL_SCHOOL_WEEKS = Array.from({ length: 38 }, (_, i) => i + 1); // Tuần 1 -> 38

export function getSemesterFromWeek(week: number): 1 | 2 {
  return week <= 19 ? 1 : 2;
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
    // Năm học
    if (filter.namHoc && rec.namHoc !== filter.namHoc) return false;

    // Học kì
    if (filter.hocKi !== 'all' && rec.hocKi !== filter.hocKi) return false;

    // Tháng
    if (filter.thang !== 'all' && rec.thang !== filter.thang) return false;

    // Tuần
    if (filter.tuanHoc !== 'all' && rec.tuanHoc !== filter.tuanHoc) return false;

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
  settings: TeacherSettings
): StudentPeriodSummary {
  // Lọc bản ghi của học sinh theo phân cấp
  const studentRecords = filterRecordsByHierarchy(records, filter).filter(
    r => r.maHS === student.maHS && r.trangThai !== 'DaHuy' && r.trangThai !== 'DaChapNhan'
  );

  let tongDiemTru = 0;
  let tongDiemCong = 0;
  let coLoiNang = false;

  studentRecords.forEach(rec => {
    if (rec.loaiDiem === 'Tru') {
      tongDiemTru += rec.diemSo;
      if (rec.mucDo === 'Nang') coLoiNang = true;
    } else if (rec.loaiDiem === 'Cong' && settings.batDiemCong) {
      tongDiemCong += rec.diemSo;
    }
  });

  // Calculate distinct weeks involved in this period
  const weekSet = new Set<number>();
  if (filter.tuanHoc !== 'all') {
    weekSet.add(filter.tuanHoc);
  } else {
    // If semester or month or all year:
    // Gather all active week numbers in records or default to 3 weeks
    [1, 2, 3].forEach(w => weekSet.add(w));
  }

  const numWeeks = Math.max(1, weekSet.size);

  // Group infractions by week to calculate progression
  const lichSuTuan = Array.from(weekSet).sort((a, b) => a - b).map(w => {
    const weekRecs = records.filter(
      r => r.maHS === student.maHS && r.tuanHoc === w && r.trangThai !== 'DaHuy' && r.trangThai !== 'DaChapNhan'
    );
    let wDeduction = 0;
    let wBonus = 0;
    weekRecs.forEach(r => {
      if (r.loaiDiem === 'Tru') wDeduction += r.diemSo;
      else if (r.loaiDiem === 'Cong' && settings.batDiemCong) wBonus += r.diemSo;
    });
    return {
      tuanHoc: w,
      diem: Math.max(0, settings.diemKhoiDau - wDeduction + wBonus),
      soLoi: weekRecs.length,
    };
  });

  // Average score across weeks in the period
  const totalScoreSum = lichSuTuan.reduce((sum, item) => sum + item.diem, 0);
  const diemTrungBinh = Math.round((totalScoreSum / numWeeks) * 10) / 10;

  // Xếp loại
  let xepLoai: WeekEvaluation = 'ChuaDat';
  if (diemTrungBinh >= settings.nguongTot) xepLoai = 'Tot';
  else if (diemTrungBinh >= settings.nguongKha) xepLoai = 'Kha';
  else if (diemTrungBinh >= settings.nguongDat) xepLoai = 'Dat';
  else xepLoai = 'ChuaDat';

  // Mức màu
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
    soLoi: studentRecords.length,
    xepLoai,
    mucMau,
    lichSuTuan,
  };
}
