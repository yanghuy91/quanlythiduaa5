/**
 * Hướng dẫn Prompt chuẩn cho AI (ChatGPT / Gemini / Claude)
 * để trích xuất sơ đồ lớp học thành dữ liệu 3 cột chuẩn xác,
 * tuyệt đối không bị ngược vị trí Bàn GV và Cửa chính.
 */
export const AI_SEATING_PROMPT_GUIDE = `Đóng vai chuyên gia trích xuất dữ liệu học đường. Tôi đang cung cấp ảnh chụp/tài liệu/bảng vẽ SƠ ĐỒ CHỖ NGỒI LỚP HỌC 10A5.
Hãy đọc kỹ sơ đồ và xuất ra bảng dữ liệu chuẩn gồm ĐÚNG 3 CỘT:

| STT | Họ và tên | Vị trí |

===============================
QUY TẮC BẮT BUỘC ĐỂ TRÁNH BỊ NGƯỢC HƯỚNG PHÒNG HỌC:
===============================
1. HƯỚNG NHÌN CHUẨN:
   - Luôn xác định theo hướng: ĐỨNG TỪ CUỐI LỚP NHÌN LÊN BẢNG (hướng ngồi của học sinh).
   - Phía BÊN TRÁI phòng học là BÀN GIÁO VIÊN.
   - Phía BÊN PHẢI phòng học là CỬA CHÍNH RA VÀO.
   - Ở GIỮA là BẢNG LỚP.

2. QUY ƯỚC 4 TỔ (4 DÃY BÀN TỪ PHẢI SANG TRÁI):
   - TỔ 1 (Dãy 1): Dãy ngoài cùng BÊN PHẢI (giáp CỬA CHÍNH ra vào).
   - TỔ 2 (Dãy 2): Dãy giữa bên phải.
   - TỔ 3 (Dãy 3): Dãy giữa bên trái.
   - TỔ 4 (Dãy 4): Dãy ngoài cùng BÊN TRÁI (giáp BÀN GIÁO VIÊN).
   (LƯU Ý QUAN TRỌNG: Nếu sơ đồ gốc của bạn đang vẽ nhìn từ bục giảng xuống hoặc vẽ ngược, hãy tự động đối chiếu theo chuẩn mốc thực tế: Dãy sát Cửa chính là Tổ 1, dãy sát Bàn GV là Tổ 4).

3. QUY ƯỚC SỐ BÀN (HÀNG 1 ĐẾN 6):
   - Bàn 1: Bàn đầu tiên ngay sát Bảng / Bục giảng.
   - Bàn 2: Bàn thứ hai.
   - Bàn 3: Bàn thứ ba.
   - Bàn 4: Bàn thứ tư.
   - Bàn 5: Bàn thứ năm.
   - Bàn 6: Bàn cuối cùng ở cuối lớp.

4. QUY ƯỚC GHẾ TRONG MỖI BÀN (Mỗi bàn tối đa 2 học sinh):
   - Trái: Ghế nằm bên trái của bàn đó (hướng nhìn lên bảng).
   - Phải: Ghế nằm bên phải của bàn đó (hướng nhìn lên bảng).

5. ĐỊNH DẠNG CỘT "Vị trí":
   Ghi rõ dạng: "Tổ X - Bàn Y - Trái" hoặc "Tổ X - Bàn Y - Phải" (hoặc viết tắt T1-B1-T, T1-B1-P).

===============================
VÍ DỤ ĐẦU RA MẪU:
===============================
| STT | Họ và tên | Vị trí |
| 1 | Phạm Xuân An | Tổ 2 - Bàn 1 - Phải |
| 2 | Nguyễn Hà Hoàng Anh | Tổ 3 - Bàn 1 - Phải |
| 3 | Quách Gia Bảo | Tổ 1 - Bàn 1 - Trái |
| 4 | Nguyễn Ngọc Minh Châu | Tổ 4 - Bàn 1 - Phải |
...
(Chỉ trả về bảng dữ liệu Markdown gồm 3 cột như trên, không cần giải thích thêm)
`;

export interface ParsedStandardSeatItem {
  stt: number;
  hoTen: string;
  to: 1 | 2 | 3 | 4;
  ban: number; // 1..6
  ghe: 'Trai' | 'Phai';
  hang: number; // 1..6
  cot: number; // 0,1 hoặc 3,4 hoặc 6,7 hoặc 9,10
  rawPosition: string;
  isValid: boolean;
  error?: string;
}

/**
 * Phân tích chuỗi vị trí (VD: "Tổ 1 - Bàn 2 - Trái", "T2-B3-P", "Dãy 4 Bàn 1 Ghế phải")
 * thành cấu trúc to (1..4), ban (1..6), ghe ('Trai'|'Phai'), hang, cot
 */
export function parseSeatPositionString(raw: string): {
  to?: 1 | 2 | 3 | 4;
  ban?: number;
  ghe?: 'Trai' | 'Phai';
  hang?: number;
  cot?: number;
  error?: string;
} {
  if (!raw) return { error: 'Thiếu thông tin vị trí' };
  const str = raw.trim().toLowerCase();

  // 1. Tìm Tổ / Dãy (1..4)
  let to: 1 | 2 | 3 | 4 | undefined = undefined;
  const toMatch = str.match(/(?:tổ|dãy|t|d)\s*([1-4])/i);
  if (toMatch) {
    to = Number(toMatch[1]) as 1 | 2 | 3 | 4;
  }

  // 2. Tìm Bàn / Hàng (1..6)
  let ban: number | undefined = undefined;
  const banMatch = str.match(/(?:bàn|hàng|b|h)\s*([1-6])/i);
  if (banMatch) {
    ban = Number(banMatch[1]);
  }

  // 3. Tìm Ghế Trái / Phải
  let ghe: 'Trai' | 'Phai' | undefined = undefined;
  if (/(\btrái\b|\bt\b|\btrong\b|\bghế\s*1\b|\bg1\b)/i.test(str)) {
    ghe = 'Trai';
  } else if (/(\bphải\b|\bp\b|\bngoài\b|\bghế\s*2\b|\bg2\b)/i.test(str)) {
    ghe = 'Phai';
  }

  if (!to) return { error: 'Không xác định được Tổ/Dãy (1..4)' };
  if (!ban || ban < 1 || ban > 6) return { error: 'Không xác định được Bàn (1..6)' };
  if (!ghe) return { error: 'Không xác định được Ghế (Trái/Phải)' };

  // Quy chiếu sang cột vật lý (Sơ đồ 10A5 chuẩn):
  // Tổ 4 (sát Bàn GV - bên trái): Cột 0 (Trái), Cột 1 (Phải)
  // Tổ 3: Cột 3 (Trái), Cột 4 (Phải)
  // Tổ 2: Cột 6 (Trái), Cột 7 (Phải)
  // Tổ 1 (sát Cửa chính - bên phải): Cột 9 (Trái), Cột 10 (Phải)
  let cot = 0;
  if (to === 4) {
    cot = ghe === 'Trai' ? 0 : 1;
  } else if (to === 3) {
    cot = ghe === 'Trai' ? 3 : 4;
  } else if (to === 2) {
    cot = ghe === 'Trai' ? 6 : 7;
  } else if (to === 1) {
    cot = ghe === 'Trai' ? 9 : 10;
  }

  return {
    to,
    ban,
    ghe,
    hang: ban,
    cot,
  };
}

/**
 * Phân tích toàn bộ văn bản nhập (từ AI / Excel / Word / Text) thành danh sách học sinh chuẩn
 */
export function parseStandardSeatingInput(inputText: string): {
  items: ParsedStandardSeatItem[];
  duplicateSeats: string[];
  invalidLines: string[];
  totalValid: number;
} {
  const lines = inputText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const items: ParsedStandardSeatItem[] = [];
  const invalidLines: string[] = [];
  const seatOccupancyMap = new Map<string, number>(); // 'hang-cot' -> count
  const duplicateSeats: string[] = [];

  let autoStt = 1;

  for (const line of lines) {
    // Bỏ qua dòng tiêu đề hoặc dòng kẻ markdown
    if (/^\|?\s*stt\s*\|/i.test(line) || /^\|?[-:\s|]+$/i.test(line) || /^#\s+/i.test(line)) {
      continue;
    }

    let rawStt: number | undefined;
    let hoTen = '';
    let rawPos = '';

    // Trường hợp 1: Dạng bảng Markdown (ngăn cách bởi dấu |)
    if (line.includes('|')) {
      const parts = line
        .split('|')
        .map(p => p.trim())
        .filter(p => p.length > 0);
      if (parts.length >= 3) {
        rawStt = parseInt(parts[0], 10);
        hoTen = parts[1];
        rawPos = parts[2];
      } else if (parts.length === 2) {
        hoTen = parts[0];
        rawPos = parts[1];
      }
    }
    // Trường hợp 2: Dạng Tab (copy từ Excel)
    else if (line.includes('\t')) {
      const parts = line.split('\t').map(p => p.trim()).filter(p => p.length > 0);
      if (parts.length >= 3) {
        rawStt = parseInt(parts[0], 10);
        hoTen = parts[1];
        rawPos = parts[2];
      } else if (parts.length === 2) {
        hoTen = parts[0];
        rawPos = parts[1];
      }
    }
    // Trường hợp 3: Dạng dấu phẩy hoặc gạch ngang (CSV hoặc text tự do)
    else if (line.includes(',') || line.includes(';')) {
      const parts = line.split(/[,;]/).map(p => p.trim()).filter(p => p.length > 0);
      if (parts.length >= 3) {
        rawStt = parseInt(parts[0], 10);
        hoTen = parts[1];
        rawPos = parts.slice(2).join(' ');
      } else if (parts.length === 2) {
        hoTen = parts[0];
        rawPos = parts[1];
      }
    }
    // Trường hợp 4: Text tự do dạng: "1. Nguyễn Văn A - Tổ 1 Bàn 1 Trái"
    else {
      const listMatch = line.match(/^(\d+)[\.\-\)]\s*([^-–]+)[-–]\s*(.+)$/);
      if (listMatch) {
        rawStt = parseInt(listMatch[1], 10);
        hoTen = listMatch[2].trim();
        rawPos = listMatch[3].trim();
      } else {
        const simpleMatch = line.match(/^([^-–]+)[-–]\s*(.+)$/);
        if (simpleMatch) {
          hoTen = simpleMatch[1].trim();
          rawPos = simpleMatch[2].trim();
        }
      }
    }

    // Làm sạch họ tên
    hoTen = hoTen.replace(/^(\d+[\.\-\)]\s*)/, '').trim();

    if (!hoTen || !rawPos) {
      invalidLines.push(line);
      continue;
    }

    const posParsed = parseSeatPositionString(rawPos);
    const stt = !isNaN(Number(rawStt)) && Number(rawStt) > 0 ? Number(rawStt) : autoStt;
    autoStt++;

    if (posParsed.error || !posParsed.to || !posParsed.ban || !posParsed.ghe || posParsed.cot === undefined) {
      invalidLines.push(`${hoTen} (${rawPos}): ${posParsed.error || 'Sai định dạng vị trí'}`);
      continue;
    }

    const seatKey = `H${posParsed.hang}_C${posParsed.cot}`;
    const occ = (seatOccupancyMap.get(seatKey) || 0) + 1;
    seatOccupancyMap.set(seatKey, occ);
    if (occ === 2) {
      duplicateSeats.push(`Tổ ${posParsed.to} - Bàn ${posParsed.ban} - Ghế ${posParsed.ghe === 'Trai' ? 'Trái' : 'Phải'}`);
    }

    items.push({
      stt,
      hoTen,
      to: posParsed.to,
      ban: posParsed.ban,
      ghe: posParsed.ghe,
      hang: posParsed.hang!,
      cot: posParsed.cot,
      rawPosition: rawPos,
      isValid: true,
    });
  }

  return {
    items,
    duplicateSeats,
    invalidLines,
    totalValid: items.length,
  };
}

/**
 * Chuyển đổi danh sách học sinh trích xuất chuẩn thành Student[] và SeatLayoutNode[]
 * để áp dụng làm Sơ đồ Chuẩn của toàn bộ lớp học 10A5.
 */
export function convertParsedItemsToSeatingState(
  items: ParsedStandardSeatItem[],
  existingStudents: any[] = []
): {
  students: any[];
  layout: any[];
} {
  // 1. Tạo layout 77 ô chuẩn
  const layout: any[] = [
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

  for (let h = 1; h <= 6; h++) {
    // Dãy 4 (Tổ 4, sát bàn GV): Cột 0, 1
    layout.push({ hang: h, cot: 0, loaiO: 'trong' });
    layout.push({ hang: h, cot: 1, loaiO: 'trong' });
    layout.push({ hang: h, cot: 2, loaiO: 'loidi' });

    // Dãy 3 (Tổ 3): Cột 3, 4
    layout.push({ hang: h, cot: 3, loaiO: 'trong' });
    layout.push({ hang: h, cot: 4, loaiO: 'trong' });
    layout.push({ hang: h, cot: 5, loaiO: 'loidi' });

    // Dãy 2 (Tổ 2): Cột 6, 7
    layout.push({ hang: h, cot: 6, loaiO: 'trong' });
    layout.push({ hang: h, cot: 7, loaiO: 'trong' });
    layout.push({ hang: h, cot: 8, loaiO: 'loidi' });

    // Dãy 1 (Tổ 1, sát cửa chính): Cột 9, 10
    layout.push({ hang: h, cot: 9, loaiO: 'trong' });
    layout.push({ hang: h, cot: 10, loaiO: 'trong' });
  }

  // 2. Map existing students by normalized name để giữ lại thông tin cũ (vaiTro, avatarUrl, gioiTinh, v.v.)
  const existingMap = new Map<string, any>();
  for (const st of existingStudents) {
    if (st && st.hoTen) {
      const norm = st.hoTen.toLowerCase().replace(/\s+/g, ' ').trim();
      existingMap.set(norm, st);
    }
  }

  // 3. Tạo danh sách Student[]
  const students: any[] = [];
  const assignedSeatKeys = new Set<string>();

  items.forEach((item, index) => {
    const norm = item.hoTen.toLowerCase().replace(/\s+/g, ' ').trim();
    const existing = existingMap.get(norm);

    const sttNum = item.stt || (index + 1);
    const maHS = existing?.maHS || `HS${String(sttNum).padStart(2, '0')}`;
    
    // Tự sinh tên rút gọn
    const parts = item.hoTen.trim().split(/\s+/);
    const tenRutGon = parts.length > 1
      ? parts.slice(0, -1).map(p => p[0].toUpperCase() + '.').join('') + parts[parts.length - 1]
      : item.hoTen;

    const student: any = {
      maHS,
      hoTen: item.hoTen,
      tenRutGon,
      to: item.to,
      dayBan: item.to,
      soBan: item.ban,
      viTriGhe: sttNum,
      vaiTro: existing?.vaiTro || ['HS'],
      gioiTinh: existing?.gioiTinh || (parts[parts.length - 2]?.toLowerCase() === 'thị' ? 'Nu' : 'Nam'),
      avatarUrl: existing?.avatarUrl,
      customFrameId: existing?.customFrameId,
      ngaySinh: existing?.ngaySinh,
      soDienThoai: existing?.soDienThoai,
    };

    if (existing?.toTruongTo) {
      student.toTruongTo = item.to;
    }

    students.push(student);

    // Điền vào ghế trên layout
    const seatNode = layout.find(n => n.hang === item.hang && n.cot === item.cot);
    if (seatNode) {
      seatNode.loaiO = 'ghe';
      seatNode.maHS = maHS;
      assignedSeatKeys.add(`H${item.hang}_C${item.cot}`);
    }
  });

  return {
    students,
    layout,
  };
}
