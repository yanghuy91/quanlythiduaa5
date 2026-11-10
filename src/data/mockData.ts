import { Student, SeatLayoutNode, RuleItem, DisciplineRecord, TeacherSettings } from '../types';
import { getTimeHierarchyFromDate, CURRENT_SCHOOL_YEAR } from '../utils/hierarchy';
import { AVATAR_PRESETS_NAM, AVATAR_PRESETS_NU } from './avatarPresets';

/**
 * Return default unique 3D/anime avatar for student by index & gender
 */
export function getDefaultStudentAvatar(studentId: string, gender: 'Nam' | 'Nu'): string {
  const num = parseInt(studentId.replace(/\D/g, ''), 10) || 1;
  if (gender === 'Nam') {
    const idx = (num - 1) % AVATAR_PRESETS_NAM.length;
    return AVATAR_PRESETS_NAM[idx]?.imageSrc || '';
  } else {
    const idx = (num - 1) % AVATAR_PRESETS_NU.length;
    return AVATAR_PRESETS_NU[idx]?.imageSrc || '';
  }
}

export const INITIAL_SETTINGS: TeacherSettings = {
  diemKhoiDau: 100,
  nguongTot: 90,
  nguongKha: 75,
  nguongDat: 60,
  batDiemCong: false, // Mặc định TẮT theo yêu cầu
  batDiemThuongGoLoi: false,
  tranDiemBu: 50,
  thoiHanSuaHuyPhut: 1440, // 24 giờ
  toTruongTuCham: false,
  hocSinhThayMau: 'CaLop',
  hanGuiGiaiTrinhNgay: 7,
  nguoiDuyetGiaiTrinh: 'GV',
  mocBuoiSang: '06:30-11:30',
  mocBuoiChieu: '12:30-17:30',
  khoaKhanCap: false,
  maLop: '10A5DP',
  choPhepXemDiemMon: true, // Cho phép học sinh xem điểm môn học
  choPhepTrungAvatar: true, // Cho phép dùng chung Avatar (GV có thể tắt để bắt buộc mỗi HS 1 Avatar)
  noDataWeeks: [],
  cadreDelegatedPermissions: {},
  tuDongChuyenTuan: true, // Mặc định BẬT tự động chuyển tuần vào Thứ 2 hàng tuần theo thời gian thực
  tuanBatDauTinhDiem: 1,
  ngayBatDauTinhDiem: '',
  tuDongTraoHuyHieu: true,
  tuanBatDauXetHuyHieu: 1,
  ngayBatDauXetHuyHieu: '',
  bannerSloganText: 'Chăm ngoan - Sáng tạo - Đoàn kết vững bước tương lai',
  bannerSloganIcon: '🌟',
  bannerSloganColor: '#ffffff',
  bannerSloganStyle: 'italic',
};

// 42 học sinh lớp 10A5 - THPT Số 2 Đức Phổ
// Cơ cấu phòng học chuẩn: 4 DÃY BÀN = 4 TỔ (Mỗi dãy 6 bàn, mỗi bàn 2 học sinh)
// Vị trí: Cửa chính (Bên phải) = Tổ 1, tính dần sang Bàn GV (Bên trái) = Tổ 4
const RAW_MOCK_STUDENTS: Student[] = [
  // TỔ 1 - DÃY 1 (Gần Cửa chính) - 11 HS (Bàn 1..6, Bàn 6 có 1 ghế trống)
  { maHS: 'HS01', hoTen: 'Nguyễn Khắc Huy', tenRutGon: 'N.K.Huy', to: 1, dayBan: 1, soBan: 1, viTriGhe: 1, vaiTro: ['LT'], gioiTinh: 'Nam' },
  { maHS: 'HS02', hoTen: 'Trần Thị Mai Anh', tenRutGon: 'T.T.M.Anh', to: 1, dayBan: 1, soBan: 1, viTriGhe: 2, vaiTro: ['BT', 'TT'], toTruongTo: 1, gioiTinh: 'Nu' },
  { maHS: 'HS03', hoTen: 'Lê Hoàng Long', tenRutGon: 'L.H.Long', to: 1, dayBan: 1, soBan: 2, viTriGhe: 3, vaiTro: ['LP_HT'], gioiTinh: 'Nam' },
  { maHS: 'HS04', hoTen: 'Phạm Quốc Bảo', tenRutGon: 'P.Q.Bảo', to: 1, dayBan: 1, soBan: 2, viTriGhe: 4, vaiTro: ['LP_LD'], gioiTinh: 'Nam' },
  { maHS: 'HS05', hoTen: 'Nguyễn Văn Huy', tenRutGon: 'N.V.Huy', to: 1, dayBan: 1, soBan: 3, viTriGhe: 5, vaiTro: ['HS'], gioiTinh: 'Nam' },
  { maHS: 'HS06', hoTen: 'Nguyễn Văn Hùng', tenRutGon: 'N.V.Hùng', to: 1, dayBan: 1, soBan: 3, viTriGhe: 6, vaiTro: ['HS'], gioiTinh: 'Nam' },
  { maHS: 'HS07', hoTen: 'Đinh Thị Thuỳ Trang', tenRutGon: 'Đ.T.T.Trang', to: 1, dayBan: 1, soBan: 4, viTriGhe: 7, vaiTro: ['HS'], gioiTinh: 'Nu' },
  { maHS: 'HS08', hoTen: 'Huỳnh Gia Bảo', tenRutGon: 'H.G.Bảo', to: 1, dayBan: 1, soBan: 4, viTriGhe: 8, vaiTro: ['HS'], gioiTinh: 'Nam' },
  { maHS: 'HS09', hoTen: 'Trần Thị Minh Anh', tenRutGon: 'T.T.Minh Anh', to: 1, dayBan: 1, soBan: 5, viTriGhe: 9, vaiTro: ['HS'], gioiTinh: 'Nu' },
  { maHS: 'HS10', hoTen: 'Lý Quốc Thịnh', tenRutGon: 'L.Q.Thịnh', to: 1, dayBan: 1, soBan: 5, viTriGhe: 10, vaiTro: ['HS'], gioiTinh: 'Nam' },
  { maHS: 'HS11', hoTen: 'Phan Như Quỳnh', tenRutGon: 'P.N.Quỳnh', to: 1, dayBan: 1, soBan: 6, viTriGhe: 11, vaiTro: ['HS'], gioiTinh: 'Nu' },

  // TỔ 2 - DÃY 2 - 11 HS (Bàn 1..6, Bàn 6 có 1 ghế trống)
  { maHS: 'HS12', hoTen: 'Vũ Đình Trọng', tenRutGon: 'V.Đ.Trọng', to: 2, dayBan: 2, soBan: 1, viTriGhe: 12, vaiTro: ['TT'], toTruongTo: 2, gioiTinh: 'Nam' },
  { maHS: 'HS13', hoTen: 'Võ Minh Quân', tenRutGon: 'V.M.Quân', to: 2, dayBan: 2, soBan: 1, viTriGhe: 13, vaiTro: ['HS'], gioiTinh: 'Nam' },
  { maHS: 'HS14', hoTen: 'Ngô Thanh Hằng', tenRutGon: 'N.T.Hằng', to: 2, dayBan: 2, soBan: 2, viTriGhe: 14, vaiTro: ['HS'], gioiTinh: 'Nu' },
  { maHS: 'HS15', hoTen: 'Đoàn Nhật Nam', tenRutGon: 'Đ.N.Nam', to: 2, dayBan: 2, soBan: 2, viTriGhe: 15, vaiTro: ['HS'], gioiTinh: 'Nam' },
  { maHS: 'HS16', hoTen: 'Dương Khánh Linh', tenRutGon: 'D.K.Linh', to: 2, dayBan: 2, soBan: 3, viTriGhe: 16, vaiTro: ['HS'], gioiTinh: 'Nu' },
  { maHS: 'HS17', hoTen: 'Trịnh Hoài An', tenRutGon: 'T.H.An', to: 2, dayBan: 2, soBan: 3, viTriGhe: 17, vaiTro: ['HS'], gioiTinh: 'Nam' },
  { maHS: 'HS18', hoTen: 'Lê Hải Long', tenRutGon: 'L.Hải Long', to: 2, dayBan: 2, soBan: 4, viTriGhe: 18, vaiTro: ['HS'], gioiTinh: 'Nam' },
  { maHS: 'HS19', hoTen: 'Hồ Tuấn Kiệt', tenRutGon: 'H.T.Kiệt', to: 2, dayBan: 2, soBan: 4, viTriGhe: 19, vaiTro: ['HS'], gioiTinh: 'Nam' },
  { maHS: 'HS20', hoTen: 'Mai Thảo My', tenRutGon: 'M.T.My', to: 2, dayBan: 2, soBan: 5, viTriGhe: 20, vaiTro: ['HS'], gioiTinh: 'Nu' },
  { maHS: 'HS21', hoTen: 'Bùi Gia Khiêm', tenRutGon: 'B.G.Khiêm', to: 2, dayBan: 2, soBan: 5, viTriGhe: 21, vaiTro: ['HS'], gioiTinh: 'Nam' },
  { maHS: 'HS22', hoTen: 'Cao Hoàng Bách', tenRutGon: 'C.H.Bách', to: 2, dayBan: 2, soBan: 6, viTriGhe: 22, vaiTro: ['HS'], gioiTinh: 'Nam' },

  // TỔ 3 - DÃY 3 - 10 HS (Bàn 1..5, Bàn 6 trống)
  { maHS: 'HS23', hoTen: 'Đặng Thị Thuỷ Tiên', tenRutGon: 'Đ.T.T.Tiên', to: 3, dayBan: 3, soBan: 1, viTriGhe: 23, vaiTro: ['TT'], toTruongTo: 3, gioiTinh: 'Nu' },
  { maHS: 'HS24', hoTen: 'Lương Thế Vinh', tenRutGon: 'L.T.Vinh', to: 3, dayBan: 3, soBan: 1, viTriGhe: 24, vaiTro: ['HS'], gioiTinh: 'Nam' },
  { maHS: 'HS25', hoTen: 'Nguyễn Thị Bích Ngọc', tenRutGon: 'N.T.B.Ngọc', to: 3, dayBan: 3, soBan: 2, viTriGhe: 25, vaiTro: ['HS'], gioiTinh: 'Nu' },
  { maHS: 'HS26', hoTen: 'Trần Đại Quang', tenRutGon: 'T.Đ.Quang', to: 3, dayBan: 3, soBan: 2, viTriGhe: 26, vaiTro: ['HS'], gioiTinh: 'Nam' },
  { maHS: 'HS27', hoTen: 'Đỗ Ngọc Ánh', tenRutGon: 'Đ.N.Ánh', to: 3, dayBan: 3, soBan: 3, viTriGhe: 27, vaiTro: ['HS'], gioiTinh: 'Nu' },
  { maHS: 'HS28', hoTen: 'Hà Văn Dũng', tenRutGon: 'H.V.Dũng', to: 3, dayBan: 3, soBan: 3, viTriGhe: 28, vaiTro: ['HS'], gioiTinh: 'Nam' },
  { maHS: 'HS29', hoTen: 'Tạ Minh Khang', tenRutGon: 'T.M.Khang', to: 3, dayBan: 3, soBan: 4, viTriGhe: 29, vaiTro: ['HS'], gioiTinh: 'Nam' },
  { maHS: 'HS30', hoTen: 'Lâm Mỹ Duyên', tenRutGon: 'L.M.Duyên', to: 3, dayBan: 3, soBan: 4, viTriGhe: 30, vaiTro: ['HS'], gioiTinh: 'Nu' },
  { maHS: 'HS31', hoTen: 'Vương Đình Trí', tenRutGon: 'V.Đ.Trí', to: 3, dayBan: 3, soBan: 5, viTriGhe: 31, vaiTro: ['HS'], gioiTinh: 'Nam' },
  { maHS: 'HS32', hoTen: 'Phan Thảo Uyên', tenRutGon: 'P.T.Uyên', to: 3, dayBan: 3, soBan: 5, viTriGhe: 32, vaiTro: ['HS'], gioiTinh: 'Nu' },

  // TỔ 4 - DÃY 4 (Gần Bàn GV) - 10 HS (Bàn 1..5, Bàn 6 trống)
  { maHS: 'HS33', hoTen: 'Hoàng Quốc Việt', tenRutGon: 'H.Q.Việt', to: 4, dayBan: 4, soBan: 1, viTriGhe: 33, vaiTro: ['HS'], gioiTinh: 'Nam' },
  { maHS: 'HS34', hoTen: 'Bùi Minh Triết', tenRutGon: 'B.M.Triết', to: 4, dayBan: 4, soBan: 1, viTriGhe: 34, vaiTro: ['TT'], toTruongTo: 4, gioiTinh: 'Nam' },
  { maHS: 'HS35', hoTen: 'Nguyễn Thanh Tùng', tenRutGon: 'N.T.Tùng', to: 4, dayBan: 4, soBan: 2, viTriGhe: 35, vaiTro: ['HS'], gioiTinh: 'Nam' },
  { maHS: 'HS36', hoTen: 'Lê Diệu Linh', tenRutGon: 'L.D.Linh', to: 4, dayBan: 4, soBan: 2, viTriGhe: 36, vaiTro: ['HS'], gioiTinh: 'Nu' },
  { maHS: 'HS37', hoTen: 'Đặng Tuấn Anh', tenRutGon: 'Đ.T.Anh', to: 4, dayBan: 4, soBan: 3, viTriGhe: 37, vaiTro: ['HS'], gioiTinh: 'Nam' },
  { maHS: 'HS38', hoTen: 'Phạm Hồng Sơn', tenRutGon: 'P.H.Sơn', to: 4, dayBan: 4, soBan: 3, viTriGhe: 38, vaiTro: ['HS'], gioiTinh: 'Nam' },
  { maHS: 'HS39', hoTen: 'Trương Ngọc Huyền', tenRutGon: 'T.N.Huyền', to: 4, dayBan: 4, soBan: 4, viTriGhe: 39, vaiTro: ['HS'], gioiTinh: 'Nu' },
  { maHS: 'HS40', hoTen: 'Nguyễn Tấn Đạt', tenRutGon: 'N.T.Đạt', to: 4, dayBan: 4, soBan: 4, viTriGhe: 40, vaiTro: ['HS'], gioiTinh: 'Nam' },
  { maHS: 'HS41', hoTen: 'Trần Kim Cương', tenRutGon: 'T.K.Cương', to: 4, dayBan: 4, soBan: 5, viTriGhe: 41, vaiTro: ['HS'], gioiTinh: 'Nu' },
  { maHS: 'HS42', hoTen: 'Hồ Hoàng Phương', tenRutGon: 'H.H.Phương', to: 4, dayBan: 4, soBan: 5, viTriGhe: 42, vaiTro: ['HS'], gioiTinh: 'Nu' }
];

export const MOCK_STUDENTS: Student[] = RAW_MOCK_STUDENTS.map(s => ({
  ...s,
  avatarUrl: s.avatarUrl || getDefaultStudentAvatar(s.maHS, s.gioiTinh || 'Nam'),
}));

// Danh mục nội quy nề nếp thi đua
export const MOCK_RULES: RuleItem[] = [
  // Chuyên cần & Học tập
  { maNoiQuy: 'NQ01', nhomHanhVi: 'Chuyên cần', tenHanhVi: 'Đi muộn', loaiDiem: 'Tru', diemSo: 2, mucDo: 'Nhe', ghim: true, thuTu: 1 },
  { maNoiQuy: 'NQ29', nhomHanhVi: 'Chuyên cần', tenHanhVi: 'Nghỉ học có phép', loaiDiem: 'Tru', diemSo: 1, mucDo: 'Nhe', ghim: true, thuTu: 2 },
  { maNoiQuy: 'NQ02', nhomHanhVi: 'Chuyên cần', tenHanhVi: 'Nghỉ học không phép', loaiDiem: 'Tru', diemSo: 5, mucDo: 'Vua', ghim: true, thuTu: 3 },
  { maNoiQuy: 'NQ03', nhomHanhVi: 'Chuyên cần', tenHanhVi: 'Trốn tiết, bỏ giờ', loaiDiem: 'Tru', diemSo: 5, mucDo: 'Vua', ghim: false, thuTu: 4 },
  { maNoiQuy: 'NQ04', nhomHanhVi: 'Chuyên cần', tenHanhVi: 'Vào lớp trễ sau ra chơi', loaiDiem: 'Tru', diemSo: 1, mucDo: 'Nhe', ghim: false, thuTu: 5 },

  // Học tập
  { maNoiQuy: 'NQ05', nhomHanhVi: 'Học tập', tenHanhVi: 'Không làm bài tập', loaiDiem: 'Tru', diemSo: 3, mucDo: 'Vua', ghim: true, thuTu: 6 },
  { maNoiQuy: 'NQ06', nhomHanhVi: 'Học tập', tenHanhVi: 'Quên mang sách vở, dụng cụ', loaiDiem: 'Tru', diemSo: 2, mucDo: 'Nhe', ghim: true, thuTu: 7 },
  { maNoiQuy: 'NQ07', nhomHanhVi: 'Học tập', tenHanhVi: 'Nói chuyện riêng trong giờ học', loaiDiem: 'Tru', diemSo: 1, mucDo: 'Nhe', ghim: true, thuTu: 8 },
  { maNoiQuy: 'NQ08', nhomHanhVi: 'Học tập', tenHanhVi: 'Không ghi chép bài', loaiDiem: 'Tru', diemSo: 2, mucDo: 'Nhe', ghim: false, thuTu: 9 },
  { maNoiQuy: 'NQ09', nhomHanhVi: 'Học tập', tenHanhVi: 'Gian lận trong thi, kiểm tra', loaiDiem: 'Tru', diemSo: 5, mucDo: 'Nang', ghim: false, thuTu: 10 },
  { maNoiQuy: 'NQ10', nhomHanhVi: 'Học tập', tenHanhVi: 'Không chuẩn bị bài mới', loaiDiem: 'Tru', diemSo: 2, mucDo: 'Nhe', ghim: false, thuTu: 11 },
  { maNoiQuy: 'NQ30', nhomHanhVi: 'Học tập', tenHanhVi: 'Vắng tiết học / phụ đạo có phép', loaiDiem: 'Tru', diemSo: 1, mucDo: 'Nhe', ghim: false, thuTu: 12 },
  { maNoiQuy: 'NQ31', nhomHanhVi: 'Học tập', tenHanhVi: 'Vắng tiết học / phụ đạo không phép', loaiDiem: 'Tru', diemSo: 3, mucDo: 'Vua', ghim: false, thuTu: 13 },

  // Nề nếp
  { maNoiQuy: 'NQ11', nhomHanhVi: 'Nề nếp', tenHanhVi: 'Không đúng đồng phục', loaiDiem: 'Tru', diemSo: 2, mucDo: 'Nhe', ghim: true, thuTu: 14 },
  { maNoiQuy: 'NQ12', nhomHanhVi: 'Nề nếp', tenHanhVi: 'Không đeo phù hiệu / thẻ học sinh', loaiDiem: 'Tru', diemSo: 1, mucDo: 'Nhe', ghim: true, thuTu: 15 },
  { maNoiQuy: 'NQ13', nhomHanhVi: 'Nề nếp', tenHanhVi: 'Dùng điện thoại không phép trong lớp', loaiDiem: 'Tru', diemSo: 5, mucDo: 'Nang', ghim: true, thuTu: 16 },
  { maNoiQuy: 'NQ14', nhomHanhVi: 'Nề nếp', tenHanhVi: 'Nói tục, chửi thề, mất lịch sự', loaiDiem: 'Tru', diemSo: 3, mucDo: 'Vua', ghim: false, thuTu: 17 },
  { maNoiQuy: 'NQ15', nhomHanhVi: 'Nề nếp', tenHanhVi: 'Nhuộm tóc, móng tay, trang điểm đậm', loaiDiem: 'Tru', diemSo: 3, mucDo: 'Vua', ghim: false, thuTu: 18 },
  { maNoiQuy: 'NQ16', nhomHanhVi: 'Nề nếp', tenHanhVi: 'Gây gổ, đánh nhau', loaiDiem: 'Tru', diemSo: 10, mucDo: 'Nang', ghim: false, thuTu: 19 },

  // Phong trào & Hoạt động tập thể
  { maNoiQuy: 'NQ34', nhomHanhVi: 'Phong trào', tenHanhVi: 'Vắng hoạt động / phong trào có phép', loaiDiem: 'Tru', diemSo: 1, mucDo: 'Nhe', ghim: true, thuTu: 20 },
  { maNoiQuy: 'NQ35', nhomHanhVi: 'Phong trào', tenHanhVi: 'Vắng hoạt động / phong trào không phép', loaiDiem: 'Tru', diemSo: 4, mucDo: 'Vua', ghim: true, thuTu: 21 },
  { maNoiQuy: 'NQ17', nhomHanhVi: 'Phong trào', tenHanhVi: 'Không tham gia sinh hoạt chi đoàn / lớp', loaiDiem: 'Tru', diemSo: 3, mucDo: 'Vua', ghim: false, thuTu: 22 },
  { maNoiQuy: 'NQ18', nhomHanhVi: 'Phong trào', tenHanhVi: 'Đến muộn giờ chào cờ / sinh hoạt', loaiDiem: 'Tru', diemSo: 2, mucDo: 'Nhe', ghim: false, thuTu: 23 },
  { maNoiQuy: 'NQ19', nhomHanhVi: 'Phong trào', tenHanhVi: 'Thiếu nghiêm túc khi hát Quốc ca', loaiDiem: 'Tru', diemSo: 2, mucDo: 'Nhe', ghim: false, thuTu: 24 },

  // Lao động - Vệ sinh
  { maNoiQuy: 'NQ32', nhomHanhVi: 'Lao động - Vệ sinh', tenHanhVi: 'Vắng buổi lao động có phép', loaiDiem: 'Tru', diemSo: 1, mucDo: 'Nhe', ghim: true, thuTu: 25 },
  { maNoiQuy: 'NQ33', nhomHanhVi: 'Lao động - Vệ sinh', tenHanhVi: 'Vắng buổi lao động không phép', loaiDiem: 'Tru', diemSo: 5, mucDo: 'Vua', ghim: true, thuTu: 26 },
  { maNoiQuy: 'NQ20', nhomHanhVi: 'Lao động - Vệ sinh', tenHanhVi: 'Trực nhật bẩn hoặc trễ giờ', loaiDiem: 'Tru', diemSo: 3, mucDo: 'Vua', ghim: true, thuTu: 27 },
  { maNoiQuy: 'NQ21', nhomHanhVi: 'Lao động - Vệ sinh', tenHanhVi: 'Vứt rác bừa bãi trong lớp', loaiDiem: 'Tru', diemSo: 2, mucDo: 'Nhe', ghim: true, thuTu: 28 },
  { maNoiQuy: 'NQ22', nhomHanhVi: 'Lao động - Vệ sinh', tenHanhVi: 'Ăn quà vặt trong phòng học', loaiDiem: 'Tru', diemSo: 2, mucDo: 'Nhe', ghim: false, thuTu: 29 },
  { maNoiQuy: 'NQ23', nhomHanhVi: 'Lao động - Vệ sinh', tenHanhVi: 'Không tắt quạt, đèn khi ra khỏi lớp', loaiDiem: 'Tru', diemSo: 2, mucDo: 'Nhe', ghim: false, thuTu: 30 },
  { maNoiQuy: 'NQ24', nhomHanhVi: 'Lao động - Vệ sinh', tenHanhVi: 'Viết vẽ bậy lên bàn hoặc tường', loaiDiem: 'Tru', diemSo: 3, mucDo: 'Vua', ghim: false, thuTu: 31 },

  // Điểm cộng (chỉ hiển thị khi GV kích hoạt tuỳ chọn)
  { maNoiQuy: 'NQ25', nhomHanhVi: 'Điểm cộng', tenHanhVi: 'Đạt điểm 9-10 bài kiểm tra', loaiDiem: 'Cong', diemSo: 2, mucDo: 'Nhe', ghim: false, thuTu: 32 },
  { maNoiQuy: 'NQ26', nhomHanhVi: 'Điểm cộng', tenHanhVi: 'Phát biểu xây dựng bài tích cực', loaiDiem: 'Cong', diemSo: 1, mucDo: 'Nhe', ghim: false, thuTu: 33 },
  { maNoiQuy: 'NQ27', nhomHanhVi: 'Điểm cộng', tenHanhVi: 'Nhặt được của rơi trả lại', loaiDiem: 'Cong', diemSo: 3, mucDo: 'Nhe', ghim: false, thuTu: 34 },
  { maNoiQuy: 'NQ28', nhomHanhVi: 'Điểm cộng', tenHanhVi: 'Đạt giải cuộc thi / phong trào trường', loaiDiem: 'Cong', diemSo: 5, mucDo: 'Nhe', ghim: false, thuTu: 35 },
];

// Layout sơ đồ lớp học chuẩn: 4 DÃY BÀN = 4 TỔ, MỖI DÃY 6 BÀN, MỖI BÀN 2 HỌC SINH
// Trái sang Phải: Dãy 4 (Tổ 4, gần Bàn GV) -> Dãy 3 (Tổ 3) -> Lối đi giữa -> Dãy 2 (Tổ 2) -> Dãy 1 (Tổ 1, gần Cửa chính)
// Cột 0, 1: Dãy 4 (Tổ 4)
// Cột 2: Lối đi 1
// Cột 3, 4: Dãy 3 (Tổ 3)
// Cột 5: Lối đi giữa chính
// Cột 6, 7: Dãy 2 (Tổ 2)
// Cột 8: Lối đi 2
// Cột 9, 10: Dãy 1 (Tổ 1)
export const MOCK_SEAT_LAYOUT: SeatLayoutNode[] = [
  // Hàng 0: Đầu lớp (Bàn GV bên trái, Bảng ở giữa, Cửa chính bên phải)
  { hang: 0, cot: 0, loaiO: 'banGV', ghiChu: 'Bàn GV' },
  { hang: 0, cot: 1, loaiO: 'banGV', ghiChu: 'Bàn GV' },
  { hang: 0, cot: 2, loaiO: 'loidi' },
  { hang: 0, cot: 3, loaiO: 'buc', ghiChu: 'Bảng' },
  { hang: 0, cot: 4, loaiO: 'buc', ghiChu: 'Bảng' },
  { hang: 0, cot: 5, loaiO: 'buc', ghiChu: 'Bảng 10A5' },
  { hang: 0, cot: 6, loaiO: 'buc', ghiChu: 'Bảng' },
  { hang: 0, cot: 7, loaiO: 'buc', ghiChu: 'Bảng' },
  { hang: 0, cot: 8, loaiO: 'loidi' },
  { hang: 0, cot: 9, loaiO: 'cua', ghiChu: 'Cửa chính' },
  { hang: 0, cot: 10, loaiO: 'cua', ghiChu: 'Cửa chính' },

  // Hàng 1 (Bàn 1 của cả 4 dãy)
  { hang: 1, cot: 0, loaiO: 'ghe', maHS: 'HS33' }, // Dãy 4, Bàn 1 (ghế trái)
  { hang: 1, cot: 1, loaiO: 'ghe', maHS: 'HS34' }, // Dãy 4, Bàn 1 (ghế phải)
  { hang: 1, cot: 2, loaiO: 'loidi' },
  { hang: 1, cot: 3, loaiO: 'ghe', maHS: 'HS23' }, // Dãy 3, Bàn 1 (ghế trái)
  { hang: 1, cot: 4, loaiO: 'ghe', maHS: 'HS24' }, // Dãy 3, Bàn 1 (ghế phải)
  { hang: 1, cot: 5, loaiO: 'loidi' },             // Lối đi chính giữa
  { hang: 1, cot: 6, loaiO: 'ghe', maHS: 'HS12' }, // Dãy 2, Bàn 1 (ghế trái)
  { hang: 1, cot: 7, loaiO: 'ghe', maHS: 'HS13' }, // Dãy 2, Bàn 1 (ghế phải)
  { hang: 1, cot: 8, loaiO: 'loidi' },
  { hang: 1, cot: 9, loaiO: 'ghe', maHS: 'HS01' }, // Dãy 1, Bàn 1 (ghế trái)
  { hang: 1, cot: 10, loaiO: 'ghe', maHS: 'HS02' },// Dãy 1, Bàn 1 (ghế phải)

  // Hàng 2 (Bàn 2 của cả 4 dãy)
  { hang: 2, cot: 0, loaiO: 'ghe', maHS: 'HS35' }, // Dãy 4, Bàn 2
  { hang: 2, cot: 1, loaiO: 'ghe', maHS: 'HS36' },
  { hang: 2, cot: 2, loaiO: 'loidi' },
  { hang: 2, cot: 3, loaiO: 'ghe', maHS: 'HS25' }, // Dãy 3, Bàn 2
  { hang: 2, cot: 4, loaiO: 'ghe', maHS: 'HS26' },
  { hang: 2, cot: 5, loaiO: 'loidi' },
  { hang: 2, cot: 6, loaiO: 'ghe', maHS: 'HS14' }, // Dãy 2, Bàn 2
  { hang: 2, cot: 7, loaiO: 'ghe', maHS: 'HS15' },
  { hang: 2, cot: 8, loaiO: 'loidi' },
  { hang: 2, cot: 9, loaiO: 'ghe', maHS: 'HS03' }, // Dãy 1, Bàn 2
  { hang: 2, cot: 10, loaiO: 'ghe', maHS: 'HS04' },

  // Hàng 3 (Bàn 3 của cả 4 dãy)
  { hang: 3, cot: 0, loaiO: 'ghe', maHS: 'HS37' }, // Dãy 4, Bàn 3
  { hang: 3, cot: 1, loaiO: 'ghe', maHS: 'HS38' },
  { hang: 3, cot: 2, loaiO: 'loidi' },
  { hang: 3, cot: 3, loaiO: 'ghe', maHS: 'HS27' }, // Dãy 3, Bàn 3
  { hang: 3, cot: 4, loaiO: 'ghe', maHS: 'HS28' },
  { hang: 3, cot: 5, loaiO: 'loidi' },
  { hang: 3, cot: 6, loaiO: 'ghe', maHS: 'HS16' }, // Dãy 2, Bàn 3
  { hang: 3, cot: 7, loaiO: 'ghe', maHS: 'HS17' },
  { hang: 3, cot: 8, loaiO: 'loidi' },
  { hang: 3, cot: 9, loaiO: 'ghe', maHS: 'HS05' }, // Dãy 1, Bàn 3
  { hang: 3, cot: 10, loaiO: 'ghe', maHS: 'HS06' },

  // Hàng 4 (Bàn 4 của cả 4 dãy)
  { hang: 4, cot: 0, loaiO: 'ghe', maHS: 'HS39' }, // Dãy 4, Bàn 4
  { hang: 4, cot: 1, loaiO: 'ghe', maHS: 'HS40' },
  { hang: 4, cot: 2, loaiO: 'loidi' },
  { hang: 4, cot: 3, loaiO: 'ghe', maHS: 'HS29' }, // Dãy 3, Bàn 4
  { hang: 4, cot: 4, loaiO: 'ghe', maHS: 'HS30' },
  { hang: 4, cot: 5, loaiO: 'loidi' },
  { hang: 4, cot: 6, loaiO: 'ghe', maHS: 'HS18' }, // Dãy 2, Bàn 4
  { hang: 4, cot: 7, loaiO: 'ghe', maHS: 'HS19' },
  { hang: 4, cot: 8, loaiO: 'loidi' },
  { hang: 4, cot: 9, loaiO: 'ghe', maHS: 'HS07' }, // Dãy 1, Bàn 4
  { hang: 4, cot: 10, loaiO: 'ghe', maHS: 'HS08' },

  // Hàng 5 (Bàn 5 của cả 4 dãy)
  { hang: 5, cot: 0, loaiO: 'ghe', maHS: 'HS41' }, // Dãy 4, Bàn 5
  { hang: 5, cot: 1, loaiO: 'ghe', maHS: 'HS42' },
  { hang: 5, cot: 2, loaiO: 'loidi' },
  { hang: 5, cot: 3, loaiO: 'ghe', maHS: 'HS31' }, // Dãy 3, Bàn 5
  { hang: 5, cot: 4, loaiO: 'ghe', maHS: 'HS32' },
  { hang: 5, cot: 5, loaiO: 'loidi' },
  { hang: 5, cot: 6, loaiO: 'ghe', maHS: 'HS20' }, // Dãy 2, Bàn 5
  { hang: 5, cot: 7, loaiO: 'ghe', maHS: 'HS21' },
  { hang: 5, cot: 8, loaiO: 'loidi' },
  { hang: 5, cot: 9, loaiO: 'ghe', maHS: 'HS09' }, // Dãy 1, Bàn 5
  { hang: 5, cot: 10, loaiO: 'ghe', maHS: 'HS10' },

  // Hàng 6 (Bàn 6 của cả 4 dãy)
  { hang: 6, cot: 0, loaiO: 'trong', ghiChu: 'Chỗ trống Bàn 6 - Tổ 4' },
  { hang: 6, cot: 1, loaiO: 'trong', ghiChu: 'Chỗ trống Bàn 6 - Tổ 4' },
  { hang: 6, cot: 2, loaiO: 'loidi' },
  { hang: 6, cot: 3, loaiO: 'trong', ghiChu: 'Chỗ trống Bàn 6 - Tổ 3' },
  { hang: 6, cot: 4, loaiO: 'trong', ghiChu: 'Chỗ trống Bàn 6 - Tổ 3' },
  { hang: 6, cot: 5, loaiO: 'loidi' },
  { hang: 6, cot: 6, loaiO: 'ghe', maHS: 'HS22' },                       // Dãy 2, Bàn 6 (HS cuối Tổ 2)
  { hang: 6, cot: 7, loaiO: 'trong', ghiChu: 'Chỗ trống Bàn 6 - Tổ 2' },
  { hang: 6, cot: 8, loaiO: 'loidi' },
  { hang: 6, cot: 9, loaiO: 'ghe', maHS: 'HS11' },                       // Dãy 1, Bàn 6 (HS cuối Tổ 1)
  { hang: 6, cot: 10, loaiO: 'trong', ghiChu: 'Chỗ trống Bàn 6 - Tổ 1' },

  // Hàng 7: Cuối lớp
  { hang: 7, cot: 0, loaiO: 'cua', ghiChu: 'Cửa sau' },
  { hang: 7, cot: 1, loaiO: 'trong' },
  { hang: 7, cot: 2, loaiO: 'loidi' },
  { hang: 7, cot: 3, loaiO: 'trong' },
  { hang: 7, cot: 4, loaiO: 'trong' },
  { hang: 7, cot: 5, loaiO: 'trong', ghiChu: 'Khoảng trống cuối lớp' },
  { hang: 7, cot: 6, loaiO: 'trong' },
  { hang: 7, cot: 7, loaiO: 'trong' },
  { hang: 7, cot: 8, loaiO: 'loidi' },
  { hang: 7, cot: 9, loaiO: 'trong' },
  { hang: 7, cot: 10, loaiO: 'trong' }
];

// Danh sách các mã bản ghi mẫu cũ cần loại bỏ khỏi bộ nhớ để đảm bảo chỉ lưu dữ liệu thật của lớp
export const LEGACY_DEMO_RECORD_IDS = new Set([
  'REC-TODAY-01',
  'REC-W3-02',
  'REC-W3-03',
  'REC-W3-04',
  'REC-W3-05',
  'REC-W3-06',
  'REC-W3-07',
  'REC-W3-08',
  'REC-W3-09',
  'REC-W2-01',
  'REC-W2-02',
  'REC-W2-03',
  'REC-W2-04',
  'REC-W1-01',
  'REC-W1-02',
]);

export function filterOutLegacyDemoRecords(records: DisciplineRecord[]): DisciplineRecord[] {
  if (!Array.isArray(records)) return [];
  return records.filter(r => r && !LEGACY_DEMO_RECORD_IDS.has(r.maGhiNhan));
}

// Khởi tạo danh sách ghi nhận rỗng (không chứa dữ liệu trừ điểm giả mặc định trong code)
export const INITIAL_RECORDS: DisciplineRecord[] = [];

// Danh sách các vai trò hiển thị và badge
export const ROLE_CONFIG: Record<string, { label: string; short: string; fg: string; bg: string }> = {
  LT: { label: 'Lớp trưởng', short: 'LT', fg: 'var(--role-lt-fg)', bg: 'var(--role-lt-bg)' },
  BT: { label: 'Bí thư', short: 'BT', fg: 'var(--role-bt-fg)', bg: 'var(--role-bt-bg)' },
  PBT: { label: 'Phó Bí thư', short: 'PBT', fg: 'var(--role-pbt-fg)', bg: 'var(--role-pbt-bg)' },
  LP_HT: { label: 'Lớp phó Học tập', short: 'HT', fg: 'var(--role-ht-fg)', bg: 'var(--role-ht-bg)' },
  LP_LD: { label: 'Lớp phó Lao động', short: 'LĐ', fg: 'var(--role-ld-fg)', bg: 'var(--role-ld-bg)' },
  LP_VT: { label: 'Lớp phó Văn thể', short: 'VT', fg: 'var(--role-vt-fg)', bg: 'var(--role-vt-bg)' },
  CD: { label: 'Cờ đỏ', short: 'CĐ', fg: 'var(--role-cd-fg)', bg: 'var(--role-cd-bg)' },
  TT: { label: 'Tổ trưởng', short: 'TT', fg: 'var(--role-tt-fg)', bg: 'var(--role-tt-bg)' },
  GV: { label: 'Giáo viên', short: 'GV', fg: 'var(--role-gv-fg)', bg: 'var(--role-gv-bg)' },
  HS: { label: 'Học sinh', short: 'HS', fg: 'var(--text-muted)', bg: 'var(--surface-2)' },
};
