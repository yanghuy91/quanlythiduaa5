/**
 * Type definitions for Quản lý Nề nếp & Thi đua Lớp học 10A5
 */

export type RoleCode = 'HS' | 'TT' | 'LT' | 'BT' | 'PBT' | 'LP_HT' | 'LP_LD' | 'LP_VT' | 'CD' | 'GV';

export interface StudentRoleBadge {
  code: RoleCode;
  label: string;
  shortLabel: string;
  to?: number; // 1, 2, 3, 4 for To truong
}

export interface Student {
  maHS: string;
  hoTen: string;
  tenRutGon: string;
  to: number; // 1 | 2 | 3 | 4
  dayBan: number; // 1 to 6
  soBan: number; // 1 to 4
  viTriGhe: number; // 1 to 42
  vaiTro: RoleCode[];
  toTruongTo?: number; // 1..4 if TT
  sdtPhuHuynh?: string;
  avatarSeed?: string;
  avatarUrl?: string; // Base64 data URL or custom image URL
  gioiTinh?: 'Nam' | 'Nu'; // Male or Female
  ngaySinh?: string;
  activeFrameId?: string;
  customFrameId?: string; // Optional custom avatar frame ID
  customBadgeIds?: string[]; // Optional custom honor badge IDs
}

export type SeatNodeType = 'ghe' | 'trong' | 'loidi' | 'banGV' | 'cua' | 'buc';

export interface SeatLayoutNode {
  hang: number;
  cot: number;
  loaiO: SeatNodeType;
  maHS?: string;
  ghiChu?: string;
}

export type PointType = 'Tru' | 'Cong';
export type SeverityLevel = 'Nhe' | 'Vua' | 'Nang';

export interface RuleItem {
  maNoiQuy: string;
  nhomHanhVi: string; // Chuyên cần, Học tập, Nề nếp, Phong trào, Lao động - Vệ sinh, Điểm cộng
  tenHanhVi: string;
  loaiDiem: PointType;
  diemSo: number; // positive number, applied according to loaiDiem
  mucDo: SeverityLevel;
  ghim: boolean;
  thuTu: number;
}

export type RecordStatus = 
  | 'HieuLuc' 
  | 'ChoDuyet' 
  | 'DaChapNhan' 
  | 'BiTuChoi' 
  | 'DaHuy' 
  | 'ChoXacNhanTrung';

export interface TimeHierarchy {
  namHoc: string; // vd: '2026-2027'
  hocKi: 1 | 2;   // Học kì 1 hoặc 2
  thang: number;  // Tháng 1..12
  tuanHoc: number; // Tuần 1..35
  ngayHoc: string; // YYYY-MM-DD
  buoi: 'Sang' | 'Chieu'; // Buổi sáng hoặc chiều
}

export type PeriodLevel = 'namHoc' | 'hocKi' | 'thang' | 'tuanHoc' | 'ngayHoc' | 'buoi';

export interface HierarchyPeriodFilter {
  namHoc: string; // vd: '2026-2027'
  hocKi: 1 | 2 | 'all';
  thang: number | 'all';
  tuanHoc: number | 'all';
  ngayHoc: string | 'all';
  buoi: 'Sang' | 'Chieu' | 'all';
}

export interface DisciplineRecord {
  maGhiNhan: string; // UUID
  thoiGianMayChu: string; // ISO string
  thoiGianMay: string;
  namHoc: string; // 2026-2027
  hocKi: 1 | 2;
  thang: number; // 9, 10, 11...
  tuanHoc: number;
  ngayHoc: string; // YYYY-MM-DD
  buoi: 'Sang' | 'Chieu';
  doiTuong: 'HocSinh' | 'To';
  maHS: string;
  hoTen: string;
  to: number;
  maNoiQuy: string;
  nhomHanhVi: string;
  tenHanhVi: string;
  mucDo: SeverityLevel;
  diemSo: number;
  loaiDiem: PointType;
  ghiChu?: string;
  nguoiGhi: string;
  vaiTroNguoiGhi: RoleCode;
  nguonGhi: 'TrucTiep' | 'NgoaiTuyen' | 'NhapTep' | 'NhapVanBan';
  loaiThietBi?: string;
  maLoNhap?: string;
  lanThuTrongBuoi: number;
  daXacNhanTrung: boolean;
  trangThai: RecordStatus;
  noiDungGiaiTrinh?: string;
  thoiGianGiaiTrinh?: string;
  nguoiDuyet?: string;
  ketQuaDuyet?: 'ChapNhan' | 'TuChoi';
  lyDoDuyet?: string;
  lyDoHuy?: string;
  thoiGianHuy?: string;
}

export type WeekEvaluation = 'Tot' | 'Kha' | 'Dat' | 'ChuaDat' | string;

export type RatingColorKey = 'emerald' | 'teal' | 'sky' | 'indigo' | 'purple' | 'amber' | 'orange' | 'rose' | 'slate';

export interface ScoreRatingTier {
  id: string;
  label: string;
  minScore: number;
  color: RatingColorKey;
  icon?: string;
}

export type StatusColorLevel = 'none' | 'warn' | 'bad' | 'ok';

export type CadreDelegatedPermission =
  | 'CHAM_CA_LOP'
  | 'DUYET_GIAI_TRINH'
  | 'HUY_MOI_GHI_NHAN'
  | 'QUAN_LY_TUAN'
  | 'QUAN_LY_VINH_DANH'
  | 'GOI_TEN_TRO_CHOI';

export interface StudentWeekSummary {
  maHS: string;
  hoTen: string;
  to: number;
  tuanHoc: number;
  diemKhoiDau: number;
  tongDiemTru: number;
  tongDiemCong: number;
  diemHienTai: number;
  xepLoai: WeekEvaluation;
  mucMau: StatusColorLevel;
  soLoiTrongTuan: number;
  coLoiNang: boolean;
  chuaCoDiem?: boolean;
  lyDoChuaCoDiem?: 'future' | 'no_data';
}

export interface StudentPeriodSummary {
  maHS: string;
  hoTen: string;
  to: number;
  diemTrungBinh: number;
  tongDiemTru: number;
  tongDiemCong: number;
  soLoi: number;
  xepLoai: WeekEvaluation;
  mucMau: StatusColorLevel;
  chuaCoDiem?: boolean;
  lyDoChuaCoDiem?: 'future' | 'no_data';
  lichSuTuan: {
    tuanHoc: number;
    diem: number;
    soLoi: number;
    chuaCoDiem?: boolean;
    lyDoChuaCoDiem?: 'future' | 'no_data';
  }[];
}

export interface TeacherSettings {
  diemKhoiDau: number;
  nguongTot: number; // >= 90
  nguongKha: number; // >= 75
  nguongDat: number; // >= 60
  phanLoaiDiem?: ScoreRatingTier[]; // Danh sách phân loại theo điểm tùy biến linh hoạt của Giáo viên
  batDiemCong: boolean; // default false
  batDiemThuongGoLoi: boolean; // default false
  tranDiemBu: number; // default 50%
  thoiHanSuaHuyPhut: number; // default 1440 (24h), 0 = Không giới hạn (dành cho HS / BCS)
  thoiHanSuaDuLieuGVPhut?: number; // default 0 = Không giới hạn (dành cho Giáo viên)
  toTruongTuCham: boolean; // default false
  hocSinhThayMau: 'CaLop' | 'ChiBanThan';
  hanGuiGiaiTrinhNgay: number; // default 7 days, 0 = Không giới hạn
  nguoiDuyetGiaiTrinh: 'GV' | 'GV_va_BCS';
  mocBuoiSang: string; // '06:30-11:30'
  mocBuoiChieu: string; // '12:30-17:30'
  khoaKhanCap: boolean;
  maLop: string; // '10A5DP'
  choPhepXemDiemMon: boolean; // Bật / tắt cho học sinh xem điểm môn học
  choPhepTrungAvatar: boolean; // Bật / tắt cho phép học sinh dùng chung / trùng Avatar trong lớp
  noDataWeeks?: number[]; // Các tuần được GV đánh dấu không có dữ liệu / nghỉ (không tính điểm)
  cadreDelegatedPermissions?: Record<string, CadreDelegatedPermission[]>; // Phân quyền của GV cho từng Ban cán sự (key: maHS)
  tuDongChuyenTuan?: boolean; // Tự động chuyển sang tuần kế tiếp vào mỗi Thứ 2 hàng tuần theo thời gian thực
  tuanGocTuDong?: number; // Tuần mốc khi GV thiết lập tuần hiện tại
  ngayThietLapTuanGoc?: string; // Ngày Thứ 2 đầu tuần (YYYY-MM-DD) lúc GV thiết lập tuần mốc
  tuanBatDauTinhDiem?: number; // Mốc tuần bắt đầu tính điểm nề nếp (mặc định: 1)
  ngayBatDauTinhDiem?: string; // Mốc ngày cụ thể bắt đầu tính điểm nề nếp (YYYY-MM-DD, tùy chọn)
  tuDongTraoHuyHieu?: boolean; // Chế độ tự động xét và trao huy hiệu theo điều kiện (mặc định: true)
  tuanBatDauXetHuyHieu?: number; // Mốc tuần bắt đầu tính điều kiện trao huy hiệu tự động
  ngayBatDauXetHuyHieu?: string; // Mốc ngày bắt đầu tính điều kiện trao huy hiệu tự động (YYYY-MM-DD)
  bannerSloganText?: string; // Tùy chỉnh câu khẩu hiệu lớp trên Banner
  bannerSloganIcon?: string; // Biểu tượng sinh động
  bannerSloganColor?: string; // Màu sắc chữ khẩu hiệu
  bannerSloganStyle?: 'italic' | 'normal' | 'bold'; // Định dạng kiểu chữ
}

export type ActiveTab = 'my_page' | 'seating' | 'personal_log' | 'overview' | 'rules' | 'settings' | 'import_export' | 'audit_log' | 'apps' | 'grades';

// --- MÔ ĐUN QUẢN LÝ ĐIỂM MÔN HỌC (ACADEMIC GRADEBOOK) ---
export interface SubjectDefinition {
  id: string; // e.g., 'toan', 'van', 'anh', 'ly', 'hoa', 'sinh', 'su', 'dia', 'gdcd', 'tin', 'cn', 'qp', 'td', 'hdtn'
  name: string; // e.g., 'Toán học'
  shortName: string; // e.g., 'Toán'
  icon: string; // icon symbol or emoji
  type: 'score' | 'evaluate'; // 'score': 0..10, 'evaluate': 'Đ' | 'CĐ'
  category: 'core' | 'science' | 'social' | 'special';
  order: number;
}

export interface SubjectScore {
  subjectId: string;
  tx: (number | null)[]; // Các cột điểm kiểm tra thường xuyên (tx1, tx2, tx3, tx4 - hệ số 1)
  gk: number | null; // Điểm giữa kỳ (hệ số 2)
  ck: number | null; // Điểm cuối kỳ (hệ số 3)
  tb: number | null; // Điểm trung bình môn (làm tròn 1 chữ số thập phân)
  evaluateResult?: 'Đ' | 'CĐ'; // Dành cho các môn nhận xét (GDTC, HĐTN-HN, GDĐP)
  note?: string; // Nhận xét giáo viên bộ môn
}

export type AcademicStanding = 'Xuất sắc' | 'Giỏi' | 'Khá' | 'Đạt' | 'Chưa đạt';

export interface StudentAcademicRecord {
  maHS: string;
  hoTen: string;
  to: number;
  hocKi: 1 | 2;
  namHoc: string;
  subjects: Record<string, SubjectScore>; // key is subjectId
  diemTBChung: number | null; // ĐTB tất cả các môn tính điểm
  hocLuc: AcademicStanding | null;
  danhHieu: 'Học sinh Xuất sắc' | 'Học sinh Giỏi' | 'Học sinh Tiên tiến' | null;
  nhanXetGVCN?: string;
  ngayCapNhat: string;
}

export type ViolationRecord = DisciplineRecord;
export type AcademicRecord = StudentAcademicRecord;
export type ClassSettings = TeacherSettings;
export type ViolationRule = RuleItem;

