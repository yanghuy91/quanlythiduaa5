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

/**
 * Bản mẫu Câu lệnh AI (Prompt) chuẩn hóa — Gom toàn bộ thông tin vào 1 Bảng / 1 File duy nhất
 * Lấy SƠ ĐỒ LỚP làm chuẩn gốc và quy chiếu các danh sách khác từ Sơ đồ lớp.
 */
export const AI_MASTER_PROMPT_TEXT = `Đóng vai trợ lý dữ liệu giáo dục chuyên nghiệp. Hãy đọc toàn bộ file/hình ảnh tôi đính kèm (sơ đồ lớp học, danh sách lớp, bảng điểm, nội quy lớp hoặc sổ ghi đầu bài/nề nếp) và chuẩn hóa thành ĐÚNG CẤU TRÚC BẢNG CHUẨN dưới đây.
NGUYÊN TẮC BẮT BUỘC: LẤY SƠ ĐỒ LỚP LÀM CHUẨN GỐC (Mã HS, Họ và tên, Tổ 1..4 theo Dãy bàn 1..4, Số bàn 1..6), mọi danh sách khác (điểm môn học, nề nếp, thông tin cá nhân) phải quy chiếu theo đúng học sinh trên Sơ đồ lớp:

1. BẢNG TỔNG HỢP CHUẨN THEO SƠ ĐỒ LỚP - ĐIỂM MÔN HỌC (Ngăn cách bằng dấu Tab hoặc xuất ra Sheet 1 file Excel):
Các cột theo đúng thứ tự:
STT | Mã HS | Họ và tên | Giới tính | Ngày sinh | Tổ | Chức vụ | Dãy bàn | Số bàn | Toán | Ngữ văn | Tiếng Anh | Vật lí | Hóa học | Sinh học | Lịch sử | Địa lí | GDKT&PL | Tin học | Công nghệ | GDQP-AN | GDTC | HĐTN-HN | Nhận xét GVCN

Quy tắc điền dữ liệu Bảng 1:
- Mã HS: HS01, HS02... theo chuẩn Sơ đồ lớp.
- Họ và tên: Viết hoa chữ cái đầu mỗi từ (VD: Nguyễn Văn An).
- Giới tính: Chỉ ghi "Nam" hoặc "Nữ". (Nếu nguồn không ghi rõ, hãy tự suy luận hợp lý theo tên tiếng Việt).
- Ngày sinh: Định dạng DD/MM/YYYY (nếu có, không có để trống).
- Tổ: Ghi số 1, 2, 3 hoặc 4 theo đúng Dãy bàn trên Sơ đồ lớp (Dãy 1 = Tổ 1, Dãy 2 = Tổ 2, Dãy 3 = Tổ 3, Dãy 4 = Tổ 4).
- Chức vụ: Ghi mã viết tắt chuẩn:
  + LT (Lớp trưởng)
  + BT (Bí thư)
  + PBT (Phó Bí thư)
  + LP_HT (Lớp phó học tập)
  + LP_LD (Lớp phó lao động)
  + LP_VT (Lớp phó văn thể)
  + CD (Cờ đỏ)
  + TT (Tổ trưởng)
  + HS (Học sinh - mặc định nếu không giữ chức vụ)
- Dãy bàn: Số từ 1 đến 4 (chuẩn theo Tổ trên Sơ đồ lớp).
- Số bàn: Số bàn từ 1 đến 6 (tính từ trên bục giảng xuống theo Sơ đồ lớp).
- Các cột môn tính điểm (Toán -> GDQP-AN): Quy chiếu từ bảng điểm vào đúng học sinh trên Sơ đồ lớp, ghi điểm trung bình môn hệ 10 (VD: 8.5). Nếu chưa có điểm thì để trống.
- Các cột môn nhận xét (GDTC, HĐTN-HN): Ghi "Đ" (Đạt) hoặc "CĐ" (Chưa đạt). Nếu chưa có thì để trống.

2. BẢNG NỘI QUY LỚP (CƠ SỞ TRỪ ĐIỂM & CỘNG ĐIỂM - Chỉ tạo nếu tài liệu có nội quy):
Các cột theo đúng thứ tự:
Mã nội quy | Nhóm hành vi | Tên hành vi | Loại điểm | Điểm số | Mức độ | Ghim
- Loại điểm: "Trừ" hoặc "Cộng"
- Điểm số: Số nguyên dương (VD: 2, 5, 10)
- Mức độ: "Nhẹ", "Vừa" hoặc "Nặng"

3. BẢNG NHẬT KÝ NỀ NẾP - VI PHẠM & ĐIỂM CỘNG (Quy chiếu theo học sinh trên Sơ đồ lớp - Chỉ tạo nếu có dữ liệu vi phạm/điểm cộng):
Các cột theo đúng thứ tự:
Ngày học | Buổi | Tuần | Mã hoặc Họ tên HS | Tổ | Nhóm hành vi | Nội dung hành vi | Loại điểm | Số điểm | Ghi chú
- Ngày học: YYYY-MM-DD (VD: 2026-11-09)
- Buổi: "Sáng" hoặc "Chiều"
- Loại điểm: "Trừ" (vi phạm) hoặc "Cộng" (tuyên dương)
- Số điểm: Số nguyên dương (VD: 2, 5, 10)

YÊU CẦU QUAN TRỌNG: Chỉ xuất ra bảng dữ liệu sạch đã quy chiếu chuẩn theo Sơ đồ lớp để tôi copy hoặc tải về 1 file Excel (.xlsx) thả thẳng vào phần mềm, không giải thích dài dòng.`;

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
            nhomHanhVi: 'Chuyên cần',
            tenHanhVi: 'Đi học muộn (sau trống vào lớp)',
            loaiDiem: 'Tru',
            diemSo: 2,
            mucDo: 'Nhe',
            ghim: true,
            thuTu: 1,
          },
          {
            maNoiQuy: 'NQ02',
            nhomHanhVi: 'Chuyên cần',
            tenHanhVi: 'Nghỉ học không phép / Bỏ tiết',
            loaiDiem: 'Tru',
            diemSo: 10,
            mucDo: 'Nang',
            ghim: true,
            thuTu: 2,
          },
          {
            maNoiQuy: 'NQ03',
            nhomHanhVi: 'Tác phong',
            tenHanhVi: 'Không mặc đồng phục / Thiếu bảng tên, phù hiệu',
            loaiDiem: 'Tru',
            diemSo: 2,
            mucDo: 'Nhe',
            ghim: true,
            thuTu: 3,
          },
          {
            maNoiQuy: 'NQ04',
            nhomHanhVi: 'Học tập',
            tenHanhVi: 'Không làm bài tập về nhà / Không thuộc bài cũ',
            loaiDiem: 'Tru',
            diemSo: 5,
            mucDo: 'Vua',
            ghim: true,
            thuTu: 4,
          },
          {
            maNoiQuy: 'NQ05',
            nhomHanhVi: 'Trật tự',
            tenHanhVi: 'Mất trật tự, nói chuyện riêng trong giờ học',
            loaiDiem: 'Tru',
            diemSo: 3,
            mucDo: 'Vua',
            ghim: true,
            thuTu: 5,
          },
          {
            maNoiQuy: 'NQ06',
            nhomHanhVi: 'Vệ sinh',
            tenHanhVi: 'Không trực nhật / Xả rác bừa bãi trong lớp',
            loaiDiem: 'Tru',
            diemSo: 3,
            mucDo: 'Vua',
            ghim: false,
            thuTu: 6,
          },
          {
            maNoiQuy: 'KT01',
            nhomHanhVi: 'Điểm cộng',
            tenHanhVi: 'Phát biểu xây dựng bài sôi nổi / Đạt điểm 9, 10',
            loaiDiem: 'Cong',
            diemSo: 5,
            mucDo: 'Nhe',
            ghim: true,
            thuTu: 7,
          },
        ];

  const rows = defaultSampleRules.map((r, idx) => [
    idx + 1,
    r.maNoiQuy,
    r.nhomHanhVi,
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
    ['HƯỚNG DẪN LẬP & NHẬP FILE NỘI QUY LỚP (CƠ SỞ TRỪ ĐIỂM & CỘNG ĐIỂM) - LỚP 10A5'],
    [''],
    ['1. Thầy có thể chỉnh sửa trực tiếp danh sách quy định trừ điểm / cộng điểm trong Sheet "1_Noi_Quy_Lop" hoặc thêm dòng mới.'],
    ['2. Cột "Tên hành vi (Nội dung quy định)" và "Điểm số" là 2 thông tin quan trọng nhất làm cơ sở trừ điểm khi chấm nề nếp.'],
    ['3. Cột "Loại điểm": Điền "Trừ" (đối với lỗi vi phạm) hoặc "Cộng" (đối với hành vi tuyên dương/khen thưởng). Nếu bỏ trống mặc định là "Trừ".'],
    ['4. Cột "Mức độ": Điền "Nhẹ", "Vừa" hoặc "Nặng" (Các lỗi "Nặng" sẽ làm viền ghế trên sơ đồ lớp chuyển màu đỏ cảnh báo).'],
    ['5. Cột "Ghim hay dùng": Điền "Có" để ghim hành vi đó lên đầu bảng chọn nhanh khi Giáo viên hoặc Ban cán sự bấm chấm điểm trên Sơ đồ lớp.'],
    ['6. Sau khi lưu file, thầy vào mục "Nội quy" hoặc "Nhập / Xuất" -> Bấm "Up File Nội Quy Lớp Theo Mẫu" để áp dụng ngay làm cơ sở trừ điểm!'],
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

    // Nhóm hành vi
    const nhomHanhVi =
      rawGroup ||
      (loaiDiem === 'Cong'
        ? 'Điểm cộng'
        : lowerName.includes('muon') || lowerName.includes('nghi') || lowerName.includes('tiet')
        ? 'Chuyên cần'
        : lowerName.includes('dong phuc') || lowerName.includes('tac phong')
        ? 'Tác phong'
        : lowerName.includes('bai') || lowerName.includes('vo')
        ? 'Học tập'
        : lowerName.includes('ve sinh') || lowerName.includes('truc nhat') || lowerName.includes('rac')
        ? 'Vệ sinh'
        : 'Nề nếp');

    // Mức độ
    let mucDo: SeverityLevel = 'Nhe';
    if (rawSeverity.includes('nang') || diemSo >= 10) {
      mucDo = 'Nang';
    } else if (rawSeverity.includes('vua') || (diemSo >= 3 && diemSo < 10)) {
      mucDo = 'Vua';
    }

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

  // Sheet 1: Danh sách + Chỗ ngồi + Điểm môn học (Quy chiếu từ Sơ đồ lớp)
  const sheet1Headers = [
    'STT',
    'Mã HS',
    'Họ và tên',
    'Giới tính',
    'Ngày sinh',
    'Tổ',
    'Chức vụ',
    'Dãy bàn',
    'Số bàn',
    'SĐT Phụ huynh',
    ...DEFAULT_SUBJECTS.map(s => s.shortName),
    'Nhận xét GVCN',
  ];

  const sheet1SampleRows =
    synced && synced.students.length > 0
      ? synced.students.map((s, idx) => [
          idx + 1,
          s.maHS,
          s.hoTen,
          s.gioiTinh === 'Nu' ? 'Nữ' : 'Nam',
          s.ngaySinh || '',
          s.to,
          formatRolesForExcel(s.vaiTro),
          s.dayBan || s.to,
          s.soBan || Math.min(6, Math.floor(idx / 8) + 1),
          s.sdtPhuHuynh || '',
          ...DEFAULT_SUBJECTS.map(subj => (subj.type === 'evaluate' ? 'Đ' : '')),
          '',
        ])
      : [
          [
            1, 'HS01', 'Nguyễn Minh Khôi', 'Nam', '15/03/2011', 1, 'LT', 1, 1, '0901234567',
            9.2, 8.5, 9.0, 8.8, 8.6, 8.4, 8.5, 8.7, 9.0, 9.5, 8.8, 9.0, 'Đ', 'Đ',
            'Lớp trưởng gương mẫu, học giỏi đều các môn',
          ],
          [
            2, 'HS02', 'Trần Ngọc Bảo Trâm', 'Nữ', '22/08/2011', 1, 'LP_HT', 1, 1, '0902345678',
            8.8, 9.2, 9.4, 8.2, 8.5, 8.8, 9.0, 8.9, 9.1, 8.7, 8.6, 8.8, 'Đ', 'Đ',
            'Năng nổ trong học tập, hỗ trợ các bạn rất tốt',
          ],
        ];

  const ws1 = XLSX.utils.aoa_to_sheet([sheet1Headers, ...sheet1SampleRows]);
  ws1['!cols'] = [
    { wch: 6 },  // STT
    { wch: 10 }, // Mã HS
    { wch: 24 }, // Họ và tên
    { wch: 10 }, // Giới tính
    { wch: 13 }, // Ngày sinh
    { wch: 6 },  // Tổ
    { wch: 12 }, // Chức vụ
    { wch: 9 },  // Dãy bàn
    { wch: 9 },  // Số bàn
    { wch: 14 }, // SĐT
    ...DEFAULT_SUBJECTS.map(() => ({ wch: 10 })),
    { wch: 32 }, // Nhận xét
  ];
  XLSX.utils.book_append_sheet(wb, ws1, '1_DanhSach_Chongoi_Diem');

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
    ['HƯỚNG DẪN NHẬP DỮ LIỆU CHUẨN SƠ ĐỒ LỚP & NỘI QUY LỚP (1 FILE DUY NHẤT) - LỚP 10A5'],
    [''],
    ['NGUYÊN TẮC VÀNG: DÙ LẤY DỮ LIỆU TỪ FILE NÀO, HỆ THỐNG LUÔN LẤY SƠ ĐỒ LỚP LÀM CHUẨN GỐC VÀ TỰ ĐỘNG QUY CHIẾU CÁC DANH SÁCH KHÁC TỪ SƠ ĐỒ LỚP.'],
    ['0. Sheet "0_SoDoLop_Chuan": Sơ đồ chỗ ngồi 2D trực quan của lớp (4 Tổ / 4 Dãy bàn x 6 Bàn). Đây là chuẩn gốc về Mã HS, Họ tên, Tổ và chỗ ngồi.'],
    ['1. Sheet "1_DanhSach_Chongoi_Diem": Chứa Danh sách học sinh đã quy chiếu từ Sơ đồ lớp kèm Điểm các môn học.'],
    ['   - Mã chức vụ hỗ trợ: LT (Lớp trưởng), BT (Bí thư), PBT (Phó Bí thư), LP_HT (Lớp phó học tập), LP_LD (Lớp phó lao động), LP_VT (Lớp phó văn thể), CD (Cờ đỏ), TT (Tổ trưởng).'],
    ['2. Sheet "2_NhatKy_NeNep": Chứa các lượt ghi nhận vi phạm hoặc điểm cộng (Tự động quy chiếu Tổ và Mã HS từ Sơ đồ lớp).'],
    ['3. Sheet "3_NoiQuy_Lop": Chứa danh mục Nội quy lớp (Cơ sở trừ điểm / cộng điểm) để Giáo viên và Ban cán sự bấm chấm điểm hàng ngày.'],
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

  // Quy chiếu Bảng điểm theo Sơ đồ lớp
  const reconciledGrades = reconcileAcademicRecordsWithSeating(masterStudents, academicRecords || [], 1);
  const gradeByMa = new Map<string, StudentAcademicRecord>();
  reconciledGrades.forEach(ar => {
    if ((ar.hocKi || 1) === 1) {
      gradeByMa.set(ar.maHS.toUpperCase(), ar);
    }
  });

  const sheet1Headers = [
    'STT',
    'Mã HS',
    'Họ và tên',
    'Giới tính',
    'Ngày sinh',
    'Tổ',
    'Chức vụ',
    'Dãy bàn',
    'Số bàn',
    'SĐT Phụ huynh',
    ...DEFAULT_SUBJECTS.map(s => s.shortName),
    'Nhận xét GVCN',
  ];

  const sheet1Rows = masterStudents.map((s, idx) => {
    const ar = gradeByMa.get(s.maHS.toUpperCase());
    const subjValues = DEFAULT_SUBJECTS.map(subj => {
      const sc = ar?.subjects?.[subj.id];
      if (!sc) return '';
      if (subj.type === 'evaluate') return sc.evaluateResult || 'Đ';
      return sc.tb !== null && sc.tb !== undefined ? sc.tb : '';
    });

    return [
      idx + 1,
      s.maHS,
      s.hoTen,
      s.gioiTinh === 'Nu' ? 'Nữ' : 'Nam',
      s.ngaySinh || '',
      s.to,
      formatRolesForExcel(s.vaiTro),
      s.dayBan || s.to,
      s.soBan || Math.min(6, Math.floor(idx / 8) + 1),
      s.sdtPhuHuynh || '',
      ...subjValues,
      ar?.nhanXetGVCN || '',
    ];
  });

  const ws1 = XLSX.utils.aoa_to_sheet([sheet1Headers, ...sheet1Rows]);
  ws1['!cols'] = [
    { wch: 6 },
    { wch: 10 },
    { wch: 24 },
    { wch: 10 },
    { wch: 13 },
    { wch: 6 },
    { wch: 12 },
    { wch: 9 },
    { wch: 9 },
    { wch: 14 },
    ...DEFAULT_SUBJECTS.map(() => ({ wch: 10 })),
    { wch: 32 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, '1_DanhSach_Chongoi_Diem');

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
  if (Array.isArray(rules) && rules.length > 0) {
    const ws3Rows = buildRulesSheetAoA(rules);
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
  }

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
      <title>Hướng Dẫn Nhập Xuất Dữ Liệu 1 File Duy Nhất - Lớp 10A5</title>
      <style>
        @page {
          size: A4;
          margin: 2cm 2cm 2cm 2cm;
        }
        body {
          font-family: 'Times New Roman', serif;
          font-size: 13pt;
          line-height: 1.5;
          color: #111827;
        }
        h1 {
          font-size: 17pt;
          font-weight: bold;
          text-align: center;
          color: #1e3a8a;
          text-transform: uppercase;
          margin-bottom: 6pt;
        }
        .subtitle {
          text-align: center;
          font-style: italic;
          color: #4b5563;
          font-size: 11.5pt;
          margin-bottom: 18pt;
          border-bottom: 2px solid #1e3a8a;
          padding-bottom: 10pt;
        }
        h2 {
          font-size: 14pt;
          font-weight: bold;
          color: #1d4ed8;
          margin-top: 16pt;
          margin-bottom: 8pt;
          background-color: #eff6ff;
          padding: 6pt 10pt;
          border-left: 4px solid #1d4ed8;
        }
        h3 {
          font-size: 13pt;
          font-weight: bold;
          color: #0f766e;
          margin-top: 12pt;
          margin-bottom: 6pt;
        }
        p {
          margin: 6pt 0;
          text-align: justify;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 10pt 0;
          font-size: 11pt;
        }
        th, td {
          border: 1px solid #9ca3af;
          padding: 5pt 6pt;
          text-align: left;
          vertical-align: top;
        }
        th {
          background-color: #dbeafe;
          color: #1e3a8a;
          font-weight: bold;
        }
        .code-box {
          background-color: #f8fafc;
          border: 1px dashed #64748b;
          padding: 10pt;
          font-family: 'Courier New', monospace;
          font-size: 10.5pt;
          margin: 8pt 0;
          white-space: pre-wrap;
        }
        .highlight-box {
          background-color: #ecfdf5;
          border: 1px solid #10b981;
          padding: 10pt;
          margin: 10pt 0;
        }
        ul, ol {
          margin: 6pt 0;
          padding-left: 22pt;
        }
        li {
          margin-bottom: 4pt;
        }
      </style>
    </head>
    <body>
      <h1>HƯỚNG DẪN NHẬP - XUẤT DỮ LIỆU THÔNG MINH (1 FILE DUY NHẤT)</h1>
      <div class="subtitle">
        Hệ thống Quản lý Nề nếp, Sơ đồ lớp &amp; Học tập Lớp 10A5<br/>
        Nguyên tắc: "Đưa 1 file vào là đủ toàn bộ thông tin" — Ngày xuất: ${dateStr}
      </div>

      <div class="highlight-box">
        <b>NGUYÊN TẮC CỐT LÕI (ĐƠN GIẢN &amp; ĐỒNG NHẤT 100%):</b><br/>
        Thay vì phải tách rời nhiều file hay qua nhiều bước phức tạp, hệ thống được thiết kế để <b>chỉ cần thả 1 file Excel (.xlsx) duy nhất</b> (hoặc file Nội quy lớp theo mẫu) vào mục <b>Nhập / Xuất</b> hoặc <b>Nội quy</b>. Hệ thống sẽ tự động đọc và cập nhật đồng thời:<br/>
        1. <b>Danh sách học sinh</b> (Mã HS, Họ và tên, Giới tính, Ngày sinh, SĐT Phụ huynh)<br/>
        2. <b>Phân tổ &amp; Ban cán sự</b> (Tổ 1–4, Lớp trưởng, Bí thư, Phó Bí thư, Lớp phó Học tập/Lao động/Văn thể, Cờ đỏ, Tổ trưởng)<br/>
        3. <b>Sơ đồ chỗ ngồi</b> (Dãy bàn, Số bàn — lấy Sơ đồ lớp 48 chỗ làm chuẩn gốc)<br/>
        4. <b>Nội quy lớp (Cơ sở trừ điểm &amp; cộng điểm)</b> (Mã nội quy, Nhóm hành vi, Tên hành vi, Điểm trừ/cộng, Mức độ)<br/>
        5. <b>Bảng điểm tất cả các môn học &amp; Nhật ký Nề nếp</b>
      </div>

      <h2>I. QUY TRÌNH 3 BƯỚC NHẬP DỮ LIỆU NHANH NHẤT</h2>
      <ol>
        <li><b>Bước 1:</b> Nhấn nút <b>"Tải File Excel Mẫu"</b> hoặc <b>"Tải File Mẫu Nội Quy Lớp (.xlsx)"</b> ngay trên màn hình của giáo viên.</li>
        <li><b>Bước 2:</b> Mở file Excel mẫu, điền danh sách học sinh, chức vụ, điểm các môn hoặc bảng Nội quy lớp (các hành vi và mức điểm trừ).</li>
        <li><b>Bước 3:</b> Kéo thả file Excel vừa lưu vào hệ thống và bấm <b>"Áp Dụng Ngay"</b>. Toàn bộ dữ liệu sẽ được cập nhật và đồng bộ tức thì lên Đám mây (Firebase)!</li>
      </ol>

      <h2>II. QUY TẮC CÁC CỘT TRONG FILE EXCEL CHUẨN</h2>

      <h3>1. Sheet "1_DanhSach_Chongoi_Diem" (Danh sách + Chỗ ngồi + Điểm môn học)</h3>
      <table>
        <thead>
          <tr>
            <th style="width: 22%;">Tên cột chuẩn</th>
            <th style="width: 18%;">Mức độ</th>
            <th style="width: 60%;">Quy tắc nhập &amp; Giá trị hợp lệ</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><b>STT, Mã HS</b></td>
            <td>Tự động</td>
            <td>VD: <b>HS01, HS02...</b> (Theo chuẩn Sơ đồ lớp 48 học sinh).</td>
          </tr>
          <tr>
            <td><b>Họ và tên</b></td>
            <td><b>BẮT BUỘC</b></td>
            <td>Họ và tên đầy đủ của học sinh (VD: <i>Nguyễn Minh Khôi</i>).</td>
          </tr>
          <tr>
            <td><b>Giới tính, Ngày sinh</b></td>
            <td>Tùy chọn</td>
            <td>Ghi <b>Nam</b> hoặc <b>Nữ</b>; Ngày sinh định dạng DD/MM/YYYY.</td>
          </tr>
          <tr>
            <td><b>Tổ, Dãy bàn, Số bàn</b></td>
            <td>Tự động</td>
            <td>Tổ 1–4 tương ứng Dãy bàn 1–4, Số bàn 1–6 (tối đa 48 ghế chuẩn).</td>
          </tr>
          <tr>
            <td><b>Chức vụ</b></td>
            <td>Tùy chọn</td>
            <td>
              Ghi mã viết tắt hoặc tên chức vụ đều được:<br/>
              - <b>LT</b> (hoặc <i>Lớp trưởng</i>)<br/>
              - <b>BT</b> (hoặc <i>Bí thư</i>)<br/>
              - <b>PBT</b> (hoặc <i>Phó Bí thư</i>)<br/>
              - <b>LP_HT</b> (hoặc <i>Lớp phó học tập</i>)<br/>
              - <b>LP_LD</b> (hoặc <i>Lớp phó lao động</i>)<br/>
              - <b>LP_VT</b> (hoặc <i>Lớp phó văn thể</i>)<br/>
              - <b>CD</b> (hoặc <i>Cờ đỏ / Sao đỏ</i>)<br/>
              - <b>TT</b> (hoặc <i>Tổ trưởng</i>)<br/>
              - <b>HS</b> (hoặc để trống: Học sinh)
            </td>
          </tr>
          <tr>
            <td><b>Các cột môn học</b></td>
            <td>Tùy chọn</td>
            <td>Điền điểm trung bình môn hệ số 10 (VD: <i>8.5</i>) hoặc <b>Đ / CĐ</b> cho môn nhận xét.</td>
          </tr>
        </tbody>
      </table>

      <h3>2. Sheet "3_NoiQuy_Lop" hoặc File Mẫu Nội Quy Lớp (Cơ sở trừ điểm)</h3>
      <p>Dùng để thiết lập danh mục các lỗi vi phạm và mức điểm trừ/cộng cho lớp:</p>
      <table>
        <thead>
          <tr>
            <th>Mã nội quy</th>
            <th>Nhóm hành vi</th>
            <th>Tên hành vi (Nội dung quy định)</th>
            <th>Loại điểm</th>
            <th>Điểm số</th>
            <th>Mức độ</th>
            <th>Ghim hay dùng</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>NQ01</td>
            <td>Chuyên cần</td>
            <td>Đi học muộn (sau trống vào lớp)</td>
            <td>Trừ</td>
            <td>2</td>
            <td>Nhẹ</td>
            <td>Có</td>
          </tr>
          <tr>
            <td>NQ02</td>
            <td>Chuyên cần</td>
            <td>Nghỉ học không phép / Bỏ tiết</td>
            <td>Trừ</td>
            <td>10</td>
            <td>Nặng</td>
            <td>Có</td>
          </tr>
          <tr>
            <td>KT01</td>
            <td>Điểm cộng</td>
            <td>Phát biểu xây dựng bài sôi nổi</td>
            <td>Cộng</td>
            <td>5</td>
            <td>Nhẹ</td>
            <td>Có</td>
          </tr>
        </tbody>
      </table>

      <h2>III. CÂU LỆNH (PROMPT) MẪU DÀNH CHO AI (CHATGPT / GEMINI)</h2>
      <div class="code-box">${AI_MASTER_PROMPT_TEXT}</div>

      <p style="margin-top: 16pt; text-align: center; font-weight: bold; color: #1e3a8a;">
        — HỆ THỐNG QUẢN LÝ LỚP HỌC THÔNG MINH 10A5 —
      </p>
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
