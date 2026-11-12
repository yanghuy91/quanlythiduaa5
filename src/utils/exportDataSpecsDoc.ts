import * as XLSX from 'xlsx';
import {
  Student,
  SeatLayoutNode,
  DisciplineRecord,
  StudentAcademicRecord,
  RoleCode,
  RuleItem,
  PointType,
  SeverityLevel,
} from '../types';
import { DEFAULT_SUBJECTS } from '../data/academicCatalog';
import {
  syncStudentsWithSeatingLayout,
  getSeatColsForGroup,
  reconcileAcademicRecordsWithSeating,
  reconcileDisciplineRecordsWithSeating,
} from './seatingMaster';
import {
  classifySeverityByPoints,
  normalizeRuleCategory,
  STANDARD_RULE_CATEGORIES,
} from './emulation';

/**
 * Bản mẫu Câu lệnh AI (Prompt) chuẩn hóa — Ngắn gọn, dễ hiểu, bóc tách chuẩn 4 nhóm vi phạm
 */
export const AI_MASTER_PROMPT_TEXT = `Hãy đọc tài liệu/hình ảnh đính kèm và bóc tách dữ liệu ra bảng chuẩn:

1. BẢNG NỘI QUY LỚP (Nếu tài liệu là Nội quy / Quy định tính điểm):
Mã nội quy | Nhóm hành vi | Tên hành vi | Loại điểm | Điểm số | Mức độ | Ghim
QUY TẮC BÓC TÁCH NỘI QUY CHUẨN CHO AI:
- Cột "Nhóm hành vi": BẮT BUỘC xếp vào đúng 1 trong 4 nhóm vi phạm chuẩn sau: "Học tập", "Hoạt động/Lao động", "Tác phong", "Nề nếp/Đạo đức" (hoặc "Điểm cộng" nếu là khen thưởng/cộng điểm):
  + "Học tập": Không thuộc bài, thiếu bài tập, quên sách vở/dụng cụ học tập, mất trật tự/nói chuyện/ngủ gật/làm việc riêng trong giờ học, gian lận kiểm tra, đạt điểm yếu/kém.
  + "Hoạt động/Lao động": Sinh hoạt lớp, chào cờ, xếp hàng, thể dục giữa giờ, hoạt động Đoàn - Đội, văn nghệ, thể thao, ngoại khóa, trực nhật, quét lớp, lau bảng, đổ rác, vệ sinh lớp/hành lang, chăm sóc cây xanh, tắt điện quạt.
  + "Tác phong": Đi học muộn, vào lớp trễ, đồng phục, bảng tên, khăn quàng/huy hiệu Đoàn, giày dép, đầu tóc, trang phục, tư thế tác phong.
  + "Nề nếp/Đạo đức": Nghỉ học có phép/không phép, bỏ tiết, trốn tiết, dùng điện thoại khi chưa cho phép, ăn quà vặt, nói tục, vô lễ, thiếu trung thực, gây gổ/đánh nhau, an toàn giao thông, làm hỏng tài sản chung.
- Cột "Loại điểm": Chỉ ghi "Trừ" hoặc "Cộng".
- Cột "Điểm số": Ghi số nguyên dương (VD: 1, 2, 3, 5, 10).
- Cột "Mức độ": Căn cứ theo quy định trong tài liệu hoặc theo Điểm trừ: Trừ 1–2đ = "Nhẹ" (viền đen), Trừ 3–4đ = "Vừa" (viền cam), Trừ từ 5đ trở lên = "Nặng" (viền đỏ).
- Cột "Ghim": Ghi "Có" với các lỗi phổ biến để đưa vào mục "Hay dùng" (thay cho mục Tất cả), còn lại ghi "Không".

2. BẢNG DANH SÁCH & SƠ ĐỒ CHỖ NGỒI (Nếu tài liệu là Danh sách lớp / Sơ đồ bàn):
STT | Mã HS | Họ và tên | Giới tính | Tổ | Chức vụ | Dãy bàn | Số bàn
- Chức vụ viết tắt: LT, BT, PBT, LP_HT, LP_LD, LP_VT, CD, TT, HS.

3. BẢNG NHẬT KÝ NỀ NẾP (Nếu tài liệu là Sổ theo dõi vi phạm / Cờ đỏ):
Ngày học | Buổi | Tuần | Mã hoặc Họ tên HS | Tổ | Nhóm hành vi | Nội dung hành vi | Loại điểm | Số điểm | Ghi chú`;

/**
 * Chuyển đổi mảng vaiTro sang chuỗi mã chức vụ hiển thị trong Excel
 */
export function formatRolesForExcel(vaiTro: RoleCode[]): string {
  const nonHs = (vaiTro || []).filter(r => r !== 'HS' && r !== 'GV');
  if (nonHs.length === 0) return 'HS';
  return nonHs.join(', ');
}

/**
 * Xây dựng dữ liệu bảng 2D cho Sheet "0_SoDoLop_Chuan" từ Sơ đồ lớp (`students` + `layout`)
 */
function build2DSeatingGridAoA(students: Student[], layout?: SeatLayoutNode[]): any[][] {
  const synced = syncStudentsWithSeatingLayout(students, layout || []);
  const stuByMa = new Map<string, Student>();
  synced.students.forEach(s => stuByMa.set(s.maHS, s));

  const headerRow = [
    'Bàn \\ Tổ - Dãy',
    'Tổ 1 - Dãy 1 (Ghế trái)',
    'Tổ 1 - Dãy 1 (Ghế phải)',
    'Tổ 2 - Dãy 2 (Ghế trái)',
    'Tổ 2 - Dãy 2 (Ghế phải)',
    'Tổ 3 - Dãy 3 (Ghế trái)',
    'Tổ 3 - Dãy 3 (Ghế phải)',
    'Tổ 4 - Dãy 4 (Ghế trái)',
    'Tổ 4 - Dãy 4 (Ghế phải)',
  ];

  const rows: any[][] = [headerRow];
  const maxRow = Math.max(6, ...synced.layout.filter(n => n.loaiO === 'ghe').map(n => n.hang));

  for (let r = 1; r <= maxRow; r++) {
    const rowCells: any[] = [`Bàn ${r}`];
    for (const g of [1, 2, 3, 4] as const) {
      const [colLeft, colRight] = getSeatColsForGroup(g);
      for (const col of [colLeft, colRight]) {
        const seat = synced.layout.find(n => n.loaiO === 'ghe' && n.hang === r && n.cot === col);
        const st = seat?.maHS ? stuByMa.get(seat.maHS) : undefined;
        if (st) {
          const nonHsRoles = (st.vaiTro || []).filter(role => role !== 'HS' && role !== 'GV');
          const roleSuffix = nonHsRoles.length > 0 ? ` (${nonHsRoles.join(',')})` : '';
          rowCells.push(`${st.maHS} - ${st.hoTen}${roleSuffix}`);
        } else {
          rowCells.push('');
        }
      }
    }
    rows.push(rowCells);
  }

  return rows;
}

/**
 * Xây dựng dữ liệu AoA cho bảng Nội quy lớp (Cơ sở trừ điểm / cộng điểm)
 */
export function buildRulesSheetAoA(rules?: RuleItem[]): any[][] {
  const headers = [
    'STT',
    'Mã nội quy',
    'Nhóm hành vi',
    'Tên hành vi (Nội dung quy định)',
    'Loại điểm (Trừ/Cộng)',
    'Điểm số',
    'Mức độ (Nhẹ/Vừa/Nặng)',
    'Ghim hay dùng (Có/Không)',
  ];

  const defaultSampleRules: RuleItem[] =
    Array.isArray(rules) && rules.length > 0
      ? rules
      : [
          {
            maNoiQuy: 'NQ01',
            nhomHanhVi: 'Học tập',
            tenHanhVi: 'Không thuộc bài cũ / Không làm bài tập về nhà',
            loaiDiem: 'Tru',
            diemSo: 3,
            mucDo: 'Vua',
            ghim: true,
            thuTu: 1,
          },
          {
            maNoiQuy: 'NQ02',
            nhomHanhVi: 'Học tập',
            tenHanhVi: 'Mất trật tự, nói chuyện riêng trong giờ học',
            loaiDiem: 'Tru',
            diemSo: 2,
            mucDo: 'Nhe',
            ghim: true,
            thuTu: 2,
          },
          {
            maNoiQuy: 'NQ03',
            nhomHanhVi: 'Hoạt động/Lao động',
            tenHanhVi: 'Không tập thể dục giữa giờ / Mất trật tự khi chào cờ',
            loaiDiem: 'Tru',
            diemSo: 2,
            mucDo: 'Nhe',
            ghim: true,
            thuTu: 3,
          },
          {
            maNoiQuy: 'NQ04',
            nhomHanhVi: 'Hoạt động/Lao động',
            tenHanhVi: 'Không trực nhật / Xả rác bừa bãi trong lớp',
            loaiDiem: 'Tru',
            diemSo: 3,
            mucDo: 'Vua',
            ghim: true,
            thuTu: 4,
          },
          {
            maNoiQuy: 'NQ05',
            nhomHanhVi: 'Tác phong',
            tenHanhVi: 'Đi học muộn (sau trống vào lớp)',
            loaiDiem: 'Tru',
            diemSo: 2,
            mucDo: 'Nhe',
            ghim: true,
            thuTu: 5,
          },
          {
            maNoiQuy: 'NQ06',
            nhomHanhVi: 'Tác phong',
            tenHanhVi: 'Sai đồng phục / Không đeo bảng tên, huy hiệu Đoàn',
            loaiDiem: 'Tru',
            diemSo: 2,
            mucDo: 'Nhe',
            ghim: true,
            thuTu: 6,
          },
          {
            maNoiQuy: 'NQ07',
            nhomHanhVi: 'Nề nếp/Đạo đức',
            tenHanhVi: 'Nghỉ học không phép / Bỏ tiết',
            loaiDiem: 'Tru',
            diemSo: 5,
            mucDo: 'Nang',
            ghim: true,
            thuTu: 7,
          },
          {
            maNoiQuy: 'NQ08',
            nhomHanhVi: 'Nề nếp/Đạo đức',
            tenHanhVi: 'Sử dụng điện thoại trong giờ học khi chưa được phép',
            loaiDiem: 'Tru',
            diemSo: 3,
            mucDo: 'Vua',
            ghim: true,
            thuTu: 8,
          },
          {
            maNoiQuy: 'KT01',
            nhomHanhVi: 'Điểm cộng',
            tenHanhVi: 'Phát biểu xây dựng bài sôi nổi / Đạt điểm 9, 10',
            loaiDiem: 'Cong',
            diemSo: 2,
            mucDo: 'Nhe',
            ghim: true,
            thuTu: 9,
          },
        ];

  const rows = defaultSampleRules.map((r, idx) => [
    idx + 1,
    r.maNoiQuy,
    normalizeRuleCategory(r.nhomHanhVi, r.tenHanhVi, r.loaiDiem),
    r.tenHanhVi,
    r.loaiDiem === 'Cong' ? 'Cộng' : 'Trừ',
    r.diemSo,
    r.mucDo === 'Nang' ? 'Nặng' : r.mucDo === 'Vua' ? 'Vừa' : 'Nhẹ',
    r.ghim ? 'Có' : 'Không',
  ]);

  return [headers, ...rows];
}

/**
 * Tải xuống File Excel Mẫu Nội Quy Lớp (.xlsx) để GV chỉnh sửa và Up lên làm cơ sở trừ điểm
 */
export function downloadRulesExcelTemplate(currentRules?: RuleItem[]): void {
  const wb = XLSX.utils.book_new();
  const ws1Rows = buildRulesSheetAoA(currentRules);
  const ws1 = XLSX.utils.aoa_to_sheet(ws1Rows);
  ws1['!cols'] = [
    { wch: 6 },  // STT
    { wch: 12 }, // Mã nội quy
    { wch: 20 }, // Nhóm hành vi
    { wch: 44 }, // Tên hành vi
    { wch: 18 }, // Loại điểm
    { wch: 10 }, // Điểm số
    { wch: 18 }, // Mức độ
    { wch: 18 }, // Ghim
  ];
  XLSX.utils.book_append_sheet(wb, ws1, '1_Noi_Quy_Lop');

  const ws2Guide = [
    ['HƯỚNG DẪN NHANH FILE NỘI QUY LỚP - LỚP 10A5 (CẬP NHẬT MỚI)'],
    [`1. Cột "Nhóm hành vi": Chia thành 4 nhóm chuẩn: ${STANDARD_RULE_CATEGORIES.join('; ')} (và nhóm "Điểm cộng" nếu là khen thưởng).`],
    ['   - Học tập: Thuộc bài, bài tập, sách vở, trật tự trong giờ học, kiểm tra.'],
    ['   - Hoạt động/Lao động: Chào cờ, sinh hoạt lớp, thể dục giữa giờ, phong trào Đoàn, trực nhật, vệ sinh lớp/hành lang, tắt điện quạt.'],
    ['   - Tác phong: Đi học đúng giờ/đi muộn, đồng phục, bảng tên, huy hiệu Đoàn, đầu tóc, giày dép.'],
    ['   - Nề nếp/Đạo đức: Nghỉ học có phép/không phép, bỏ tiết, dùng điện thoại, nói tục, vô lễ, đánh nhau, an toàn giao thông, bảo quản tài sản.'],
    ['2. Cột "Ghim hay dùng": Điền "Có" để lỗi xuất hiện trong mục "★ Hay dùng" (mục chọn mặc định thay cho mục Tất cả).'],
    ['3. Cột "Mức độ": Căn cứ vào quy định file hoặc điểm trừ: Trừ 1–2đ = Nhẹ (viền đen), Trừ 3–4đ = Vừa (viền cam), Trừ ≥5đ = Nặng (viền đỏ).'],
    ['4. Ghi vi phạm ở chế độ Sơ đồ: Chọn trực tiếp học sinh trên sơ đồ bàn học (đã bỏ thanh tìm kiếm thừa để gọn màn hình).'],
    ['5. Lưu file rồi bấm "Up File Nội Quy Lớp (.xlsx)" trong mục Nội quy.'],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(ws2Guide);
  ws2['!cols'] = [{ wch: 115 }];
  XLSX.utils.book_append_sheet(wb, ws2, '2_Huong_Dan_Noi_Quy');

  XLSX.writeFile(wb, 'File_Mau_Noi_Quy_Lop_10A5.xlsx');
}

/**
 * Đọc và phân tích dữ liệu bảng Nội quy lớp từ mảng 2 chiều (Excel / CSV)
 * Trả về danh sách `RuleItem[]` chuẩn làm cơ sở trừ điểm
 */
export function parseRulesFromAoA(rows: any[][]): RuleItem[] {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  const norm = (val: any) =>
    String(val ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/\s+/g, ' ');

  let headerRowIdx = -1;
  let colCode = -1;
  let colGroup = -1;
  let colName = -1;
  let colType = -1;
  let colPoints = -1;
  let colSeverity = -1;
  let colPin = -1;

  for (let r = 0; r < Math.min(12, rows.length); r++) {
    const row = rows[r] || [];
    const headers = row.map(norm);

    const hasBehaviorHeader = headers.some(
      h =>
        h.includes('ten hanh vi') ||
        h.includes('noi dung quy dinh') ||
        h.includes('noi dung noi quy') ||
        h.includes('noi quy') ||
        h.includes('loi vi pham') ||
        h.includes('hanh vi vi pham') ||
        h === 'hanh vi'
    );
    const hasPointsHeader = headers.some(
      h =>
        h.includes('diem so') ||
        h.includes('muc tru') ||
        h.includes('diem tru') ||
        h.includes('so diem') ||
        h === 'diem'
    );

    if (hasBehaviorHeader && hasPointsHeader) {
      headerRowIdx = r;
      headers.forEach((h, cIdx) => {
        if (h.includes('ma noi quy') || h.includes('ma quy dinh') || h === 'ma') colCode = cIdx;
        else if (h.includes('nhom hanh vi') || h.includes('phan loai') || h === 'nhom') colGroup = cIdx;
        else if (
          h.includes('ten hanh vi') ||
          h.includes('noi dung') ||
          h.includes('loi vi pham') ||
          h.includes('noi quy') ||
          h === 'hanh vi'
        ) {
          if (colName === -1) colName = cIdx;
        } else if (h.includes('loai diem') || h === 'loai') colType = cIdx;
        else if (
          h.includes('diem so') ||
          h.includes('muc tru') ||
          h.includes('diem tru') ||
          h.includes('so diem') ||
          h === 'diem'
        ) {
          if (colPoints === -1) colPoints = cIdx;
        } else if (h.includes('muc do')) colSeverity = cIdx;
        else if (h.includes('ghim') || h.includes('hay dung')) colPin = cIdx;
      });
      break;
    }
  }

  if (headerRowIdx === -1 || colName === -1) return [];

  const parsedRules: RuleItem[] = [];
  let nqCounter = 1;
  let ktCounter = 1;
  const usedCodes = new Set<string>();

  for (let r = headerRowIdx + 1; r < rows.length; r++) {
    const row = rows[r] || [];
    const rawName = String(row[colName] ?? '').trim();
    if (!rawName || rawName.length < 2) continue;

    const lowerName = norm(rawName);
    if (
      lowerName === 'ten hanh vi' ||
      lowerName.includes('huong dan') ||
      lowerName.includes('nguyen tac')
    ) {
      continue;
    }

    const rawGroup = colGroup !== -1 ? String(row[colGroup] ?? '').trim() : '';
    const rawType = colType !== -1 ? norm(row[colType]) : '';
    const rawPointsStr =
      colPoints !== -1
        ? String(row[colPoints] ?? '')
            .replace(',', '.')
            .trim()
        : '';
    const rawSeverity = colSeverity !== -1 ? norm(row[colSeverity]) : '';
    const rawPin = colPin !== -1 ? norm(row[colPin]) : '';
    const rawCode = colCode !== -1 ? String(row[colCode] ?? '').trim().toUpperCase() : '';

    // Xác định loại điểm (Trừ / Cộng)
    let loaiDiem: PointType = 'Tru';
    if (
      rawType.includes('cong') ||
      rawType === '+' ||
      rawPointsStr.startsWith('+') ||
      norm(rawGroup).includes('diem cong') ||
      norm(rawGroup).includes('khen thuong') ||
      rawCode.startsWith('KT')
    ) {
      loaiDiem = 'Cong';
    }

    // Điểm số dương
    const numPoints = Math.abs(parseFloat(rawPointsStr.replace(/[^\d.-]/g, '')));
    const diemSo = Number.isFinite(numPoints) && numPoints > 0 ? Math.round(numPoints) : 2;

    // Nhóm hành vi: Chuẩn hóa về đúng 4 nhóm vi phạm ('Học tập', 'Hoạt động/Lao động', 'Tác phong', 'Nề nếp/Đạo đức') hoặc 'Điểm cộng'
    const nhomHanhVi = normalizeRuleCategory(rawGroup, rawName, loaiDiem);

    // Mức độ: chỉ căn cứ vào quy định của file nhập vào (nếu cột Mức độ có ghi rõ) và điểm trừ thực tế
    const mucDo: SeverityLevel = classifySeverityByPoints(diemSo, loaiDiem === 'Cong', rawSeverity);

    // Ghim
    const ghim =
      colPin !== -1
        ? rawPin === 'co' || rawPin === 'true' || rawPin === '1' || rawPin === 'x' || rawPin.includes('ghim')
        : parsedRules.length < 8;

    // Mã nội quy
    let maNoiQuy = rawCode;
    while (!maNoiQuy || usedCodes.has(maNoiQuy)) {
      if (loaiDiem === 'Cong') {
        const n = ktCounter++;
        maNoiQuy = `KT${n < 10 ? '0' + n : n}`;
      } else {
        const n = nqCounter++;
        maNoiQuy = `NQ${n < 10 ? '0' + n : n}`;
      }
    }
    usedCodes.add(maNoiQuy);

    parsedRules.push({
      maNoiQuy,
      nhomHanhVi,
      tenHanhVi: rawName,
      loaiDiem,
      diemSo,
      mucDo,
      ghim,
      thuTu: parsedRules.length + 1,
    });
  }

  return parsedRules;
}

/**
 * Tải xuống File Excel Mẫu Chuẩn 1 File Đầy Đủ (.xlsx)
 * Lấy SƠ ĐỒ LỚP hiện tại làm chuẩn gốc:
 * - Sheet 0: 0_SoDoLop_Chuan (Sơ đồ chỗ ngồi 2D trực quan 4 Tổ x 6 Bàn làm chuẩn)
 * - Sheet 1: 1_DanhSach_Chongoi_Diem (Danh sách HS quy chiếu từ Sơ đồ lớp + Điểm các môn)
 * - Sheet 2: 2_NhatKy_NeNep (Ghi nhận vi phạm / điểm cộng quy chiếu theo Sơ đồ lớp)
 * - Sheet 3: 3_NoiQuy_Lop (Danh mục Nội quy lớp làm cơ sở trừ điểm)
 * - Sheet 4: 4_HuongDan
 */
export function downloadUnifiedExcelTemplate(
  masterStudents?: Student[],
  masterLayout?: SeatLayoutNode[],
  currentRules?: RuleItem[]
): void {
  const wb = XLSX.utils.book_new();
  const hasRealRoster = Array.isArray(masterStudents) && masterStudents.length > 0;
  const synced = hasRealRoster
    ? syncStudentsWithSeatingLayout(masterStudents!, masterLayout || [])
    : null;

  // Sheet 0: Sơ đồ lớp 2D Chuẩn
  if (synced && synced.students.length > 0) {
    const ws0Rows = build2DSeatingGridAoA(synced.students, synced.layout);
    const ws0 = XLSX.utils.aoa_to_sheet(ws0Rows);
    ws0['!cols'] = [
      { wch: 16 },
      { wch: 26 },
      { wch: 26 },
      { wch: 26 },
      { wch: 26 },
      { wch: 26 },
      { wch: 26 },
      { wch: 26 },
      { wch: 26 },
    ];
    XLSX.utils.book_append_sheet(wb, ws0, '0_SoDoLop_Chuan');
  }

  // Sheet 1: Danh sách + Chỗ ngồi (Quy chiếu từ Sơ đồ lớp - gọn nhẹ, không kèm điểm môn học)
  const sheet1Headers = [
    'STT',
    'Mã HS',
    'Họ và tên',
    'Giới tính',
    'Tổ',
    'Chức vụ',
    'Dãy bàn',
    'Số bàn',
  ];

  const sheet1SampleRows =
    synced && synced.students.length > 0
      ? synced.students.map((s, idx) => [
          idx + 1,
          s.maHS,
          s.hoTen,
          s.gioiTinh === 'Nu' ? 'Nữ' : 'Nam',
          s.to,
          formatRolesForExcel(s.vaiTro),
          s.dayBan || s.to,
          s.soBan || Math.min(6, Math.floor(idx / 8) + 1),
        ])
      : [
          [1, 'HS01', 'Nguyễn Minh Khôi', 'Nam', 1, 'LT', 1, 1],
          [2, 'HS02', 'Trần Ngọc Bảo Trâm', 'Nữ', 1, 'LP_HT', 1, 1],
        ];

  const ws1 = XLSX.utils.aoa_to_sheet([sheet1Headers, ...sheet1SampleRows]);
  ws1['!cols'] = [
    { wch: 6 },  // STT
    { wch: 10 }, // Mã HS
    { wch: 26 }, // Họ và tên
    { wch: 10 }, // Giới tính
    { wch: 6 },  // Tổ
    { wch: 12 }, // Chức vụ
    { wch: 10 }, // Dãy bàn
    { wch: 10 }, // Số bàn
  ];
  XLSX.utils.book_append_sheet(wb, ws1, '1_DanhSach_Chongoi');

  // Sheet 2: Nhật ký Nề nếp / Vi phạm & Điểm cộng
  const sheet2Headers = [
    'Ngày học',
    'Buổi',
    'Tuần',
    'Mã hoặc Họ tên HS',
    'Tổ',
    'Nhóm hành vi',
    'Nội dung hành vi',
    'Loại điểm',
    'Số điểm',
    'Ghi chú',
  ];

  const todayStr = new Date().toISOString().split('T')[0];
  const sampleStu1 = synced?.students?.[0]?.hoTen || 'Nguyễn Minh Khôi';
  const sampleTo1 = synced?.students?.[0]?.to || 1;
  const sheet2SampleRows = [
    [todayStr, 'Sáng', 10, sampleStu1, sampleTo1, 'Học tập', 'Phát biểu xây dựng bài sôi nổi', 'Cộng', 5, 'Tiết Toán'],
  ];

  const ws2 = XLSX.utils.aoa_to_sheet([sheet2Headers, ...sheet2SampleRows]);
  ws2['!cols'] = [
    { wch: 14 },
    { wch: 10 },
    { wch: 8 },
    { wch: 24 },
    { wch: 6 },
    { wch: 18 },
    { wch: 32 },
    { wch: 12 },
    { wch: 10 },
    { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, '2_NhatKy_NeNep');

  // Sheet 3: Nội quy lớp (Cơ sở trừ điểm)
  const ws3Rows = buildRulesSheetAoA(currentRules);
  const ws3 = XLSX.utils.aoa_to_sheet(ws3Rows);
  ws3['!cols'] = [
    { wch: 6 },
    { wch: 12 },
    { wch: 20 },
    { wch: 44 },
    { wch: 18 },
    { wch: 10 },
    { wch: 18 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, ws3, '3_NoiQuy_Lop');

  // Sheet 4: Hướng dẫn nhanh ngay trong file Excel
  const sheet4Guide = [
    ['HƯỚNG DẪN NHANH (1 FILE DUY NHẤT) - LỚP 10A5 (CẬP NHẬT MỚI)'],
    ['1. Sheet "0_SoDoLop_Chuan": Sơ đồ lớp 4 Tổ x 6 Bàn làm chuẩn gốc (chế độ Sơ đồ chọn trực tiếp vị trí bàn, đã lược bỏ thanh tìm kiếm).'],
    ['2. Sheet "1_DanhSach_Chongoi_Diem": Danh sách học sinh, chức vụ (LT, BT, PBT, LP_HT, LP_LD, LP_VT, CD, TT) và điểm môn học.'],
    ['3. Sheet "2_NhatKy_NeNep": Ghi nhận vi phạm / điểm cộng theo tuần.'],
    [`4. Sheet "3_NoiQuy_Lop": Phân loại vi phạm chia thành 4 nhóm: ${STANDARD_RULE_CATEGORIES.join('; ')} (và nhóm "Điểm cộng").`],
    ['5. Mục "★ Hay dùng" (thay thế mục Tất cả): Các lỗi có cột "Ghim hay dùng" = "Có" sẽ hiện trong tab "★ Hay dùng" để Ban cán sự bấm chọn nhanh.'],
    ['6. Mức độ vi phạm: Căn cứ vào quy định file hoặc điểm trừ: Trừ 1–2đ = Nhẹ (viền đen), Trừ 3–4đ = Vừa (viền cam), Trừ ≥5đ = Nặng (viền đỏ).'],
  ];
  const ws4 = XLSX.utils.aoa_to_sheet(sheet4Guide);
  ws4['!cols'] = [{ wch: 115 }];
  XLSX.utils.book_append_sheet(wb, ws4, '4_HuongDan');

  XLSX.writeFile(wb, 'File_Mau_Nhap_Du_Lieu_10A5_Chuan_SoDoLop.xlsx');
}

/**
 * Xuất toàn bộ dữ liệu thực tế hiện tại của lớp ra 1 File Excel (.xlsx) chuẩn Sơ đồ lớp
 * File xuất ra có Sheet 0_SoDoLop_Chuan làm gốc và quy chiếu toàn bộ Điểm + Nề nếp + Nội quy.
 */
export function exportCurrentClassToUnifiedExcel(
  students: Student[],
  layout: SeatLayoutNode[],
  records: DisciplineRecord[],
  academicRecords: StudentAcademicRecord[],
  rules?: RuleItem[]
): void {
  const wb = XLSX.utils.book_new();

  // Đồng bộ lấy Sơ đồ lớp làm chuẩn gốc
  const synced = syncStudentsWithSeatingLayout(students, layout);
  const masterStudents = synced.students;
  const masterLayout = synced.layout;

  // Sheet 0: Sơ đồ lớp 2D Chuẩn
  if (masterStudents.length > 0) {
    const ws0Rows = build2DSeatingGridAoA(masterStudents, masterLayout);
    const ws0 = XLSX.utils.aoa_to_sheet(ws0Rows);
    ws0['!cols'] = [
      { wch: 16 },
      { wch: 26 },
      { wch: 26 },
      { wch: 26 },
      { wch: 26 },
      { wch: 26 },
      { wch: 26 },
      { wch: 26 },
      { wch: 26 },
    ];
    XLSX.utils.book_append_sheet(wb, ws0, '0_SoDoLop_Chuan');
  }

  // Sheet 1: Danh sách học sinh & chỗ ngồi (Quy chiếu từ Sơ đồ lớp - gọn nhẹ, chỉ xoay quanh nề nếp/thi đua)
  const sheet1Headers = [
    'STT',
    'Mã HS',
    'Họ và tên',
    'Giới tính',
    'Tổ',
    'Chức vụ',
    'Dãy bàn',
    'Số bàn',
  ];

  const sheet1Rows = masterStudents.map((s, idx) => [
    idx + 1,
    s.maHS,
    s.hoTen,
    s.gioiTinh === 'Nu' ? 'Nữ' : 'Nam',
    s.to,
    formatRolesForExcel(s.vaiTro),
    s.dayBan || s.to,
    s.soBan || Math.min(6, Math.floor(idx / 8) + 1),
  ]);

  const ws1 = XLSX.utils.aoa_to_sheet([sheet1Headers, ...sheet1Rows]);
  ws1['!cols'] = [
    { wch: 6 },
    { wch: 10 },
    { wch: 26 },
    { wch: 10 },
    { wch: 6 },
    { wch: 12 },
    { wch: 10 },
    { wch: 10 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, '1_DanhSach_Chongoi');

  // Sheet 2: Nhật ký nề nếp (Quy chiếu theo Sơ đồ lớp)
  const sheet2Headers = [
    'Ngày học',
    'Buổi',
    'Tuần',
    'Mã hoặc Họ tên HS',
    'Tổ',
    'Nhóm hành vi',
    'Nội dung hành vi',
    'Loại điểm',
    'Số điểm',
    'Ghi chú',
  ];

  const activeRecords = reconcileDisciplineRecordsWithSeating(
    masterStudents,
    (records || []).filter(r => r.trangThai !== 'DaHuy')
  );
  const sheet2Rows = activeRecords.map(r => [
    r.ngayHoc,
    r.buoi === 'Chieu' ? 'Chiều' : 'Sáng',
    r.tuanHoc,
    r.hoTen || r.maHS,
    r.to,
    r.nhomHanhVi,
    r.tenHanhVi,
    r.loaiDiem === 'Cong' ? 'Cộng' : 'Trừ',
    r.diemSo,
    r.ghiChu || '',
  ]);

  const ws2 = XLSX.utils.aoa_to_sheet([sheet2Headers, ...sheet2Rows]);
  ws2['!cols'] = [
    { wch: 14 },
    { wch: 10 },
    { wch: 8 },
    { wch: 24 },
    { wch: 6 },
    { wch: 18 },
    { wch: 32 },
    { wch: 12 },
    { wch: 10 },
    { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, '2_NhatKy_NeNep');

  // Sheet 3: Nội quy lớp (Cơ sở trừ điểm)
  const ws3Rows = buildRulesSheetAoA(rules);
  const ws3 = XLSX.utils.aoa_to_sheet(ws3Rows);
  ws3['!cols'] = [
    { wch: 6 },
    { wch: 12 },
    { wch: 22 },
    { wch: 44 },
    { wch: 18 },
    { wch: 10 },
    { wch: 18 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, ws3, '3_NoiQuy_Lop');

  // Sheet 4: Hướng dẫn nhanh bổ sung các thay đổi mới
  const sheet4Guide = [
    ['HƯỚNG DẪN NHANH (1 FILE DUY NHẤT) - LỚP 10A5 (CẬP NHẬT MỚI)'],
    ['1. Sheet "0_SoDoLop_Chuan": Sơ đồ lớp 4 Tổ x 6 Bàn làm chuẩn gốc (chế độ Sơ đồ chọn trực tiếp vị trí bàn, đã lược bỏ thanh tìm kiếm).'],
    ['2. Sheet "1_DanhSach_Chongoi_Diem": Danh sách học sinh, chức vụ (LT, BT, PBT, LP_HT, LP_LD, LP_VT, CD, TT) và điểm môn học.'],
    ['3. Sheet "2_NhatKy_NeNep": Ghi nhận vi phạm / điểm cộng theo tuần.'],
    [`4. Sheet "3_NoiQuy_Lop": Phân loại vi phạm chia thành 4 nhóm: ${STANDARD_RULE_CATEGORIES.join('; ')} (và nhóm "Điểm cộng").`],
    ['5. Mục "★ Hay dùng" (thay thế mục Tất cả): Các lỗi có cột "Ghim hay dùng" = "Có" sẽ hiện trong tab "★ Hay dùng" để Ban cán sự bấm chọn nhanh.'],
    ['6. Mức độ vi phạm: Căn cứ vào quy định file hoặc điểm trừ: Trừ 1–2đ = Nhẹ (viền đen), Trừ 3–4đ = Vừa (viền cam), Trừ ≥5đ = Nặng (viền đỏ).'],
  ];
  const ws4 = XLSX.utils.aoa_to_sheet(sheet4Guide);
  ws4['!cols'] = [{ wch: 115 }];
  XLSX.utils.book_append_sheet(wb, ws4, '4_HuongDan');

  const dateTag = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `Du_Lieu_Lop_10A5_Chuan_SoDoLop_${dateTag}.xlsx`);
}

/**
 * Xuất file Word (.doc) Hướng dẫn Chuẩn hóa Dữ liệu & Câu lệnh AI Mẫu
 * Hoàn toàn thống nhất với cơ chế "Đưa 1 file vào là đủ thông tin"
 */
export function exportDataSpecsWordDocument(): void {
  const dateStr = new Date().toLocaleDateString('vi-VN');

  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' 
          xmlns:w='urn:schemas-microsoft-com:office:word' 
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>Hướng Dẫn Nhập Xuất Dữ Liệu Đơn Giản - Lớp 10A5</title>
      <style>
        @page { size: A4; margin: 2cm; }
        body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.5; color: #111827; }
        h1 { font-size: 16pt; font-weight: bold; text-align: center; color: #1e3a8a; text-transform: uppercase; margin-bottom: 6pt; }
        .subtitle { text-align: center; font-style: italic; color: #4b5563; font-size: 11pt; margin-bottom: 14pt; border-bottom: 1px solid #1e3a8a; padding-bottom: 8pt; }
        h2 { font-size: 13.5pt; font-weight: bold; color: #1d4ed8; margin-top: 14pt; margin-bottom: 6pt; }
        table { width: 100%; border-collapse: collapse; margin: 8pt 0; font-size: 11pt; }
        th, td { border: 1px solid #9ca3af; padding: 5pt 6pt; text-align: left; }
        th { background-color: #dbeafe; color: #1e3a8a; font-weight: bold; }
        .code-box { background-color: #f8fafc; border: 1px dashed #64748b; padding: 8pt; font-family: 'Courier New', monospace; font-size: 10.5pt; white-space: pre-wrap; }
      </style>
    </head>
    <body>
      <h1>HƯỚNG DẪN NHẬP DỮ LIỆU ĐƠN GIẢN (1 FILE EXCEL)</h1>
      <div class="subtitle">Hệ thống Quản lý Lớp 10A5 — Ngày xuất: ${dateStr}</div>

      <h2>1. Cách nhập dữ liệu (3 bước)</h2>
      <ol>
        <li>Bấm <b>"Tải File Excel Mẫu"</b> hoặc <b>"Tải File Mẫu Nội Quy Lớp (.xlsx)"</b>.</li>
        <li>Điền danh sách học sinh, bảng điểm hoặc nội quy lớp vào file mẫu.</li>
        <li>Tải file Excel vừa lưu lên mục <b>Nhập / Xuất</b> hoặc <b>Nội quy</b>.</li>
      </ol>

      <h2>2. Quy tắc chuẩn hóa 4 Nhóm vi phạm, mục Hay dùng &amp; Mức độ</h2>
      <p><b>A. Мục "★ Hay dùng" &amp; 4 Nhóm vi phạm chuẩn (khớp 100% với thanh chọn của Ban cán sự):</b></p>
      <ul>
        <li><b>★ Hay dùng (thay cho mục Tất cả):</b> Hiển thị các hành vi có cột <b>Ghim = Có</b> để Ban cán sự chọn nhanh ngay khi mở khung ghi nhận.</li>
        <li><b>Học tập:</b> Không thuộc bài, thiếu bài tập, quên sách vở, nói chuyện/mất trật tự/ngủ gật trong giờ học, gian lận kiểm tra, điểm yếu kém.</li>
        <li><b>Hoạt động/Lao động:</b> Sinh hoạt lớp, chào cờ, xếp hàng, thể dục giữa giờ, hoạt động Đoàn - Đội, văn nghệ, thể thao, trực nhật, quét lớp, lau bảng, đổ rác, vệ sinh lớp học/hành lang, tắt điện quạt.</li>
        <li><b>Tác phong:</b> Đi học muộn, vào lớp trễ, đồng phục, bảng tên, huy hiệu Đoàn, giày dép, đầu tóc, trang phục.</li>
        <li><b>Nề nếp/Đạo đức:</b> Nghỉ học có phép/không phép, bỏ tiết, trốn tiết, điện thoại, ăn quà vặt, nói tục, vô lễ, đánh nhau, an toàn giao thông, tài sản chung.</li>
        <li><i>(Và nhóm <b>Điểm cộng</b> đối với các hành vi khen thưởng, phát biểu, đạt điểm giỏi).</i></li>
      </ul>
      <p><b>B. Phân loại mức độ vi phạm (hiển thị bằng màu viền trên nút chọn):</b></p>
      <ul>
        <li><b>Mức Nhẹ (Viền đen):</b> Điểm trừ 1 – 2 điểm (hoặc cột Mức độ ghi Nhẹ).</li>
        <li><b>Mức Vừa (Viền cam):</b> Điểm trừ 3 – 4 điểm (hoặc cột Mức độ ghi Vừa).</li>
        <li><b>Mức Nặng (Viền đỏ):</b> Điểm trừ từ 5 điểm trở lên (hoặc cột Mức độ ghi Nặng).</li>
      </ul>

      <h2>3. Bảng mẫu Nội quy lớp</h2>
      <table>
        <thead>
          <tr>
            <th>Mã nội quy</th>
            <th>Nhóm hành vi</th>
            <th>Tên hành vi</th>
            <th>Loại điểm</th>
            <th>Điểm số</th>
            <th>Mức độ</th>
            <th>Ghim (Hay dùng)</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>NQ01</td><td>Học tập</td><td>Không làm bài tập / Mất trật tự trong giờ</td><td>Trừ</td><td>3</td><td>Vừa</td><td>Có</td></tr>
          <tr><td>NQ03</td><td>Hoạt động/Lao động</td><td>Không tập thể dục giữa giờ / Không trực nhật</td><td>Trừ</td><td>2</td><td>Nhẹ</td><td>Có</td></tr>
          <tr><td>NQ05</td><td>Tác phong</td><td>Đi học muộn / Sai đồng phục, thiếu bảng tên</td><td>Trừ</td><td>2</td><td>Nhẹ</td><td>Có</td></tr>
          <tr><td>NQ07</td><td>Nề nếp/Đạo đức</td><td>Nghỉ học không phép / Bỏ tiết</td><td>Trừ</td><td>5</td><td>Nặng</td><td>Có</td></tr>
          <tr><td>KT01</td><td>Điểm cộng</td><td>Phát biểu xây dựng bài sôi nổi</td><td>Cộng</td><td>2</td><td>Nhẹ</td><td>Có</td></tr>
        </tbody>
      </table>

      <h2>4. Câu lệnh AI mẫu (nếu nhờ ChatGPT / Gemini tạo bảng)</h2>
      <div class="code-box">${AI_MASTER_PROMPT_TEXT}</div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Huong_Dan_Nhap_Xuat_1_File_10A5.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
