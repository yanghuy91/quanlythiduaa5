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
  { maHS: 'HS01', hoTen: 'Phạm Xuân An', tenRutGon: 'P.X.An', to: 2, dayBan: 2, soBan: 1, viTriGhe: 1, vaiTro: ["TT"], gioiTinh: 'Nu' },
  { maHS: 'HS02', hoTen: 'Nguyễn Hà Hoàng Anh', tenRutGon: 'N.H.H.Anh', to: 3, dayBan: 3, soBan: 1, viTriGhe: 2, vaiTro: ["HS"], gioiTinh: 'Nam' },
  { maHS: 'HS03', hoTen: 'Quách Gia Bảo', tenRutGon: 'Q.G.Bảo', to: 1, dayBan: 1, soBan: 1, viTriGhe: 3, vaiTro: ["HS"], gioiTinh: 'Nam' },
  { maHS: 'HS04', hoTen: 'Nguyễn Bá Bi', tenRutGon: 'N.B.Bi', to: 1, dayBan: 1, soBan: 2, viTriGhe: 4, vaiTro: ["HS"], gioiTinh: 'Nam' },
  { maHS: 'HS05', hoTen: 'Bùi Trân Châu', tenRutGon: 'B.T.Châu', to: 1, dayBan: 1, soBan: 1, viTriGhe: 5, vaiTro: ["HS"], gioiTinh: 'Nu' },
  { maHS: 'HS06', hoTen: 'Trần Thị Bảo Châu', tenRutGon: 'T.T.B.Châu', to: 4, dayBan: 4, soBan: 6, viTriGhe: 6, vaiTro: ["HS"], gioiTinh: 'Nu' },
  { maHS: 'HS07', hoTen: 'Châu Ngọc Bích Dung', tenRutGon: 'C.N.B.Dung', to: 2, dayBan: 2, soBan: 1, viTriGhe: 7, vaiTro: ["HS"], gioiTinh: 'Nu' },
  { maHS: 'HS08', hoTen: 'Ngô Thanh Dũng', tenRutGon: 'N.T.Dũng', to: 4, dayBan: 4, soBan: 1, viTriGhe: 8, vaiTro: ["HS"], gioiTinh: 'Nam' },
  { maHS: 'HS09', hoTen: 'Nguyễn Khánh Duy', tenRutGon: 'N.K.Duy', to: 3, dayBan: 3, soBan: 1, viTriGhe: 9, vaiTro: ["HS"], gioiTinh: 'Nam' },
  { maHS: 'HS10', hoTen: 'Nguyễn Quốc Đạt', tenRutGon: 'N.Q.Đạt', to: 1, dayBan: 1, soBan: 3, viTriGhe: 10, vaiTro: ["HS"], gioiTinh: 'Nam' },
  { maHS: 'HS11', hoTen: 'Nguyễn Trần Nhật Hào', tenRutGon: 'N.T.N.Hào', to: 4, dayBan: 4, soBan: 2, viTriGhe: 11, vaiTro: ["HS"], gioiTinh: 'Nam' },
  { maHS: 'HS12', hoTen: 'Võ Nguyễn Gia Hạo', tenRutGon: 'V.N.G.Hạo', to: 1, dayBan: 1, soBan: 3, viTriGhe: 12, vaiTro: ["LP_LD"], gioiTinh: 'Nam' },
  { maHS: 'HS13', hoTen: 'Châu Minh Hiếu', tenRutGon: 'C.M.Hiếu', to: 3, dayBan: 3, soBan: 2, viTriGhe: 13, vaiTro: ["HS"], gioiTinh: 'Nam' },
  { maHS: 'HS14', hoTen: 'Võ Trọng Hoàng', tenRutGon: 'V.T.Hoàng', to: 4, dayBan: 4, soBan: 4, viTriGhe: 14, vaiTro: ["HS"], gioiTinh: 'Nam' },
  { maHS: 'HS15', hoTen: 'Võ Hữu Hưng', tenRutGon: 'V.H.Hưng', to: 2, dayBan: 2, soBan: 6, viTriGhe: 15, vaiTro: ["PBT"], gioiTinh: 'Nam' },
  { maHS: 'HS16', hoTen: 'Võ Đoàn Nguyên Khang', tenRutGon: 'V.Đ.N.Khang', to: 1, dayBan: 1, soBan: 5, viTriGhe: 16, vaiTro: ["HS"], gioiTinh: 'Nam' },
  { maHS: 'HS17', hoTen: 'Lê Bảo Khanh', tenRutGon: 'L.B.Khanh', to: 1, dayBan: 1, soBan: 4, viTriGhe: 17, vaiTro: ["HS"], gioiTinh: 'Nam' },
  { maHS: 'HS18', hoTen: 'Nguyễn An Khiếu', tenRutGon: 'N.A.Khiếu', to: 3, dayBan: 3, soBan: 4, viTriGhe: 18, vaiTro: ["TT"], toTruongTo: 3, gioiTinh: 'Nam' },
  { maHS: 'HS19', hoTen: 'Nguyễn Đăng Khoa', tenRutGon: 'N.Đ.Khoa', to: 3, dayBan: 3, soBan: 4, viTriGhe: 19, vaiTro: ["HS"], gioiTinh: 'Nam' },
  { maHS: 'HS20', hoTen: 'Trần Võ Anh Khoa', tenRutGon: 'T.V.A.Khoa', to: 1, dayBan: 1, soBan: 5, viTriGhe: 20, vaiTro: ["HS"], gioiTinh: 'Nam' },
  { maHS: 'HS21', hoTen: 'Nguyễn Tấn Kiệt', tenRutGon: 'N.T.Kiệt', to: 4, dayBan: 4, soBan: 1, viTriGhe: 21, vaiTro: ["HS"], gioiTinh: 'Nam' },
  { maHS: 'HS22', hoTen: 'Nguyễn Tuấn Kiệt', tenRutGon: 'N.T.Kiệt', to: 3, dayBan: 3, soBan: 2, viTriGhe: 22, vaiTro: ["HS"], gioiTinh: 'Nam' },
  { maHS: 'HS23', hoTen: 'Phạm Thương Kiều', tenRutGon: 'P.T.Kiều', to: 2, dayBan: 2, soBan: 2, viTriGhe: 23, vaiTro: ["HS"], gioiTinh: 'Nu' },
  { maHS: 'HS24', hoTen: 'Phạm Vũ Gia Minh', tenRutGon: 'P.V.G.Minh', to: 4, dayBan: 4, soBan: 2, viTriGhe: 24, vaiTro: ["HS"], gioiTinh: 'Nam' },
  { maHS: 'HS25', hoTen: 'Nguyễn Phương Nguyên', tenRutGon: 'N.P.Nguyên', to: 3, dayBan: 3, soBan: 5, viTriGhe: 25, vaiTro: ["LT"], gioiTinh: 'Nu' },
  { maHS: 'HS26', hoTen: 'Trịnh Lê Kiều Nhi', tenRutGon: 'T.L.K.Nhi', to: 3, dayBan: 3, soBan: 5, viTriGhe: 26, vaiTro: ["HS"], gioiTinh: 'Nu' },
  { maHS: 'HS27', hoTen: 'Võ Nguyễn Ngọc Nhi', tenRutGon: 'V.N.N.Nhi', to: 2, dayBan: 2, soBan: 4, viTriGhe: 27, vaiTro: ["HS"], gioiTinh: 'Nu' },
  { maHS: 'HS28', hoTen: 'Nguyễn Thị Mỹ Nhung', tenRutGon: 'N.T.M.Nhung', to: 4, dayBan: 4, soBan: 5, viTriGhe: 28, vaiTro: ["CD","TT"], toTruongTo: 4, gioiTinh: 'Nu' },
  { maHS: 'HS29', hoTen: 'Lê Ngọc Quỳnh Như', tenRutGon: 'L.N.Q.Như', to: 2, dayBan: 2, soBan: 4, viTriGhe: 29, vaiTro: ["HS"], gioiTinh: 'Nu' },
  { maHS: 'HS30', hoTen: 'Võ Thị Huỳnh Như', tenRutGon: 'V.T.H.Như', to: 2, dayBan: 2, soBan: 3, viTriGhe: 30, vaiTro: ["HS"], gioiTinh: 'Nu' },
  { maHS: 'HS31', hoTen: 'Phạm Minh Quân', tenRutGon: 'P.M.Quân', to: 2, dayBan: 2, soBan: 3, viTriGhe: 31, vaiTro: ["HS"], gioiTinh: 'Nam' },
  { maHS: 'HS32', hoTen: 'Phan Viết Thắng', tenRutGon: 'P.V.Thắng', to: 3, dayBan: 3, soBan: 6, viTriGhe: 32, vaiTro: ["HS"], gioiTinh: 'Nam' },
  { maHS: 'HS33', hoTen: 'Lê Thị Thanh Thương', tenRutGon: 'L.T.T.Thương', to: 3, dayBan: 3, soBan: 3, viTriGhe: 33, vaiTro: ["LP_HT"], gioiTinh: 'Nu' },
  { maHS: 'HS34', hoTen: 'Trương Hoàng Tiến', tenRutGon: 'T.H.Tiến', to: 4, dayBan: 4, soBan: 4, viTriGhe: 34, vaiTro: ["HS"], gioiTinh: 'Nam' },
  { maHS: 'HS35', hoTen: 'Nguyễn Thị Thùy Trâm', tenRutGon: 'N.T.T.Trâm', to: 1, dayBan: 1, soBan: 4, viTriGhe: 35, vaiTro: ["HS"], gioiTinh: 'Nu' },
  { maHS: 'HS36', hoTen: 'Võ Ngọc Cát Tường', tenRutGon: 'V.N.C.Tường', to: 4, dayBan: 4, soBan: 5, viTriGhe: 36, vaiTro: ["HS"], gioiTinh: 'Nu' },
  { maHS: 'HS37', hoTen: 'Đỗ Tú Uyên', tenRutGon: 'Đ.T.Uyên', to: 4, dayBan: 4, soBan: 3, viTriGhe: 37, vaiTro: ["HS"], gioiTinh: 'Nu' },
  { maHS: 'HS38', hoTen: 'Trần Việt', tenRutGon: 'T.Việt', to: 3, dayBan: 3, soBan: 3, viTriGhe: 38, vaiTro: ["HS"], gioiTinh: 'Nam' },
  { maHS: 'HS39', hoTen: 'Trần Châu Thanh Vương', tenRutGon: 'T.C.T.Vương', to: 2, dayBan: 2, soBan: 5, viTriGhe: 39, vaiTro: ["HS"], gioiTinh: 'Nam' },
  { maHS: 'HS40', hoTen: 'Võ Trần Minh Vương', tenRutGon: 'V.T.M.Vương', to: 2, dayBan: 2, soBan: 2, viTriGhe: 40, vaiTro: ["HS"], gioiTinh: 'Nam' },
  { maHS: 'HS41', hoTen: 'Nguyễn Ngọc Phúc Vy', tenRutGon: 'N.N.P.Vy', to: 4, dayBan: 4, soBan: 3, viTriGhe: 41, vaiTro: ["LP_VT"], gioiTinh: 'Nu' },
  { maHS: 'HS42', hoTen: 'Trần Huỳnh Ngọc Vy', tenRutGon: 'T.H.N.Vy', to: 1, dayBan: 1, soBan: 2, viTriGhe: 42, vaiTro: ["TT"], toTruongTo: 1, gioiTinh: 'Nu' },
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
  {
    "hang": 0,
    "cot": 0,
    "loaiO": "banGV",
    "ghiChu": "Bàn GV"
  },
  {
    "hang": 0,
    "cot": 1,
    "loaiO": "banGV",
    "ghiChu": "Bàn GV"
  },
  {
    "hang": 0,
    "cot": 2,
    "loaiO": "loidi"
  },
  {
    "hang": 0,
    "cot": 3,
    "loaiO": "buc",
    "ghiChu": "Bảng"
  },
  {
    "hang": 0,
    "cot": 4,
    "loaiO": "buc",
    "ghiChu": "Bảng"
  },
  {
    "hang": 0,
    "cot": 5,
    "loaiO": "buc",
    "ghiChu": "Bảng 10A5"
  },
  {
    "hang": 0,
    "cot": 6,
    "loaiO": "buc",
    "ghiChu": "Bảng"
  },
  {
    "hang": 0,
    "cot": 7,
    "loaiO": "buc",
    "ghiChu": "Bảng"
  },
  {
    "hang": 0,
    "cot": 8,
    "loaiO": "loidi"
  },
  {
    "hang": 0,
    "cot": 9,
    "loaiO": "cua",
    "ghiChu": "Cửa chính"
  },
  {
    "hang": 0,
    "cot": 10,
    "loaiO": "cua",
    "ghiChu": "Cửa chính"
  },
  {
    "hang": 1,
    "cot": 0,
    "loaiO": "ghe",
    "maHS": "HS08"
  },
  {
    "hang": 1,
    "cot": 1,
    "loaiO": "ghe",
    "maHS": "HS21"
  },
  {
    "hang": 1,
    "cot": 2,
    "loaiO": "loidi"
  },
  {
    "hang": 1,
    "cot": 3,
    "loaiO": "ghe",
    "maHS": "HS09"
  },
  {
    "hang": 1,
    "cot": 4,
    "loaiO": "ghe",
    "maHS": "HS02"
  },
  {
    "hang": 1,
    "cot": 5,
    "loaiO": "loidi"
  },
  {
    "hang": 1,
    "cot": 6,
    "loaiO": "ghe",
    "maHS": "HS07"
  },
  {
    "hang": 1,
    "cot": 7,
    "loaiO": "ghe",
    "maHS": "HS01"
  },
  {
    "hang": 1,
    "cot": 8,
    "loaiO": "loidi"
  },
  {
    "hang": 1,
    "cot": 9,
    "loaiO": "ghe",
    "maHS": "HS03"
  },
  {
    "hang": 1,
    "cot": 10,
    "loaiO": "ghe",
    "maHS": "HS05"
  },
  {
    "hang": 2,
    "cot": 0,
    "loaiO": "ghe",
    "maHS": "HS11"
  },
  {
    "hang": 2,
    "cot": 1,
    "loaiO": "ghe",
    "maHS": "HS24"
  },
  {
    "hang": 2,
    "cot": 2,
    "loaiO": "loidi"
  },
  {
    "hang": 2,
    "cot": 3,
    "loaiO": "ghe",
    "maHS": "HS13"
  },
  {
    "hang": 2,
    "cot": 4,
    "loaiO": "ghe",
    "maHS": "HS22"
  },
  {
    "hang": 2,
    "cot": 5,
    "loaiO": "loidi"
  },
  {
    "hang": 2,
    "cot": 6,
    "loaiO": "ghe",
    "maHS": "HS23"
  },
  {
    "hang": 2,
    "cot": 7,
    "loaiO": "ghe",
    "maHS": "HS40"
  },
  {
    "hang": 2,
    "cot": 8,
    "loaiO": "loidi"
  },
  {
    "hang": 2,
    "cot": 9,
    "loaiO": "ghe",
    "maHS": "HS04"
  },
  {
    "hang": 2,
    "cot": 10,
    "loaiO": "ghe",
    "maHS": "HS42"
  },
  {
    "hang": 3,
    "cot": 0,
    "loaiO": "ghe",
    "maHS": "HS37"
  },
  {
    "hang": 3,
    "cot": 1,
    "loaiO": "ghe",
    "maHS": "HS41"
  },
  {
    "hang": 3,
    "cot": 2,
    "loaiO": "loidi"
  },
  {
    "hang": 3,
    "cot": 3,
    "loaiO": "ghe",
    "maHS": "HS38"
  },
  {
    "hang": 3,
    "cot": 4,
    "loaiO": "ghe",
    "maHS": "HS33"
  },
  {
    "hang": 3,
    "cot": 5,
    "loaiO": "loidi"
  },
  {
    "hang": 3,
    "cot": 6,
    "loaiO": "ghe",
    "maHS": "HS31"
  },
  {
    "hang": 3,
    "cot": 7,
    "loaiO": "ghe",
    "maHS": "HS30"
  },
  {
    "hang": 3,
    "cot": 8,
    "loaiO": "loidi"
  },
  {
    "hang": 3,
    "cot": 9,
    "loaiO": "ghe",
    "maHS": "HS12"
  },
  {
    "hang": 3,
    "cot": 10,
    "loaiO": "ghe",
    "maHS": "HS10"
  },
  {
    "hang": 4,
    "cot": 0,
    "loaiO": "ghe",
    "maHS": "HS14"
  },
  {
    "hang": 4,
    "cot": 1,
    "loaiO": "ghe",
    "maHS": "HS34"
  },
  {
    "hang": 4,
    "cot": 2,
    "loaiO": "loidi"
  },
  {
    "hang": 4,
    "cot": 3,
    "loaiO": "ghe",
    "maHS": "HS18"
  },
  {
    "hang": 4,
    "cot": 4,
    "loaiO": "ghe",
    "maHS": "HS19"
  },
  {
    "hang": 4,
    "cot": 5,
    "loaiO": "loidi"
  },
  {
    "hang": 4,
    "cot": 6,
    "loaiO": "ghe",
    "maHS": "HS29"
  },
  {
    "hang": 4,
    "cot": 7,
    "loaiO": "ghe",
    "maHS": "HS27"
  },
  {
    "hang": 4,
    "cot": 8,
    "loaiO": "loidi"
  },
  {
    "hang": 4,
    "cot": 9,
    "loaiO": "ghe",
    "maHS": "HS17"
  },
  {
    "hang": 4,
    "cot": 10,
    "loaiO": "ghe",
    "maHS": "HS35"
  },
  {
    "hang": 5,
    "cot": 0,
    "loaiO": "ghe",
    "maHS": "HS28"
  },
  {
    "hang": 5,
    "cot": 1,
    "loaiO": "ghe",
    "maHS": "HS36"
  },
  {
    "hang": 5,
    "cot": 2,
    "loaiO": "loidi"
  },
  {
    "hang": 5,
    "cot": 3,
    "loaiO": "ghe",
    "maHS": "HS25"
  },
  {
    "hang": 5,
    "cot": 4,
    "loaiO": "ghe",
    "maHS": "HS26"
  },
  {
    "hang": 5,
    "cot": 5,
    "loaiO": "loidi"
  },
  {
    "hang": 5,
    "cot": 6,
    "loaiO": "trong",
    "ghiChu": "Chỗ trống Bàn 5 - Tổ 2"
  },
  {
    "hang": 5,
    "cot": 7,
    "loaiO": "ghe",
    "maHS": "HS39"
  },
  {
    "hang": 5,
    "cot": 8,
    "loaiO": "loidi"
  },
  {
    "hang": 5,
    "cot": 9,
    "loaiO": "ghe",
    "maHS": "HS20"
  },
  {
    "hang": 5,
    "cot": 10,
    "loaiO": "ghe",
    "maHS": "HS16"
  },
  {
    "hang": 6,
    "cot": 0,
    "loaiO": "ghe",
    "maHS": "HS06"
  },
  {
    "hang": 6,
    "cot": 1,
    "loaiO": "trong",
    "ghiChu": "Chỗ trống Bàn 6 - Tổ 4"
  },
  {
    "hang": 6,
    "cot": 2,
    "loaiO": "loidi"
  },
  {
    "hang": 6,
    "cot": 3,
    "loaiO": "trong",
    "ghiChu": "Chỗ trống Bàn 6 - Tổ 3"
  },
  {
    "hang": 6,
    "cot": 4,
    "loaiO": "ghe",
    "maHS": "HS32"
  },
  {
    "hang": 6,
    "cot": 5,
    "loaiO": "loidi"
  },
  {
    "hang": 6,
    "cot": 6,
    "loaiO": "ghe",
    "maHS": "HS15"
  },
  {
    "hang": 6,
    "cot": 7,
    "loaiO": "trong",
    "ghiChu": "Chỗ trống Bàn 6 - Tổ 2"
  },
  {
    "hang": 6,
    "cot": 8,
    "loaiO": "loidi"
  },
  {
    "hang": 6,
    "cot": 9,
    "loaiO": "trong",
    "ghiChu": "Chỗ trống Bàn 6 - Tổ 1"
  },
  {
    "hang": 6,
    "cot": 10,
    "loaiO": "trong",
    "ghiChu": "Chỗ trống Bàn 6 - Tổ 1"
  },
  {
    "hang": 7,
    "cot": 0,
    "loaiO": "cua",
    "ghiChu": "Cửa sau"
  },
  {
    "hang": 7,
    "cot": 1,
    "loaiO": "trong"
  },
  {
    "hang": 7,
    "cot": 2,
    "loaiO": "loidi"
  },
  {
    "hang": 7,
    "cot": 3,
    "loaiO": "trong"
  },
  {
    "hang": 7,
    "cot": 4,
    "loaiO": "trong"
  },
  {
    "hang": 7,
    "cot": 5,
    "loaiO": "trong",
    "ghiChu": "Khoảng trống cuối lớp"
  },
  {
    "hang": 7,
    "cot": 6,
    "loaiO": "trong"
  },
  {
    "hang": 7,
    "cot": 7,
    "loaiO": "trong"
  },
  {
    "hang": 7,
    "cot": 8,
    "loaiO": "loidi"
  },
  {
    "hang": 7,
    "cot": 9,
    "loaiO": "trong"
  },
  {
    "hang": 7,
    "cot": 10,
    "loaiO": "trong"
  }
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
