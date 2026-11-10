import * as XLSX from 'xlsx';
import { Student, SeatLayoutNode, DisciplineRecord, StudentAcademicRecord, RoleCode } from '../types';
import { DEFAULT_SUBJECTS } from '../data/academicCatalog';

/**
 * Bản mẫu Câu lệnh AI (Prompt) chuẩn hóa — Gom toàn bộ thông tin vào 1 Bảng / 1 File duy nhất
 */
export const AI_MASTER_PROMPT_TEXT = `Đóng vai trợ lý dữ liệu giáo dục chuyên nghiệp. Hãy đọc toàn bộ file/hình ảnh tôi đính kèm (danh sách lớp, sơ đồ chỗ ngồi, bảng điểm hoặc sổ ghi đầu bài/nề nếp) và chuẩn hóa thành ĐÚNG CẤU TRÚC BẢNG CHUẨN dưới đây để tôi nạp 1 lần vào Phần mềm Quản lý Lớp học 10A5:

1. BẢNG TỔNG HỢP HỌC SINH - CHỖ NGỒI - ĐIỂM MÔN HỌC (Ngăn cách bằng dấu Tab hoặc xuất ra Sheet 1 file Excel):
Các cột theo đúng thứ tự:
STT | Mã HS | Họ và tên | Giới tính | Ngày sinh | Tổ | Chức vụ | Dãy bàn | Số bàn | Toán | Ngữ văn | Tiếng Anh | Vật lí | Hóa học | Sinh học | Lịch sử | Địa lí | GDKT&PL | Tin học | Công nghệ | GDQP-AN | GDTC | HĐTN-HN | Nhận xét GVCN

Quy tắc điền dữ liệu Bảng 1:
- Mã HS: HS01, HS02... đến hết danh sách.
- Họ và tên: Viết hoa chữ cái đầu mỗi từ (VD: Nguyễn Văn An).
- Giới tính: Chỉ ghi "Nam" hoặc "Nữ". (Nếu nguồn không ghi rõ, hãy tự suy luận hợp lý theo tên tiếng Việt).
- Ngày sinh: Định dạng DD/MM/YYYY (nếu có, không có để trống).
- Tổ: Chỉ ghi số 1, 2, 3 hoặc 4 (Nếu nguồn chưa chia tổ, tự chia đều luân phiên vào 4 tổ 1, 2, 3, 4).
- Chức vụ: Ghi mã viết tắt chuẩn:
  + LT (Lớp trưởng)
  + BT (Bí thư)
  + LP_HT (Lớp phó học tập)
  + LP_LD (Lớp phó lao động)
  + TT (Tổ trưởng)
  + HS (Học sinh - mặc định nếu không giữ chức vụ)
- Dãy bàn: Số từ 1 đến 4 (mặc định bằng số Tổ).
- Số bàn: Số bàn từ 1 đến 6 (tính từ trên bục giảng xuống).
- Các cột môn tính điểm (Toán -> GDQP-AN): Ghi điểm trung bình môn hệ 10 (VD: 8.5). Nếu chưa có điểm thì để trống.
- Các cột môn nhận xét (GDTC, HĐTN-HN): Ghi "Đ" (Đạt) hoặc "CĐ" (Chưa đạt). Nếu chưa có thì để trống.

2. BẢNG NHẬT KÝ NỀ NẾP - VI PHẠM & ĐIỂM CỘNG (Chỉ tạo nếu trong tài liệu của tôi có dữ liệu vi phạm/điểm cộng - xuất ra Sheet 2 hoặc bảng riêng bên dưới):
Các cột theo đúng thứ tự:
Ngày học | Buổi | Tuần | Mã hoặc Họ tên HS | Tổ | Nhóm hành vi | Nội dung hành vi | Loại điểm | Số điểm | Ghi chú
- Ngày học: YYYY-MM-DD (VD: 2026-11-09)
- Buổi: "Sáng" hoặc "Chiều"
- Loại điểm: "Trừ" (vi phạm) hoặc "Cộng" (tuyên dương)
- Số điểm: Số nguyên dương (VD: 2, 5, 10)

YÊU CẦU QUAN TRỌNG: Chỉ xuất ra bảng dữ liệu sạch để tôi copy hoặc tải về 1 file Excel (.xlsx) thả thẳng vào phần mềm, không giải thích dài dòng.`;

/**
 * Chuyển đổi mảng vaiTro sang chuỗi mã chức vụ hiển thị trong Excel
 */
export function formatRolesForExcel(vaiTro: RoleCode[]): string {
  const nonHs = (vaiTro || []).filter(r => r !== 'HS' && r !== 'GV');
  if (nonHs.length === 0) return 'HS';
  return nonHs.join(', ');
}

/**
 * Tải xuống File Excel Mẫu Chuẩn 1 File Đầy Đủ (.xlsx)
 * Gồm 2 Sheet trong cùng 1 file:
 * - Sheet 1: 1_DanhSach_Chongoi_Diem (Danh sách HS + Tổ + Chức vụ + Chỗ ngồi + Điểm các môn)
 * - Sheet 2: 2_NhatKy_NeNep (Ghi nhận vi phạm / điểm cộng nề nếp)
 */
export function downloadUnifiedExcelTemplate(): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Danh sách + Chỗ ngồi + Điểm môn học
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

  const sheet1SampleRows = [
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
    [
      3, 'HS03', 'Lê Hoàng Gia Bảo', 'Nam', '10/05/2011', 2, 'TT', 2, 1, '0903456789',
      8.4, 7.8, 8.2, 8.6, 8.4, 8.0, 7.9, 8.1, 8.5, 8.8, 8.3, 8.5, 'Đ', 'Đ',
      'Tổ trưởng Tổ 2 trách nhiệm, tích cực',
    ],
    [
      4, 'HS04', 'Phạm Phương Thảo', 'Nữ', '04/11/2011', 3, 'BT', 3, 1, '0904567890',
      8.5, 8.9, 8.7, 8.0, 8.1, 8.4, 8.8, 8.6, 9.0, 8.4, 8.5, 8.9, 'Đ', 'Đ',
      'Bí thư chi đoàn năng động, sáng tạo',
    ],
    [
      5, 'HS05', 'Vũ Đức Anh', 'Nam', '19/01/2011', 4, 'HS', 4, 1, '0905678901',
      7.5, 7.2, 7.6, 7.8, 7.4, 7.5, 7.3, 7.6, 8.0, 8.2, 7.7, 8.0, 'Đ', 'Đ',
      'Chăm ngoan, cần phát biểu sôi nổi hơn',
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
  const sheet2SampleRows = [
    [todayStr, 'Sáng', 10, 'Nguyễn Minh Khôi', 1, 'Học tập', 'Phát biểu xây dựng bài sôi nổi', 'Cộng', 5, 'Tiết Toán'],
    [todayStr, 'Sáng', 10, 'Vũ Đức Anh', 4, 'Chuyên cần', 'Đi học muộn dưới 5 phút', 'Trừ', 2, 'Muộn giờ truy bài'],
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

  // Sheet 3: Hướng dẫn nhanh ngay trong file Excel
  const sheet3Guide = [
    ['HƯỚNG DẪN NHẬP DỮ LIỆU 1 FILE DUY NHẤT - LỚP 10A5'],
    [''],
    ['Nguyên tắc vàng: Thầy chỉ cần điền vào file Excel này rồi kéo thả vào phần mềm. Hệ thống tự động nhận diện đồng thời:'],
    ['1. Sheet "1_DanhSach_Chongoi_Diem": Chứa Danh sách học sinh, Tổ, Chức vụ, Vị trí bàn ngồi và Điểm các môn học.'],
    ['   - Bắt buộc duy nhất cột "Họ và tên". Các cột Mã HS, Giới tính, Tổ, Dãy bàn, Số bàn nếu để trống hệ thống sẽ tự động điền và xếp chỗ ngồi thông minh.'],
    ['   - Cột "Chức vụ": Điền LT (Lớp trưởng), BT (Bí thư), LP_HT (Lớp phó học tập), LP_LD (Lớp phó lao động), TT (Tổ trưởng), hoặc HS (Học sinh).'],
    ['   - Các cột môn học (Toán -> GDQP-AN): Điền điểm TB môn (VD: 8.5). Môn GDTC và HĐTN-HN điền Đ hoặc CĐ. Nếu chưa có điểm có thể để trống.'],
    ['2. Sheet "2_NhatKy_NeNep": Chứa các lượt ghi nhận vi phạm hoặc điểm cộng (Tùy chọn - nếu không có có thể xóa các dòng mẫu).'],
    ['   - Cột "Mã hoặc Họ tên HS": Ghi Mã HS (VD: HS01) hoặc Họ và tên học sinh đều được hệ thống tự khớp chính xác.'],
    ['   - Cột "Loại điểm": Ghi "Trừ" hoặc "Cộng". Cột "Số điểm": Ghi số nguyên dương (VD: 2, 5).'],
  ];
  const ws3 = XLSX.utils.aoa_to_sheet(sheet3Guide);
  ws3['!cols'] = [{ wch: 110 }];
  XLSX.utils.book_append_sheet(wb, ws3, '3_HuongDan');

  XLSX.writeFile(wb, 'File_Mau_Nhap_Du_Lieu_10A5_1File.xlsx');
}

/**
 * Xuất toàn bộ dữ liệu thực tế hiện tại của lớp ra 1 File Excel (.xlsx) chuẩn
 * File xuất ra có thể chỉnh sửa và nạp ngược lại 100% vào hệ thống
 */
export function exportCurrentClassToUnifiedExcel(
  students: Student[],
  _layout: SeatLayoutNode[],
  records: DisciplineRecord[],
  academicRecords: StudentAcademicRecord[]
): void {
  const wb = XLSX.utils.book_new();

  // Map academic records by maHS and normalized name
  const gradeByMa = new Map<string, StudentAcademicRecord>();
  const gradeByName = new Map<string, StudentAcademicRecord>();
  (academicRecords || []).forEach(ar => {
    gradeByMa.set(ar.maHS.toUpperCase(), ar);
    gradeByName.set(ar.hoTen.trim().toLowerCase(), ar);
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

  const sheet1Rows = students.map((s, idx) => {
    const ar = gradeByMa.get(s.maHS.toUpperCase()) || gradeByName.get(s.hoTen.trim().toLowerCase());
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

  // Sheet 2: Nhật ký nề nếp
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

  const activeRecords = (records || []).filter(r => r.trangThai !== 'DaHuy');
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

  const dateTag = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `Du_Lieu_Lop_10A5_Day_Du_${dateTag}.xlsx`);
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
        Thay vì phải tách rời nhiều file hay qua nhiều bước phức tạp, hệ thống được thiết kế để <b>chỉ cần thả 1 file Excel (.xlsx) duy nhất</b> (hoặc dán 1 bảng duy nhất từ AI) vào mục <b>Nhập / Xuất</b>. Hệ thống sẽ tự động đọc và cập nhật đồng thời:<br/>
        1. <b>Danh sách học sinh</b> (Mã HS, Họ và tên, Giới tính, Ngày sinh, SĐT Phụ huynh)<br/>
        2. <b>Phân tổ &amp; Ban cán sự</b> (Tổ 1–4, Lớp trưởng, Bí thư, Lớp phó, Tổ trưởng)<br/>
        3. <b>Sơ đồ chỗ ngồi</b> (Dãy bàn, Số bàn — hoặc tự động xếp chỗ ngồi theo Tổ nếu bỏ trống)<br/>
        4. <b>Bảng điểm tất cả các môn học</b> (Tự động tính ĐTB chung và xếp loại Học lực)<br/>
        5. <b>Nhật ký Nề nếp / Vi phạm / Điểm cộng</b> (Nếu có Sheet 2 hoặc bảng nề nếp đính kèm)
      </div>

      <h2>I. QUY TRÌNH 3 BƯỚC NHẬP DỮ LIỆU NHANH NHẤT</h2>
      <ol>
        <li><b>Bước 1:</b> Nhấn nút <b>"Tải File Excel Mẫu (1 File Đầy Đủ)"</b> ngay trên màn hình Nhập / Xuất của giáo viên.</li>
        <li><b>Bước 2:</b> Mở file Excel mẫu, điền hoặc dán danh sách học sinh, tổ, chức vụ, điểm các môn vào <b>Sheet 1 (1_DanhSach_Chongoi_Diem)</b> và dữ liệu vi phạm/điểm cộng (nếu có) vào <b>Sheet 2 (2_NhatKy_NeNep)</b>.</li>
        <li><b>Bước 3:</b> Kéo thả file Excel vừa lưu vào ô <b>"Thả 1 File Duy Nhất Vào Đây"</b> và bấm nút <b>"Áp Dụng Ngay Vào Hệ Thống"</b>. Toàn bộ dữ liệu sẽ được cập nhật và đồng bộ tức thì lên Đám mây (Firebase)!</li>
      </ol>

      <h2>II. QUY TẮC CÁC CỘT TRONG FILE EXCEL CHUẨN (1 FILE ĐẦY ĐỦ)</h2>

      <h3>1. Sheet 1: "1_DanhSach_Chongoi_Diem" (Danh sách + Chỗ ngồi + Điểm môn học)</h3>
      <p>Chỉ cần cột <b>Họ và tên</b> là bắt buộc. Tất cả các cột khác nếu để trống hệ thống sẽ tự động gán mặc định thông minh:</p>

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
            <td><b>STT</b></td>
            <td>Tùy chọn</td>
            <td>Số thứ tự 1, 2, 3...</td>
          </tr>
          <tr>
            <td><b>Mã HS</b></td>
            <td>Tự động</td>
            <td>VD: <b>HS01, HS02...</b> (Nếu bỏ trống, hệ thống tự động đánh mã theo thứ tự).</td>
          </tr>
          <tr>
            <td><b>Họ và tên</b></td>
            <td><b>BẮT BUỘC</b></td>
            <td>Họ và tên đầy đủ của học sinh (VD: <i>Nguyễn Minh Khôi</i>).</td>
          </tr>
          <tr>
            <td><b>Giới tính</b></td>
            <td>Tự động</td>
            <td>Ghi <b>Nam</b> hoặc <b>Nữ</b> (Nếu bỏ trống, hệ thống tự nhận diện qua tên).</td>
          </tr>
          <tr>
            <td><b>Ngày sinh</b></td>
            <td>Tùy chọn</td>
            <td>Định dạng DD/MM/YYYY (VD: <i>15/03/2011</i>).</td>
          </tr>
          <tr>
            <td><b>Tổ</b></td>
            <td>Tự động</td>
            <td>Ghi số <b>1, 2, 3</b> hoặc <b>4</b> (Nếu bỏ trống, hệ thống tự chia đều vào 4 tổ).</td>
          </tr>
          <tr>
            <td><b>Chức vụ</b></td>
            <td>Tùy chọn</td>
            <td>
              Ghi mã viết tắt hoặc tên chức vụ đều được:<br/>
              - <b>LT</b> (hoặc <i>Lớp trưởng</i>)<br/>
              - <b>BT</b> (hoặc <i>Bí thư</i>)<br/>
              - <b>LP_HT</b> (hoặc <i>Lớp phó học tập</i>)<br/>
              - <b>LP_LD</b> (hoặc <i>Lớp phó lao động</i>)<br/>
              - <b>TT</b> (hoặc <i>Tổ trưởng</i>)<br/>
              - <b>HS</b> (hoặc để trống: Học sinh)
            </td>
          </tr>
          <tr>
            <td><b>Dãy bàn, Số bàn</b></td>
            <td>Tự động</td>
            <td>Dãy bàn (1–4), Số bàn (1–6). Nếu để trống, hệ thống tự động xếp sơ đồ lớp 4 dãy bàn theo đúng Tổ của học sinh.</td>
          </tr>
          <tr>
            <td><b>Các cột môn tính điểm</b></td>
            <td>Tùy chọn</td>
            <td><b>Toán, Ngữ văn, Tiếng Anh, Vật lí, Hóa học, Sinh học, Lịch sử, Địa lí, GDKT&amp;PL, Tin học, Công nghệ, GDQP-AN</b>: Điền điểm trung bình môn hệ số 10 (VD: <i>8.5</i>). Hỗ trợ cả file điểm xuất từ vnEdu/SMAS có cột TX1, TX2, GK, CK, ĐTB.</td>
          </tr>
          <tr>
            <td><b>Các môn nhận xét</b></td>
            <td>Tùy chọn</td>
            <td><b>GDTC, HĐTN-HN</b>: Điền <b>Đ</b> (Đạt) hoặc <b>CĐ</b> (Chưa đạt).</td>
          </tr>
          <tr>
            <td><b>Nhận xét GVCN</b></td>
            <td>Tùy chọn</td>
            <td>Lời phê hoặc ghi chú học tập của giáo viên chủ nhiệm.</td>
          </tr>
        </tbody>
      </table>

      <h3>2. Sheet 2: "2_NhatKy_NeNep" (Ghi nhận Vi phạm &amp; Điểm cộng - Tùy chọn)</h3>
      <p>Nếu thầy muốn nạp luôn danh sách vi phạm hoặc điểm cộng trong cùng 1 file Excel, điền vào Sheet 2 với các cột:</p>
      <table>
        <thead>
          <tr>
            <th>Ngày học</th>
            <th>Buổi</th>
            <th>Tuần</th>
            <th>Mã hoặc Họ tên HS</th>
            <th>Tổ</th>
            <th>Nhóm hành vi</th>
            <th>Nội dung hành vi</th>
            <th>Loại điểm</th>
            <th>Số điểm</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>2026-11-09</td>
            <td>Sáng</td>
            <td>10</td>
            <td>Nguyễn Minh Khôi</td>
            <td>1</td>
            <td>Học tập</td>
            <td>Phát biểu sôi nổi</td>
            <td>Cộng</td>
            <td>5</td>
          </tr>
          <tr>
            <td>2026-11-09</td>
            <td>Sáng</td>
            <td>10</td>
            <td>Vũ Đức Anh</td>
            <td>4</td>
            <td>Chuyên cần</td>
            <td>Đi học muộn</td>
            <td>Trừ</td>
            <td>2</td>
          </tr>
        </tbody>
      </table>

      <h2>III. CÂU LỆNH (PROMPT) MẪU DÀNH CHO AI (CHATGPT / GEMINI)</h2>
      <p>Nếu thầy có sẵn ảnh chụp danh sách lớp, ảnh chụp sơ đồ bàn học hoặc file Word/PDF thô, hãy copy câu lệnh dưới đây gửi kèm hình ảnh cho AI (ChatGPT, Gemini...) để AI xuất ra đúng 1 bảng chuẩn duy nhất:</p>
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
