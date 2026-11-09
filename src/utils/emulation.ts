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
