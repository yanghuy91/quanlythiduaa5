import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Download,
  Copy,
  Check,
  Users,
  Grid,
  ClipboardList,
  GraduationCap,
  Database,
  RefreshCw,
  FileText,
  Trash2,
  BookOpen,
  Layers,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  Student,
  SeatLayoutNode,
  DisciplineRecord,
  RuleItem,
  TeacherSettings,
  StudentAcademicRecord,
  SubjectScore,
  RoleCode,
} from '../../types';
import {
  DEFAULT_SUBJECTS,
  calculateSubjectAverage,
  calculateOverallGPA,
  evaluateAcademicStanding,
  saveAcademicRecords,
} from '../../data/academicCatalog';
import {
  exportDataSpecsWordDocument,
  downloadUnifiedExcelTemplate,
  exportCurrentClassToUnifiedExcel,
  AI_MASTER_PROMPT_TEXT,
} from '../../utils/exportDataSpecsDoc';

interface UniversalSmartImportSectionProps {
  students: Student[];
  layout: SeatLayoutNode[];
  records: DisciplineRecord[];
  rules: RuleItem[];
  settings: TeacherSettings;
  academicRecords?: StudentAcademicRecord[];
  onUpdateStudentsAndLayout: (newStudents: Student[], newLayout: SeatLayoutNode[], isReplace: boolean) => void;
  onAddRecords: (newRecords: DisciplineRecord[]) => void;
  onUpdateAcademicRecords?: (newRecords: StudentAcademicRecord[]) => void;
  onRestoreFullBackup: (payload: {
    students?: Student[];
    layout?: SeatLayoutNode[];
    records?: DisciplineRecord[];
    rules?: RuleItem[];
    settings?: Partial<TeacherSettings>;
    academicRecords?: StudentAcademicRecord[];
  }) => void;
  onOpenStudentImportModal: () => void;
  onOpenLayoutEditor: () => void;
  onSwitchToGradesTab: () => void;
  onShowToast: (msg: string, sub?: string) => void;
}

interface UnifiedParsedPackage {
  sourceName: string;
  isJsonBackup: boolean;
  rawJsonPayload?: any;
  students: Student[];
  hasStudentRoster: boolean;
  academicRecords: StudentAcademicRecord[];
  gradesCount: number;
  disciplineRecords: DisciplineRecord[];
  summaryNotes: string[];
}

// Chuẩn hóa chuỗi tiếng Việt để so khớp tên cột linh hoạt
function normalizeHeader(str: any): string {
  return String(str || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ');
}

function guessGenderFromName(fullName: string): 'Nam' | 'Nu' {
  const lower = fullName.toLowerCase().trim();
  if (
    lower.includes('thị') ||
    lower.includes('thuý') ||
    lower.includes('thúy') ||
    lower.includes('hương') ||
    lower.includes('ngọc') ||
    lower.includes('linh') ||
    lower.includes('hoa') ||
    lower.includes('thảo') ||
    lower.includes('nhung') ||
    lower.includes('mai') ||
    lower.includes('trâm') ||
    lower.includes('trang') ||
    lower.includes('yến') ||
    lower.includes('lan') ||
    lower.includes('hà') ||
    lower.includes('vy') ||
    lower.includes('nhi') ||
    lower.includes('anh') && lower.includes('ngọc')
  ) {
    return 'Nu';
  }
  return 'Nam';
}

function makeShortName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return fullName.trim();
  return parts.map((w, i) => (i < parts.length - 1 ? `${w[0]?.toUpperCase() || ''}.` : w)).join('');
}

function parseRoleCodes(rawRole: string, to: number): { vaiTro: RoleCode[]; toTruongTo?: number } {
  if (!rawRole || !rawRole.trim()) {
    return { vaiTro: ['HS'] };
  }
  const upper = rawRole.toUpperCase();
  const norm = normalizeHeader(rawRole);
  const roles = new Set<RoleCode>(['HS']);
  let toTruongTo: number | undefined = undefined;

  if (upper.includes('LT') || norm.includes('lop truong')) {
    roles.add('LT');
  }
  if (upper.includes('BT') || norm.includes('bi thu')) {
    roles.add('BT');
  }
  if (upper.includes('LP_HT') || norm.includes('lop pho hoc tap') || norm.includes('lp hoc tap')) {
    roles.add('LP_HT');
  }
  if (upper.includes('LP_LD') || norm.includes('lop pho lao dong') || norm.includes('lp lao dong')) {
    roles.add('LP_LD');
  }
  if (upper.includes('TT') || norm.includes('to truong')) {
    roles.add('TT');
    toTruongTo = to;
  }

  // Đặt vai trò cán bộ lên trước 'HS'
  const ordered: RoleCode[] = [
    ...Array.from(roles).filter(r => r !== 'HS'),
    'HS',
  ];
  return { vaiTro: ordered, toTruongTo };
}

/**
 * Xây dựng sơ đồ lớp đồng bộ từ danh sách học sinh (hỗ trợ cả tọa độ bàn có sẵn hoặc tự động xếp theo 4 Tổ)
 */
export function buildSynchronizedLayoutForStudents(studentsList: Student[]): SeatLayoutNode[] {
  const maxStudentsPerGroup = Math.max(
    1,
    ...[1, 2, 3, 4].map(g => studentsList.filter(s => s.to === g).length)
  );
  const maxExplicitRow = Math.max(0, ...studentsList.map(s => s.soBan || 0));
  const totalRowsNeeded = Math.max(6, Math.ceil(maxStudentsPerGroup / 2), maxExplicitRow);

  const layoutNodes: SeatLayoutNode[] = [
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
  ];

  const toGroups: Record<number, Student[]> = {
    1: studentsList.filter(s => s.to === 1),
    2: studentsList.filter(s => s.to === 2),
    3: studentsList.filter(s => s.to === 3),
    4: studentsList.filter(s => s.to === 4),
  };

  const getStudentForSeat = (groupNum: number, hang: number, isRightSeat: boolean): string | undefined => {
    const groupList = toGroups[groupNum] || [];
    const idx = (hang - 1) * 2 + (isRightSeat ? 1 : 0);
    return groupList[idx]?.maHS;
  };

  for (let h = 1; h <= totalRowsNeeded; h++) {
    // Dãy 4 (Tổ 4): cột 0, 1
    layoutNodes.push({ hang: h, cot: 0, loaiO: 'ghe', maHS: getStudentForSeat(4, h, false) });
    layoutNodes.push({ hang: h, cot: 1, loaiO: 'ghe', maHS: getStudentForSeat(4, h, true) });
    layoutNodes.push({ hang: h, cot: 2, loaiO: 'loidi' });

    // Dãy 3 (Tổ 3): cột 3, 4
    layoutNodes.push({ hang: h, cot: 3, loaiO: 'ghe', maHS: getStudentForSeat(3, h, false) });
    layoutNodes.push({ hang: h, cot: 4, loaiO: 'ghe', maHS: getStudentForSeat(3, h, true) });
    layoutNodes.push({ hang: h, cot: 5, loaiO: 'loidi' });

    // Dãy 2 (Tổ 2): cột 6, 7
    layoutNodes.push({ hang: h, cot: 6, loaiO: 'ghe', maHS: getStudentForSeat(2, h, false) });
    layoutNodes.push({ hang: h, cot: 7, loaiO: 'ghe', maHS: getStudentForSeat(2, h, true) });
    layoutNodes.push({ hang: h, cot: 8, loaiO: 'loidi' });

    // Dãy 1 (Tổ 1): cột 9, 10
    layoutNodes.push({ hang: h, cot: 9, loaiO: 'ghe', maHS: getStudentForSeat(1, h, false) });
    layoutNodes.push({ hang: h, cot: 10, loaiO: 'ghe', maHS: getStudentForSeat(1, h, true) });
  }

  return layoutNodes;
}

// Danh sách từ khóa nhận diện các môn học trong bảng tổng hợp hoặc vnEdu
const SUBJECT_HEADER_ALIASES: Record<string, string[]> = {
  toan: ['toan', 'toan hoc'],
  van: ['ngu van', 'van'],
  anh: ['tieng anh', 'ngoai ngu', 'anh'],
  ly: ['vat li', 'vat ly', 'li', 'ly'],
  hoa: ['hoa hoc', 'hoa'],
  sinh: ['sinh hoc', 'sinh'],
  su: ['lich su', 'su'],
  dia: ['dia li', 'dia ly', 'dia'],
  gdcd: ['gdkt&pl', 'gdkt & pl', 'gdktpl', 'gdcd', 'kinh te phap luat'],
  tin: ['tin hoc', 'tin'],
  cn: ['cong nghe', 'cn'],
  qp: ['gdqp-an', 'gdqp - an', 'gdqp', 'quoc phong'],
  td: ['gdtc', 'giao duc the chat', 'the duc'],
  hdtn: ['hdtn-hn', 'hdtn, hn', 'hdtn', 'trai nghiem'],
};

export const UniversalSmartImportSection: React.FC<UniversalSmartImportSectionProps> = ({
  students,
  layout,
  records,
  rules,
  settings,
  academicRecords = [],
  onUpdateStudentsAndLayout,
  onAddRecords,
  onUpdateAcademicRecords,
  onRestoreFullBackup,
  onOpenStudentImportModal,
  onOpenLayoutEditor,
  onSwitchToGradesTab,
  onShowToast,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [rosterImportMode, setRosterImportMode] = useState<'replace' | 'append'>('replace');
  const [parsedPackage, setParsedPackage] = useState<UnifiedParsedPackage | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<{ title: string; sub?: string } | null>(null);

  const universalFileInputRef = useRef<HTMLInputElement>(null);

  const triggerToast = (msg: string, sub?: string) => {
    setStatusBanner({ title: msg, sub });
    onShowToast(msg, sub);
    setTimeout(() => {
      setStatusBanner(prev => (prev?.title === msg ? null : prev));
    }, 6000);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(AI_MASTER_PROMPT_TEXT);
    setCopiedPrompt(true);
    triggerToast('Đã sao chép Câu lệnh AI chuẩn!', 'Thầy hãy dán kèm ảnh/tài liệu vào ChatGPT hoặc Gemini.');
    setTimeout(() => setCopiedPrompt(false), 3000);
  };

  const handleExportFullJson = () => {
    const payload = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      className: '10A5',
      students,
      layout,
      records,
      academicRecords,
      rules,
      settings,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sao_Luu_10A5_Day_Du_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('Đã tải xuống file sao lưu JSON (.json)');
  };

  /**
   * Bộ phân tích Hợp Nhất 1-File (Đọc tất cả các Sheet trong Excel hoặc Bảng văn bản)
   * Trích xuất đồng thời: Danh sách HS + Tổ + Chức vụ + Chỗ ngồi + Điểm môn học + Nề nếp
   */
  const parseSheetsToUnifiedPackage = (
    sheets: { sheetName: string; rows: any[][] }[],
    sourceName: string
  ): UnifiedParsedPackage => {
    const extractedStudents: Student[] = [];
    const extractedAcademicMap = new Map<string, StudentAcademicRecord>();
    const extractedDiscipline: DisciplineRecord[] = [];
    const summaryNotes: string[] = [];

    for (const { sheetName, rows } of sheets) {
      const normSheetName = normalizeHeader(sheetName);
      if (normSheetName.includes('huongdan') || normSheetName.includes('huong dan')) {
        continue;
      }

      const validRows = rows.filter(
        r => Array.isArray(r) && r.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')
      );
      if (validRows.length === 0) continue;

      // Tìm dòng tiêu đề trong 12 dòng đầu
      let headerRowIdx = -1;
      let colMaHS = -1;
      let colHoTen = -1;
      let colGioiTinh = -1;
      let colNgaySinh = -1;
      let colTo = -1;
      let colChucVu = -1;
      let colDayBan = -1;
      let colSoBan = -1;
      let colSDT = -1;
      let colNhanXet = -1;

      // Cột nề nếp
      let colNgayHoc = -1;
      let colBuoi = -1;
      let colTuan = -1;
      let colNhomHanhVi = -1;
      let colTenHanhVi = -1;
      let colLoaiDiem = -1;
      let colSoDiem = -1;
      let colGhiChu = -1;

      // Cột điểm môn học: subjectId -> { tbCol, txCols, gkCol, ckCol }
      const subjectCols: Record<
        string,
        { tbCol?: number; txCols: number[]; gkCol?: number; ckCol?: number }
      > = {};

      for (let r = 0; r < Math.min(12, validRows.length); r++) {
        const row = validRows[r];
        let matchedHeaders = 0;

        row.forEach((cell, cIdx) => {
          const norm = normalizeHeader(cell);
          if (!norm) return;

          if (norm === 'ma hs' || norm === 'ma hoc sinh' || norm === 'mahs') {
            colMaHS = cIdx;
            matchedHeaders++;
          } else if (
            norm === 'ho va ten' ||
            norm === 'ho ten' ||
            norm === 'ten hoc sinh' ||
            norm === 'ma hoac ho ten hs' ||
            norm === 'hoc sinh'
          ) {
            colHoTen = cIdx;
            matchedHeaders++;
          } else if (norm === 'gioi tinh' || norm === 'phai' || norm === 'nam/nu') {
            colGioiTinh = cIdx;
            matchedHeaders++;
          } else if (norm === 'ngay sinh' || norm === 'nam sinh') {
            colNgaySinh = cIdx;
            matchedHeaders++;
          } else if (norm === 'to' || norm === 'nhom') {
            colTo = cIdx;
            matchedHeaders++;
          } else if (norm === 'chuc vu' || norm === 'vai tro' || norm === 'ban can su') {
            colChucVu = cIdx;
            matchedHeaders++;
          } else if (norm === 'day ban' || norm === 'day') {
            colDayBan = cIdx;
            matchedHeaders++;
          } else if (norm === 'so ban' || norm === 'ban') {
            colSoBan = cIdx;
            matchedHeaders++;
          } else if (norm.includes('sdt') || norm.includes('dien thoai')) {
            colSDT = cIdx;
          } else if (norm.includes('nhan xet')) {
            colNhanXet = cIdx;
          } else if (norm === 'ngay hoc' || norm === 'ngay' || norm.startsWith('ngay hoc')) {
            colNgayHoc = cIdx;
            matchedHeaders++;
          } else if (norm === 'buoi' || norm.startsWith('buoi')) {
            colBuoi = cIdx;
            matchedHeaders++;
          } else if (norm === 'tuan' || norm === 'tuan hoc') {
            colTuan = cIdx;
          } else if (norm === 'nhom hanh vi' || norm === 'nhom loi') {
            colNhomHanhVi = cIdx;
          } else if (
            norm === 'noi dung hanh vi' ||
            norm === 'ten hanh vi' ||
            norm === 'hanh vi' ||
            norm === 'vi pham' ||
            norm === 'noi dung vi pham'
          ) {
            colTenHanhVi = cIdx;
            matchedHeaders++;
          } else if (norm === 'loai diem' || norm.startsWith('loai diem')) {
            colLoaiDiem = cIdx;
            matchedHeaders++;
          } else if (norm === 'so diem' || norm === 'diem so' || norm === 'diem tru/cong') {
            colSoDiem = cIdx;
            matchedHeaders++;
          } else if (norm === 'ghi chu') {
            colGhiChu = cIdx;
          } else {
            // Kiểm tra xem có phải cột môn học không
            for (const subj of DEFAULT_SUBJECTS) {
              const aliases = SUBJECT_HEADER_ALIASES[subj.id] || [normalizeHeader(subj.shortName)];
              const matchedAlias = aliases.some(
                a =>
                  norm === a ||
                  norm.startsWith(a + ' (') ||
                  norm.startsWith(a + ' -') ||
                  norm === `dtb ${a}` ||
                  norm === `diem ${a}`
              );
              if (matchedAlias) {
                if (!subjectCols[subj.id]) {
                  subjectCols[subj.id] = { txCols: [] };
                }
                if (norm.includes('tx') || norm.includes('thuong xuyen') || norm.includes('mieng') || norm.includes('15p')) {
                  subjectCols[subj.id].txCols.push(cIdx);
                } else if (norm.includes('gk') || norm.includes('giua ky') || norm.includes('giua ki')) {
                  subjectCols[subj.id].gkCol = cIdx;
                } else if (norm.includes('ck') || norm.includes('cuoi ky') || norm.includes('cuoi ki')) {
                  subjectCols[subj.id].ckCol = cIdx;
                } else {
                  subjectCols[subj.id].tbCol = cIdx;
                }
                matchedHeaders++;
                break;
              }
            }
          }
        });

        if (matchedHeaders >= 2 || colHoTen !== -1 || colTenHanhVi !== -1) {
          headerRowIdx = r;
          break;
        }
      }

      const isDisciplineSheet =
        colTenHanhVi !== -1 ||
        colLoaiDiem !== -1 ||
        normSheetName.includes('nenep') ||
        normSheetName.includes('vi pham');

      const startRow = headerRowIdx !== -1 ? headerRowIdx + 1 : 0;

      // TRƯỜNG HỢP 1: BẢNG NHẬT KÝ NỀ NẾP / VI PHẠM
      if (isDisciplineSheet && colTenHanhVi !== -1) {
        const poolStudents = extractedStudents.length > 0 ? extractedStudents : students;

        for (let r = startRow; r < validRows.length; r++) {
          const row = validRows[r];
          const behaviorText = String(row[colTenHanhVi] || '').trim();
          if (!behaviorText || normalizeHeader(behaviorText).includes('noi dung hanh vi')) continue;

          const rawStudentRef = colHoTen !== -1 ? String(row[colHoTen] || '').trim() : colMaHS !== -1 ? String(row[colMaHS] || '').trim() : '';
          if (!rawStudentRef) continue;

          const matchedStudent = poolStudents.find(
            s =>
              s.maHS.toLowerCase() === rawStudentRef.toLowerCase() ||
              s.hoTen.toLowerCase() === rawStudentRef.toLowerCase() ||
              s.hoTen.toLowerCase().includes(rawStudentRef.toLowerCase())
          );

          const rawDate = colNgayHoc !== -1 ? String(row[colNgayHoc] || '').trim() : '';
          const ngayHoc = rawDate.match(/^\d{4}-\d{2}-\d{2}$/)
            ? rawDate
            : new Date().toISOString().split('T')[0];

          const rawBuoi = colBuoi !== -1 ? normalizeHeader(row[colBuoi]) : 'sang';
          const buoi: 'Sang' | 'Chieu' = rawBuoi.includes('chieu') ? 'Chieu' : 'Sang';

          const tuanHoc = colTuan !== -1 && Number(row[colTuan]) > 0 ? Number(row[colTuan]) : 10;
          const toNum =
            colTo !== -1 && Number(row[colTo]) >= 1 && Number(row[colTo]) <= 4
              ? Number(row[colTo])
              : matchedStudent?.to || 1;

          const rawLoai = colLoaiDiem !== -1 ? normalizeHeader(row[colLoaiDiem]) : '';
          const rawScoreNum = colSoDiem !== -1 ? Number(row[colSoDiem]) : 2;
          const loaiDiem: 'Tru' | 'Cong' =
            rawLoai.includes('cong') || rawLoai.includes('+') || rawScoreNum > 0 && rawLoai.includes('thuong')
              ? 'Cong'
              : 'Tru';
          const diemSo = Math.abs(rawScoreNum) || 2;
          const nhomHanhVi =
            colNhomHanhVi !== -1 && row[colNhomHanhVi]
              ? String(row[colNhomHanhVi]).trim()
              : loaiDiem === 'Cong'
                ? 'Điểm cộng'
                : 'Nề nếp';

          extractedDiscipline.push({
            maGhiNhan: `IMP-${Date.now()}-${extractedDiscipline.length + 1}`,
            thoiGianMayChu: new Date().toISOString(),
            thoiGianMay: new Date().toISOString(),
            namHoc: '2026-2027',
            hocKi: 1,
            thang: Number(ngayHoc.split('-')[1]) || 11,
            tuanHoc,
            ngayHoc,
            buoi,
            doiTuong: 'HocSinh',
            maHS: matchedStudent?.maHS || `HS01`,
            hoTen: matchedStudent?.hoTen || rawStudentRef,
            to: toNum,
            maNoiQuy: loaiDiem === 'Cong' ? 'NQ_CONG' : 'NQ_VIPHAM',
            nhomHanhVi,
            tenHanhVi: behaviorText,
            mucDo: diemSo >= 5 ? 'Nang' : diemSo >= 3 ? 'Vua' : 'Nhe',
            diemSo,
            loaiDiem,
            ghiChu: colGhiChu !== -1 && row[colGhiChu] ? String(row[colGhiChu]).trim() : undefined,
            nguoiGhi: 'Giáo viên chủ nhiệm',
            vaiTroNguoiGhi: 'GV',
            nguonGhi: 'NhapTep',
            lanThuTrongBuoi: 1,
            daXacNhanTrung: true,
            trangThai: 'HieuLuc',
          });
        }
        continue;
      }

      // TRƯỜNG HỢP 2: BẢNG DANH SÁCH HỌC SINH + CHỖ NGỒI + ĐIỂM MÔN HỌC
      const hasSubjectColumns = Object.keys(subjectCols).length > 0;

      for (let r = startRow; r < validRows.length; r++) {
        const row = validRows[r];
        let hoTen = '';

        if (colHoTen !== -1 && row[colHoTen] !== undefined && row[colHoTen] !== null) {
          hoTen = String(row[colHoTen]).trim();
        } else {
          // Tự động tìm ô chứa tên người nếu file không có dòng tiêu đề chuẩn
          for (let c = 0; c < Math.min(4, row.length); c++) {
            const val = String(row[c] || '').trim();
            if (val.length >= 3 && !val.match(/^\d+$/) && !val.match(/^hs\d+$/i) && val.includes(' ')) {
              hoTen = val;
              break;
            }
          }
        }

        const normName = normalizeHeader(hoTen);
        if (
          !hoTen ||
          hoTen.length < 2 ||
          normName === 'ho va ten' ||
          normName === 'ho ten' ||
          normName === 'stt' ||
          normName.startsWith(' hướng dẫn') ||
          normName.startsWith('nguyen tac')
        ) {
          continue;
        }

        // Tìm hoặc tạo học sinh
        let studentIdx = extractedStudents.findIndex(
          s => normalizeHeader(s.hoTen) === normName
        );
        const orderNumber = studentIdx !== -1 ? studentIdx + 1 : extractedStudents.length + 1;

        const rawMa = colMaHS !== -1 && row[colMaHS] ? String(row[colMaHS]).trim().toUpperCase() : '';
        const maHS = rawMa.match(/^HS\d+$/i)
          ? rawMa
          : `HS${orderNumber < 10 ? '0' + orderNumber : orderNumber}`;

        // Giới tính
        let gioiTinh: 'Nam' | 'Nu' = guessGenderFromName(hoTen);
        if (colGioiTinh !== -1 && row[colGioiTinh]) {
          const gNorm = normalizeHeader(row[colGioiTinh]);
          if (gNorm === 'nu' || gNorm === 'f' || gNorm === 'gai' || gNorm === 'x') {
            gioiTinh = 'Nu';
          } else if (gNorm === 'nam' || gNorm === 'm' || gNorm === 'trai') {
            gioiTinh = 'Nam';
          }
        }

        // Tổ (1..4)
        let to: 1 | 2 | 3 | 4 = (((orderNumber - 1) % 4) + 1) as 1 | 2 | 3 | 4;
        if (colTo !== -1 && row[colTo]) {
          const m = String(row[colTo]).match(/[1-4]/);
          if (m) to = Number(m[0]) as 1 | 2 | 3 | 4;
        }

        // Chức vụ
        const rawRole = colChucVu !== -1 && row[colChucVu] ? String(row[colChucVu]) : '';
        const { vaiTro, toTruongTo } = parseRoleCodes(rawRole, to);

        // Dãy bàn & Số bàn
        const dayBan =
          colDayBan !== -1 && Number(row[colDayBan]) >= 1 && Number(row[colDayBan]) <= 4
            ? Number(row[colDayBan])
            : to;
        const soBan =
          colSoBan !== -1 && Number(row[colSoBan]) >= 1 && Number(row[colSoBan]) <= 8
            ? Number(row[colSoBan])
            : Math.min(6, Math.floor((orderNumber - 1) / 8) + 1);

        const ngaySinh = colNgaySinh !== -1 && row[colNgaySinh] ? String(row[colNgaySinh]).trim() : undefined;
        const sdtPhuHuynh = colSDT !== -1 && row[colSDT] ? String(row[colSDT]).trim() : undefined;

        const studentObj: Student = {
          maHS,
          hoTen,
          tenRutGon: makeShortName(hoTen),
          gioiTinh,
          to,
          dayBan,
          soBan,
          viTriGhe: orderNumber,
          vaiTro,
          toTruongTo,
          ngaySinh,
          sdtPhuHuynh,
        };

        if (studentIdx === -1) {
          extractedStudents.push(studentObj);
        } else {
          extractedStudents[studentIdx] = {
            ...extractedStudents[studentIdx],
            ...studentObj,
          };
        }

        // Nếu có các cột Điểm môn học trên cùng dòng này -> Trích xuất bảng điểm
        if (hasSubjectColumns) {
          const subjectsRecord: Record<string, SubjectScore> = {};
          let hasAnyValidScoreOnRow = false;

          for (const subj of DEFAULT_SUBJECTS) {
            const colCfg = subjectCols[subj.id];
            if (!colCfg) continue;

            if (subj.type === 'evaluate') {
              const rawEval = colCfg.tbCol !== undefined ? String(row[colCfg.tbCol] || '').trim().toUpperCase() : '';
              if (rawEval) {
                hasAnyValidScoreOnRow = true;
                subjectsRecord[subj.id] = {
                  subjectId: subj.id,
                  tx: [],
                  gk: null,
                  ck: null,
                  tb: null,
                  evaluateResult: rawEval === 'CĐ' || rawEval === 'CD' || rawEval.includes('CHƯA') ? 'CĐ' : 'Đ',
                };
              }
            } else {
              const parseNum = (val: any): number | null => {
                if (val === null || val === undefined || String(val).trim() === '') return null;
                const normalized = String(val).replace(',', '.').trim();
                const n = parseFloat(normalized);
                if (isNaN(n) || n < 0 || n > 10) return null;
                return Math.round(n * 10) / 10;
              };

              const txScores = colCfg.txCols
                .map(c => parseNum(row[c]))
                .filter((v): v is number => v !== null);
              const gk = colCfg.gkCol !== undefined ? parseNum(row[colCfg.gkCol]) : null;
              const ck = colCfg.ckCol !== undefined ? parseNum(row[colCfg.ckCol]) : null;
              const explicitTb = colCfg.tbCol !== undefined ? parseNum(row[colCfg.tbCol]) : null;

              const finalTb =
                explicitTb !== null
                  ? explicitTb
                  : calculateSubjectAverage({ tx: txScores, gk, ck, tb: null });

              if (finalTb !== null || txScores.length > 0 || gk !== null || ck !== null) {
                hasAnyValidScoreOnRow = true;
                subjectsRecord[subj.id] = {
                  subjectId: subj.id,
                  tx: txScores.length > 0 ? txScores : finalTb !== null ? [finalTb] : [],
                  gk: gk !== null ? gk : finalTb,
                  ck: ck !== null ? ck : finalTb,
                  tb: finalTb,
                };
              }
            }
          }

          if (hasAnyValidScoreOnRow) {
            const gpa = calculateOverallGPA(subjectsRecord);
            const { hocLuc, danhHieu } = evaluateAcademicStanding(subjectsRecord, gpa);
            const nhanXetGVCN =
              colNhanXet !== -1 && row[colNhanXet]
                ? String(row[colNhanXet]).trim()
                : gpa && gpa >= 8.0
                  ? 'Kết quả học tập tốt, tích cực xây dựng bài.'
                  : 'Chăm ngoan, cố gắng hoàn thành nhiệm vụ học tập.';

            extractedAcademicMap.set(maHS, {
              maHS,
              hoTen,
              to,
              hocKi: 1,
              namHoc: '2026-2027',
              subjects: subjectsRecord,
              diemTBChung: gpa,
              hocLuc,
              danhHieu,
              nhanXetGVCN,
              ngayCapNhat: new Date().toISOString(),
            });
          }
        }
      }
    }

    if (extractedStudents.length > 0) {
      summaryNotes.push(`Nhận diện ${extractedStudents.length} học sinh (kèm phân Tổ, Chức vụ & Sơ đồ chỗ ngồi)`);
    }
    if (extractedAcademicMap.size > 0) {
      summaryNotes.push(`Nhận diện bảng điểm môn học của ${extractedAcademicMap.size} học sinh`);
    }
    if (extractedDiscipline.length > 0) {
      summaryNotes.push(`Nhận diện ${extractedDiscipline.length} lượt ghi nhận Nề nếp (Vi phạm / Điểm cộng)`);
    }

    return {
      sourceName,
      isJsonBackup: false,
      students: extractedStudents,
      hasStudentRoster: extractedStudents.length > 0,
      academicRecords: Array.from(extractedAcademicMap.values()),
      gradesCount: extractedAcademicMap.size,
      disciplineRecords: extractedDiscipline,
      summaryNotes,
    };
  };

  /**
   * Xử lý khi giáo viên chọn hoặc kéo thả 1 File bất kỳ (.xlsx, .xls, .csv, .txt, .json)
   */
  const processUploadedFile = async (file: File) => {
    setIsAnalyzing(true);
    setErrorMsg(null);
    setParsedPackage(null);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';

      // 1. Nếu là file sao lưu JSON (.json)
      if (ext === 'json') {
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (parsed && (Array.isArray(parsed.students) || Array.isArray(parsed.records))) {
          setParsedPackage({
            sourceName: file.name,
            isJsonBackup: true,
            rawJsonPayload: parsed,
            students: parsed.students || [],
            hasStudentRoster: Array.isArray(parsed.students) && parsed.students.length > 0,
            academicRecords: parsed.academicRecords || [],
            gradesCount: Array.isArray(parsed.academicRecords) ? parsed.academicRecords.length : 0,
            disciplineRecords: parsed.records || [],
            summaryNotes: [
              `Bản sao lưu toàn diện hệ thống (${(parsed.students || []).length} học sinh, ${(parsed.records || []).length} ghi nhận nề nếp)`,
            ],
          });
          onShowToast('Đã đọc file sao lưu JSON thành công!', 'Nhấn nút Áp dụng bên dưới để khôi phục.');
          return;
        }
      }

      // 2. Nếu là file Excel (.xlsx, .xls) hoặc CSV (.csv)
      if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
        const arrayBuf = await file.arrayBuffer();
        const workbook = XLSX.read(new Uint8Array(arrayBuf), { type: 'array' });

        const sheetsData = workbook.SheetNames.map(sheetName => ({
          sheetName,
          rows: XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 }) as any[][],
        }));

        const pkg = parseSheetsToUnifiedPackage(sheetsData, file.name);
        if (!pkg.hasStudentRoster && pkg.gradesCount === 0 && pkg.disciplineRecords.length === 0) {
          setErrorMsg(
            'Không tìm thấy dữ liệu hợp lệ trong file. Thầy vui lòng kiểm tra lại cột "Họ và tên" hoặc tải File Excel Mẫu Chuẩn (1 File) để đối chiếu.'
          );
        } else {
          setParsedPackage(pkg);
          onShowToast(
            `Đã đọc thành công file "${file.name}"!`,
            pkg.summaryNotes.join(' • ')
          );
        }
        return;
      }

      // 3. Nếu là file Text (.txt, .md)
      const rawText = await file.text();
      handleParseRawTextString(rawText, file.name);
    } catch (err: any) {
      console.error('Unified file import error:', err);
      setErrorMsg('Không thể đọc file: ' + (err?.message || 'Định dạng file không hợp lệ.'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Phân tích văn bản dán trực tiếp (Bảng từ AI ChatGPT/Gemini, bảng copy từ Excel/Word)
   */
  const handleParseRawTextString = (textInput: string, sourceLabel = 'Dữ liệu văn bản dán') => {
    setErrorMsg(null);
    const trimmed = textInput.trim();
    if (!trimmed) {
      setErrorMsg('Vui lòng dán nội dung bảng dữ liệu trước khi phân tích.');
      return;
    }

    const lines = trimmed
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0 && !l.match(/^[\|\-\:\s]+$/)); // Bỏ dòng gạch ngang bảng Markdown |---|---|

    const rows: any[][] = lines.map(line => {
      if (line.includes('\t')) {
        return line.split('\t').map(c => c.trim());
      }
      if (line.includes('|')) {
        const parts = line.split('|').map(c => c.trim());
        if (parts[0] === '') parts.shift();
        if (parts[parts.length - 1] === '') parts.pop();
        return parts;
      }
      return [line];
    });

    const pkg = parseSheetsToUnifiedPackage([{ sheetName: 'Data', rows }], sourceLabel);
    if (!pkg.hasStudentRoster && pkg.gradesCount === 0 && pkg.disciplineRecords.length === 0) {
      setErrorMsg('Không nhận diện được học sinh hay dữ liệu nào. Thầy hãy kiểm tra lại văn bản vừa dán.');
      return;
    }

    setParsedPackage(pkg);
    onShowToast('Đã phân tích bảng dữ liệu thành công!', pkg.summaryNotes.join(' • '));
  };

  /**
   * Áp dụng toàn bộ dữ liệu đã nhận diện từ 1 File vào hệ thống và đồng bộ lên Firebase
   */
  const handleApplyUnifiedPackage = () => {
    if (!parsedPackage) return;

    // 1. Nếu là file JSON Backup toàn phần
    if (parsedPackage.isJsonBackup && parsedPackage.rawJsonPayload) {
      onRestoreFullBackup(parsedPackage.rawJsonPayload);
      if (Array.isArray(parsedPackage.rawJsonPayload.academicRecords) && onUpdateAcademicRecords) {
        onUpdateAcademicRecords(parsedPackage.rawJsonPayload.academicRecords);
        saveAcademicRecords(parsedPackage.rawJsonPayload.academicRecords);
      }
      setParsedPackage(null);
      return;
    }

    let finalStudentsList = students;

    // 2. Cập nhật Danh sách học sinh + Tổ + Chức vụ + Sơ đồ chỗ ngồi
    if (parsedPackage.hasStudentRoster && parsedPackage.students.length > 0) {
      if (rosterImportMode === 'replace') {
        // Giữ lại avatar đã đổi của học sinh nếu trùng Họ và tên hoặc Mã HS
        const existingByName = new Map<string, Student>();
        students.forEach(s => existingByName.set(normalizeHeader(s.hoTen), s));

        finalStudentsList = parsedPackage.students.map((s, idx) => {
          const prev = existingByName.get(normalizeHeader(s.hoTen));
          const num = idx + 1;
          const maHS = s.maHS || `HS${num < 10 ? '0' + num : num}`;
          return {
            ...s,
            maHS,
            viTriGhe: num,
            avatarUrl: s.avatarUrl || prev?.avatarUrl,
            activeFrameId: s.activeFrameId || prev?.activeFrameId,
            customBadgeIds: s.customBadgeIds || prev?.customBadgeIds,
          };
        });
      } else {
        // Chế độ Cập nhật / Bổ sung vào danh sách hiện có
        const merged = [...students];
        parsedPackage.students.forEach(incoming => {
          const existingIdx = merged.findIndex(
            ex =>
              ex.maHS.toLowerCase() === incoming.maHS.toLowerCase() ||
              normalizeHeader(ex.hoTen) === normalizeHeader(incoming.hoTen)
          );
          if (existingIdx !== -1) {
            merged[existingIdx] = {
              ...merged[existingIdx],
              ...incoming,
              maHS: merged[existingIdx].maHS,
              avatarUrl: incoming.avatarUrl || merged[existingIdx].avatarUrl,
            };
          } else {
            const nextNum = merged.length + 1;
            merged.push({
              ...incoming,
              maHS: `HS${nextNum < 10 ? '0' + nextNum : nextNum}`,
              viTriGhe: nextNum,
            });
          }
        });
        finalStudentsList = merged;
      }

      const newLayout = buildSynchronizedLayoutForStudents(finalStudentsList);
      onUpdateStudentsAndLayout(finalStudentsList, newLayout, rosterImportMode === 'replace');
    }

    // 3. Cập nhật Bảng điểm môn học (nếu trong file có cột điểm)
    if (parsedPackage.gradesCount > 0 && onUpdateAcademicRecords) {
      const incomingByName = new Map<string, StudentAcademicRecord>();
      parsedPackage.academicRecords.forEach(ar => {
        incomingByName.set(normalizeHeader(ar.hoTen), ar);
      });

      const updatedAcademic: StudentAcademicRecord[] = finalStudentsList.map(stu => {
        const matchedIncoming = incomingByName.get(normalizeHeader(stu.hoTen));
        const existingRecord = academicRecords.find(
          r => r.maHS === stu.maHS || normalizeHeader(r.hoTen) === normalizeHeader(stu.hoTen)
        );

        if (matchedIncoming) {
          const mergedSubjects = {
            ...(existingRecord?.subjects || {}),
            ...matchedIncoming.subjects,
          };
          const gpa = calculateOverallGPA(mergedSubjects);
          const { hocLuc, danhHieu } = evaluateAcademicStanding(mergedSubjects, gpa);
          return {
            ...matchedIncoming,
            maHS: stu.maHS,
            hoTen: stu.hoTen,
            to: stu.to,
            subjects: mergedSubjects,
            diemTBChung: gpa,
            hocLuc,
            danhHieu,
          };
        }

        if (existingRecord) {
          return {
            ...existingRecord,
            maHS: stu.maHS,
            hoTen: stu.hoTen,
            to: stu.to,
          };
        }

        return {
          maHS: stu.maHS,
          hoTen: stu.hoTen,
          to: stu.to,
          hocKi: 1,
          namHoc: '2026-2027',
          subjects: {},
          diemTBChung: null,
          hocLuc: null,
          danhHieu: null,
          ngayCapNhat: new Date().toISOString(),
        };
      });

      onUpdateAcademicRecords(updatedAcademic);
      saveAcademicRecords(updatedAcademic);
    }

    // 4. Cập nhật Nhật ký Nề nếp (nếu trong file có dữ liệu nề nếp)
    if (parsedPackage.disciplineRecords.length > 0) {
      // Đồng bộ lại maHS và Tổ theo danh sách học sinh mới nhất
      const syncedDiscipline = parsedPackage.disciplineRecords.map(rec => {
        const stu = finalStudentsList.find(
          s =>
            s.maHS.toLowerCase() === rec.maHS.toLowerCase() ||
            normalizeHeader(s.hoTen) === normalizeHeader(rec.hoTen)
        );
        if (stu) {
          return {
            ...rec,
            maHS: stu.maHS,
            hoTen: stu.hoTen,
            to: stu.to,
          };
        }
        return rec;
      });
      onAddRecords(syncedDiscipline);
    }

    triggerToast(
      'Đã nạp toàn bộ dữ liệu thành công & lưu lên Đám mây!',
      parsedPackage.summaryNotes.join(' • ')
    );
    setParsedPackage(null);
    setPastedText('');
  };

  return (
    <div className="space-y-5">
      {statusBanner && (
        <div className="p-4 rounded-2xl bg-emerald-600 text-white shadow-lg flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-amber-300 shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-black">{statusBanner.title}</p>
              {statusBanner.sub && (
                <p className="text-[11px] text-emerald-100 mt-0.5">{statusBanner.sub}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="text-xs font-bold text-emerald-100 hover:text-white px-2 py-1 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* KHỐI 1: NGUYÊN TẮC 1 FILE DUY NHẤT & TẢI FILE MẪU / HƯỚNG DẪN */}
      <div className="bg-surface rounded-2xl border-2 border-indigo-500/30 shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 px-5 py-4 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/25 shrink-0 shadow-inner">
              <Layers className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight uppercase">
                  Trung Tâm Nhập / Xuất Hợp Nhất (Chỉ Cần 1 File Duy Nhất)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-400 text-slate-950">
                  Chuẩn Hóa Mới
                </span>
              </div>
              <p className="text-xs text-indigo-100 mt-0.5">
                Đưa <b>1 file Excel (.xlsx) duy nhất</b> vào là nạp đủ: Danh sách HS + Tổ + Ban cán sự + Sơ đồ chỗ ngồi + Điểm các môn + Nề nếp
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                downloadUnifiedExcelTemplate();
                triggerToast(
                  'Đã tải File Excel Mẫu Chuẩn (1 File Đầy Đủ)!',
                  'Thầy điền dữ liệu vào file này rồi kéo thả vào ô bên dưới.'
                );
              }}
              className="px-3.5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>1. Tải File Excel Mẫu (1 File Đầy Đủ)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                exportDataSpecsWordDocument();
                triggerToast(
                  'Đã tải File Hướng Dẫn (.doc)!',
                  'Tài liệu Word giải thích chi tiết quy tắc cột và câu lệnh AI.'
                );
              }}
              className="px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs flex items-center gap-1.5 border border-white/25 transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-amber-300" />
              <span>Tải File Hướng Dẫn (.doc)</span>
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Tóm tắt 3 bước trực quan */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200/80 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                1
              </div>
              <div>
                <h4 className="text-xs font-black text-indigo-950">Tải File Mẫu hoặc Dùng AI</h4>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  Tải <b>File Excel Mẫu (.xlsx)</b> ở trên (hoặc copy câu lệnh AI để gom ảnh chụp danh sách/bảng điểm thành 1 bảng).
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200/80 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                2
              </div>
              <div>
                <h4 className="text-xs font-black text-indigo-950">Thả 1 File Duy Nhất Vào Ô Dưới</h4>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  Hệ thống tự đọc tất cả các Sheet: <b>Học sinh, Tổ, Chức vụ, Chỗ ngồi, Điểm 14 môn</b> và <b>Nhật ký nề nếp</b>.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                3
              </div>
              <div>
                <h4 className="text-xs font-black text-emerald-950">Bấm "Áp Dụng Ngay" (Lưu Lên Mây)</h4>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  Xem trước kết quả ngay trên màn hình và bấm <b>1 nút duy nhất</b> để cập nhật toàn bộ lớp học lên Firebase.
                </p>
              </div>
            </div>
          </div>

          {/* KHU VỰC KÉO THẢ 1 FILE DUY NHẤT */}
          <div
            onDragOver={e => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) processUploadedFile(file);
            }}
            onClick={() => universalFileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
              isDragging
                ? 'border-indigo-600 bg-indigo-50/60 scale-[0.99]'
                : 'border-indigo-300 hover:border-indigo-500 bg-surface-2/40 hover:bg-indigo-50/30'
            }`}
          >
            <input
              ref={universalFileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.txt,.json"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) processUploadedFile(file);
                e.target.value = '';
              }}
              className="hidden"
            />

            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 mb-3 shadow-inner">
              {isAnalyzing ? (
                <RefreshCw className="w-8 h-8 animate-spin" />
              ) : (
                <Upload className="w-8 h-8" />
              )}
            </div>

            <p className="text-sm sm:text-base font-black text-main">
              {isAnalyzing
                ? 'Đang đọc và bóc tách toàn bộ dữ liệu trong file...'
                : 'Kéo thả 1 File Excel (.xlsx), CSV hoặc JSON vào đây (Hoặc nhấn để chọn file)'}
            </p>
            <p className="text-xs text-muted mt-1 max-w-xl">
              Chỉ cần <b>1 file duy nhất</b>: Tự động nhận diện Danh sách học sinh, Tổ, Chức vụ (LT, BT, LP, TT), Sơ đồ chỗ ngồi, Điểm các môn học và Nhật ký nề nếp.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 mt-4" onClick={e => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => universalFileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Chọn 1 File Từ Máy Tính</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPasteBox(prev => !prev)}
                className="px-3.5 py-2 rounded-xl bg-surface hover:bg-surface-2 text-main border border-token text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>{showPasteBox ? 'Ẩn ô dán văn bản / AI' : 'Hoặc Dán Bảng Từ Excel / AI'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyPrompt}
                className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copiedPrompt ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Đã chép câu lệnh AI!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-amber-600" />
                    <span>Copy Câu Lệnh AI Chuẩn</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Ô DÁN VĂN BẢN TRỰC TIẾP (TÙY CHỌN) */}
          {showPasteBox && (
            <div className="p-4 rounded-2xl bg-surface-2/70 border border-token space-y-3">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-black text-main flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Dán bảng dữ liệu từ Excel hoặc kết quả từ ChatGPT / Gemini vào đây:</span>
                </label>
                {pastedText && (
                  <button
                    type="button"
                    onClick={() => setPastedText('')}
                    className="text-[11px] font-bold text-rose-600 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Xóa trắng
                  </button>
                )}
              </div>
              <textarea
                rows={5}
                value={pastedText}
                onChange={e => setPastedText(e.target.value)}
                placeholder={`Ví dụ dán trực tiếp từ Excel hoặc bảng AI:\nSTT\tMã HS\tHọ và tên\tGiới tính\tNgày sinh\tTổ\tChức vụ\tToán\tNgữ văn\tTiếng Anh\n1\tHS01\tNguyễn Minh Khôi\tNam\t15/03/2011\t1\tLT\t9.2\t8.5\t9.0`}
                className="w-full p-3 rounded-xl bg-surface border border-token text-xs font-mono text-main focus:outline-none focus:border-indigo-500"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => handleParseRawTextString(pastedText)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Đọc &amp; Kiểm Tra Bảng Vừa Dán</span>
                </button>
              </div>
            </div>
          )}

          {/* HIỂN THỊ LỖI NẾU CÓ */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-black">Không thể đọc dữ liệu:</p>
                <p className="mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* BẢNG XEM TRƯỚC & NÚT ÁP DỤNG NGAY (1 CLICK) */}
          {parsedPackage && (
            <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50/40 p-4 sm:p-5 space-y-4 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200 pb-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm sm:text-base font-black text-emerald-950">
                        Đã Đọc Xong File: {parsedPackage.sourceName}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white uppercase">
                        Sẵn sàng nạp 1 chạm
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800 mt-0.5 font-medium">
                      {parsedPackage.summaryNotes.join(' • ')}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setParsedPackage(null)}
                  className="text-xs font-bold text-slate-500 hover:text-rose-600 self-end sm:self-center cursor-pointer"
                >
                  Hủy bỏ
                </button>
              </div>

              {/* Thẻ tóm tắt số lượng từng phần trong 1 file */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-white border border-emerald-200 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-500">Học sinh &amp; Chỗ ngồi</div>
                    <div className="text-sm font-black text-slate-900">
                      {parsedPackage.students.length > 0
                        ? `${parsedPackage.students.length} học sinh (Đủ 4 Tổ)`
                        : 'Không thay đổi'}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-emerald-200 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-500">Bảng điểm môn học</div>
                    <div className="text-sm font-black text-slate-900">
                      {parsedPackage.gradesCount > 0
                        ? `${parsedPackage.gradesCount} bảng điểm HS`
                        : 'Không có cột điểm'}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-emerald-200 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-500">Nhật ký Nề nếp</div>
                    <div className="text-sm font-black text-slate-900">
                      {parsedPackage.disciplineRecords.length > 0
                        ? `${parsedPackage.disciplineRecords.length} lượt ghi nhận`
                        : 'Không có lượt ghi mới'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tuỳ chọn chế độ nạp Danh sách học sinh */}
              {!parsedPackage.isJsonBackup && parsedPackage.hasStudentRoster && (
                <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-emerald-200">
                  <span className="text-xs font-black text-slate-700">Chế độ nạp danh sách lớp:</span>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="rosterImportMode"
                      checked={rosterImportMode === 'replace'}
                      onChange={() => setRosterImportMode('replace')}
                      className="accent-indigo-600"
                    />
                    <span>Thay thế bằng danh sách mới này (Khuyên dùng)</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="rosterImportMode"
                      checked={rosterImportMode === 'append'}
                      onChange={() => setRosterImportMode('append')}
                      className="accent-indigo-600"
                    />
                    <span>Cập nhật / Bổ sung vào danh sách hiện có</span>
                  </label>
                </div>
              )}

              {/* Xem trước 8 dòng học sinh đầu tiên */}
              {parsedPackage.students.length > 0 && (
                <div className="bg-white rounded-xl border border-emerald-200 overflow-hidden">
                  <div className="px-3.5 py-2 bg-emerald-100/60 border-b border-emerald-200 flex items-center justify-between">
                    <span className="text-[11px] font-black text-emerald-950 uppercase">
                      Xem trước Danh sách Học sinh &amp; Điểm môn học ({parsedPackage.students.length} HS)
                    </span>
                  </div>
                  <div className="overflow-x-auto max-h-56">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600">
                          <th className="py-2 px-3">Mã HS</th>
                          <th className="py-2 px-3">Họ và tên</th>
                          <th className="py-2 px-2">Phái</th>
                          <th className="py-2 px-2">Tổ</th>
                          <th className="py-2 px-2">Chức vụ</th>
                          <th className="py-2 px-2">Chỗ ngồi</th>
                          <th className="py-2 px-3">ĐTB Chung / Học lực</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedPackage.students.slice(0, 10).map(stu => {
                          const ar = parsedPackage.academicRecords.find(
                            a =>
                              a.maHS === stu.maHS ||
                              normalizeHeader(a.hoTen) === normalizeHeader(stu.hoTen)
                          );
                          return (
                            <tr key={stu.maHS} className="hover:bg-slate-50/80">
                              <td className="py-1.5 px-3 font-mono font-bold text-indigo-600">{stu.maHS}</td>
                              <td className="py-1.5 px-3 font-bold text-slate-900">{stu.hoTen}</td>
                              <td className="py-1.5 px-2 text-slate-600">{stu.gioiTinh === 'Nu' ? 'Nữ' : 'Nam'}</td>
                              <td className="py-1.5 px-2 font-bold text-slate-700">Tổ {stu.to}</td>
                              <td className="py-1.5 px-2">
                                <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                                  {stu.vaiTro.filter(r => r !== 'HS').join(', ') || 'HS'}
                                </span>
                              </td>
                              <td className="py-1.5 px-2 text-slate-600 text-[11px]">
                                Dãy {stu.dayBan} - Bàn {stu.soBan}
                              </td>
                              <td className="py-1.5 px-3">
                                {ar && ar.diemTBChung !== null ? (
                                  <span className="font-bold text-emerald-700">
                                    {ar.diemTBChung} ({ar.hocLuc || 'Đạt'})
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic">Giữ nguyên / Chưa nhập</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {parsedPackage.students.length > 10 && (
                    <div className="px-3 py-1.5 bg-slate-50 text-center text-[11px] font-semibold text-slate-500 border-t border-slate-200">
                      ... và {parsedPackage.students.length - 10} học sinh khác trong file
                    </div>
                  )}
                </div>
              )}

              {/* Nút Xác Nhận Nạp Tất Cả (1 Chạm) */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setParsedPackage(null)}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleApplyUnifiedPackage}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black flex items-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Áp Dụng Ngay Vào Hệ Thống &amp; Lưu Lên Mây</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KHỐI 2: XUẤT DỮ LIỆU LỚP RA 1 FILE CHUẨN & CÔNG CỤ CHỈNH SỬA CHI TIẾT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Xuất dữ liệu lớp hiện tại */}
        <div className="bg-surface rounded-2xl border border-token p-4 sm:p-5 shadow-xs flex flex-col justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-main uppercase">
                Xuất Toàn Bộ Dữ Liệu Lớp Hiện Tại Ra 1 File
              </h4>
              <p className="text-xs text-muted mt-0.5">
                File Excel xuất ra có đúng cấu trúc chuẩn 1-File (gồm Danh sách + Chỗ ngồi + Điểm số + Nề nếp). Thầy có thể chỉnh sửa trên Excel rồi thả ngược lại vào ô trên để cập nhật!
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-token">
            <button
              type="button"
              onClick={() => {
                exportCurrentClassToUnifiedExcel(students, layout, records, academicRecords);
                onShowToast(
                  'Đã xuất toàn bộ dữ liệu lớp ra 1 file Excel (.xlsx)!',
                  'Thầy có thể mở chỉnh sửa trên Excel và nạp lại bất cứ lúc nào.'
                );
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Xuất Ra 1 File Excel Đầy Đủ (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={handleExportFullJson}
              className="px-3.5 py-2.5 rounded-xl bg-surface-2 hover:bg-surface-3 text-main border border-token text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Database className="w-4 h-4 text-indigo-600" />
              <span>Sao Lưu Dự Phòng (.json)</span>
            </button>
          </div>
        </div>

        {/* Công cụ chỉnh sửa thủ công từng phần */}
        <div className="bg-surface rounded-2xl border border-token p-4 sm:p-5 shadow-xs flex flex-col justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
              <Grid className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-main uppercase">
                Chỉnh Sửa Thủ Công Trên Giao Diện
              </h4>
              <p className="text-xs text-muted mt-0.5">
                Sau khi nạp 1 file tổng hợp, thầy có thể kéo thả đổi chỗ ngồi trực quan hoặc sửa điểm từng học sinh tại đây:
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-token">
            <button
              type="button"
              onClick={onOpenLayoutEditor}
              className="px-3.5 py-2 rounded-xl bg-surface-2 hover:bg-indigo-50 text-main hover:text-indigo-700 border border-token text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Grid className="w-3.5 h-3.5 text-indigo-600" />
              <span>Sơ Đồ Chỗ Ngồi &amp; Ban Cán Sự</span>
            </button>

            <button
              type="button"
              onClick={onSwitchToGradesTab}
              className="px-3.5 py-2 rounded-xl bg-surface-2 hover:bg-indigo-50 text-main hover:text-indigo-700 border border-token text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
              <span>Bảng Điểm Môn Học</span>
            </button>

            <button
              type="button"
              onClick={onOpenStudentImportModal}
              className="px-3.5 py-2 rounded-xl bg-surface-2 hover:bg-indigo-50 text-main hover:text-indigo-700 border border-token text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span>Nhập Nhanh Riêng Danh Sách HS</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
