import { Student, SeatLayoutNode, StudentAcademicRecord, DisciplineRecord, RoleCode } from '../types';

/**
 * Kiểm tra xem một bản ghi học sinh có phải là dòng dữ liệu mẫu mặc định trong file Excel mẫu cũ hay không
 * (Nguyễn Minh Khôi - 15/03/2011 - 0901234567, Trần Ngọc Bảo Trâm - 22/08/2011 - 0902345678).
 * Khi nạp danh sách lớp thật (> 2 học sinh), các dòng mẫu này sẽ tự động bị loại bỏ để không làm tăng sĩ số (VD: 48 -> 50).
 */
export function isTemplateSampleStudent(student?: Partial<Student> | null): boolean {
  if (!student) return false;
  const normName = normalizeStudentNameForMatch(student.hoTen);
  const dob = String(student.ngaySinh || '').trim();
  const phone = String(student.sdtPhuHuynh || '').trim();

  if (
    (normName === 'nguyen minh khoi' || normName === 'nguyễn minh khôi') &&
    (dob === '15/03/2011' || phone === '0901234567')
  ) {
    return true;
  }
  if (
    (normName === 'tran ngoc bao tram' || normName === 'trần ngọc bảo trâm') &&
    (dob === '22/08/2011' || phone === '0902345678')
  ) {
    return true;
  }
  return false;
}

/**
 * Kiểm tra tên học sinh hợp lệ — loại bỏ triệt để các ô tiêu đề, ghi chú, bàn giáo viên, cửa lớp, tổng cộng...
 * vô tình nằm trong bảng Excel khi nhập dữ liệu.
 */
export function isValidStudentName(rawName?: string | null): boolean {
  if (!rawName) return false;
  const cleaned = String(rawName)
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length < 2 || cleaned.length > 60) return false;
  if (/^\d+$/.test(cleaned)) return false;
  if (/^hs\d+$/i.test(cleaned)) return false;

  const lower = cleaned.toLowerCase().normalize('NFC');
  const exactBlocked = new Set([
    'trống',
    'trong',
    'chỗ trống',
    'cho trong',
    'ghế trống',
    'ghe trong',
    'bàn giáo viên',
    'ban giao vien',
    'bàn gv',
    'ban gv',
    'bàn gvcn',
    'giáo viên',
    'giao vien',
    'gvcn',
    'bục giảng',
    'buc giang',
    'bảng',
    'bang',
    'bảng lớp',
    'bảng đen',
    'cửa',
    'cửa vào',
    'cửa ra vào',
    'cửa chính',
    'cửa lớp',
    'cửa sau',
    'cửa sổ',
    'lối đi',
    'loi di',
    'hành lang',
    'cuối lớp',
    'đầu lớp',
    'họ và tên',
    'ho va ten',
    'họ tên',
    'ho ten',
    'tên học sinh',
    'học sinh',
    'stt',
    'mã hs',
    'mã học sinh',
    'giới tính',
    'ngày sinh',
    'tổng cộng',
    'tổng số',
    'trung bình',
    'sĩ số',
    'ghi chú',
    'nhận xét',
  ]);
  if (exactBlocked.has(lower)) return false;

  const blockedSubstrings = [
    'bàn giáo viên',
    'ban giao vien',
    'bàn gv',
    'ban gv',
    'bục giảng',
    'buc giang',
    'bảng lớp',
    'bảng 10',
    'cửa chính',
    'cửa vào',
    'cửa ra vào',
    'cửa lớp',
    'cửa sau',
    'lối đi',
    'cuối lớp',
    'khoảng trống',
    'họ và tên',
    'tên học sinh',
    'danh sách học sinh',
    'sơ đồ lớp',
    'bảng điểm',
    'hướng dẫn',
    'nguyên tắc',
    'tổng số học sinh',
    'giáo viên chủ nhiệm',
    'người lập bảng',
  ];
  if (blockedSubstrings.some(kw => lower.includes(kw))) return false;

  if (
    /^bàn\s*\d+/i.test(cleaned) ||
    /^dãy\s*\d+/i.test(cleaned) ||
    /^tổ\s*\d+/i.test(cleaned) ||
    /^ghế\s*(trái|phải|\d+)/i.test(cleaned) ||
    /^sĩ\s*số/i.test(cleaned) ||
    /^tổng\s*(số|cộng|hợp)/i.test(cleaned)
  ) {
    return false;
  }

  return true;
}

/**
 * Khởi tạo khung Sơ đồ lớp chuẩn:
 * Cố định 4 Dãy bàn (4 Tổ) x 6 Bàn (Hàng 1..6) = tối đa 48 vị trí ghế.
 * Tuyệt đối không tạo ghế ở hàng 7 (vì hàng 7 là vạch "— CUỐI LỚP —" trên giao diện).
 */
export function generateDefaultLayoutForStudents(studentsList: Student[] = []): SeatLayoutNode[] {
  const validList = (studentsList || []).filter(s => s && isValidStudentName(s.hoTen));

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

  // Khởi tạo 6 bàn mỗi dãy (4 dãy x 6 bàn x 2 ghế = 48 ghế chuẩn)
  for (let h = 1; h <= 6; h++) {
    // Dãy 4 (Tổ 4): cột 0, 1
    layoutNodes.push({ hang: h, cot: 0, loaiO: 'ghe' });
    layoutNodes.push({ hang: h, cot: 1, loaiO: 'ghe' });
    layoutNodes.push({ hang: h, cot: 2, loaiO: 'loidi' });

    // Dãy 3 (Tổ 3): cột 3, 4
    layoutNodes.push({ hang: h, cot: 3, loaiO: 'ghe' });
    layoutNodes.push({ hang: h, cot: 4, loaiO: 'ghe' });
    layoutNodes.push({ hang: h, cot: 5, loaiO: 'loidi' });

    // Dãy 2 (Tổ 2): cột 6, 7
    layoutNodes.push({ hang: h, cot: 6, loaiO: 'ghe' });
    layoutNodes.push({ hang: h, cot: 7, loaiO: 'ghe' });
    layoutNodes.push({ hang: h, cot: 8, loaiO: 'loidi' });

    // Dãy 1 (Tổ 1): cột 9, 10
    layoutNodes.push({ hang: h, cot: 9, loaiO: 'ghe' });
    layoutNodes.push({ hang: h, cot: 10, loaiO: 'ghe' });
  }

  // Xếp tối đa 48 học sinh vào đúng Tổ (mỗi Tổ tối đa 12 ghế), nếu Tổ nào vượt 12 thì xếp sang ghế trống còn lại trong 48 ghế
  const overflowStudents: Student[] = [];
  for (const g of [1, 2, 3, 4] as const) {
    const groupStudents = validList.filter(s => (s.dayBan || s.to || 1) === g);
    const [colLeft, colRight] = getSeatColsForGroup(g);
    const groupSeats = layoutNodes.filter(
      n => n.loaiO === 'ghe' && (n.cot === colLeft || n.cot === colRight)
    );
    groupStudents.forEach((stu, idx) => {
      if (idx < groupSeats.length) {
        groupSeats[idx].maHS = stu.maHS;
      } else {
        overflowStudents.push(stu);
      }
    });
  }

  for (const stu of overflowStudents) {
    const emptySeat = layoutNodes.find(n => n.loaiO === 'ghe' && !n.maHS);
    if (emptySeat) {
      emptySeat.maHS = stu.maHS;
    }
  }

  return layoutNodes;
}

/**
 * Chuẩn hóa tên học sinh (Unicode NFC, chữ thường, bỏ khoảng trắng thừa và ký tự đặc biệt)
 * để đối chiếu chính xác giữa Sơ đồ lớp và các danh sách khác.
 */
export function normalizeStudentNameForMatch(name?: string | null): string {
  if (!name) return '';
  return String(name)
    .normalize('NFC')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ') // bỏ ghi chú trong ngoặc đơn (VD: "(Lớp trưởng)")
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Chuẩn hóa tên không dấu để dự phòng khi file nhập bị lỗi font/thiếu dấu nhẹ.
 */
export function normalizeAccentInsensitiveName(name?: string | null): string {
  const nfc = normalizeStudentNameForMatch(name);
  return nfc
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tạo tên rút gọn (VD: "Nguyễn Văn An" -> "N.V.An")
 */
export function makeShortStudentName(fullName: string): string {
  const parts = String(fullName || '').trim().split(/\s+/);
  if (parts.length <= 1) return String(fullName || '').trim();
  return parts.map((w, i) => (i < parts.length - 1 ? `${w[0]?.toUpperCase() || ''}.` : w)).join('');
}

/**
 * Quy đổi cột ghế trên Sơ đồ lớp (cot: 0..10) sang Tổ / Dãy bàn (1..4).
 * Dãy 1 (Tổ 1): cột 9, 10 (phía cửa lớp)
 * Dãy 2 (Tổ 2): cột 6, 7
 * Dãy 3 (Tổ 3): cột 3, 4
 * Dãy 4 (Tổ 4): cột 0, 1
 */
export function getGroupFromSeatCol(cot: number): 1 | 2 | 3 | 4 {
  if (cot >= 9) return 1;
  if (cot >= 6) return 2;
  if (cot >= 3) return 3;
  return 4;
}

/**
 * Quy đổi Tổ / Dãy bàn (1..4) sang cặp cột [ghế trái, ghế phải] trên Sơ đồ lớp.
 */
export function getSeatColsForGroup(to: number): [number, number] {
  if (to === 1) return [9, 10];
  if (to === 2) return [6, 7];
  if (to === 3) return [3, 4];
  return [0, 1];
}

const VALID_SEAT_COLS = new Set([0, 1, 3, 4, 6, 7, 9, 10]);

function isPhysicalDeskSeatNode(node: SeatLayoutNode): boolean {
  return (
    node.hang >= 1 &&
    node.hang <= 6 &&
    VALID_SEAT_COLS.has(node.cot) &&
    (node.loaiO === 'ghe' || node.loaiO === 'trong')
  );
}

/**
 * Tìm học sinh trong danh sách chuẩn Sơ đồ lớp (`masterStudents`) bằng Mã HS hoặc Họ tên.
 * Ưu tiên khớp theo Họ và tên chuẩn hóa trước (vì các file ngoài như vnEdu/Excel thường có STT/Mã HS khác
 * hoặc tự đánh số HS01..HS48 theo thứ tự ABC thay vì thứ tự Sơ đồ lớp).
 */
export function findStudentInSeatingMaster(
  masterStudents: Student[],
  maHS?: string | null,
  hoTen?: string | null
): Student | undefined {
  if (!masterStudents || masterStudents.length === 0) return undefined;

  const cleanId = maHS ? String(maHS).trim().toUpperCase() : '';
  const normName = normalizeStudentNameForMatch(hoTen);
  const asciiName = normalizeAccentInsensitiveName(hoTen);
  const hasRealName = Boolean(normName && normName !== cleanId.toLowerCase() && !/^hs\d+$/i.test(normName));

  // 1. Nếu có Họ và tên thực: BẮT BUỘC đối chiếu theo Họ và tên với Sơ đồ lớp
  // Tuyệt đối không lấy Mã HS (HS01..HS48) của người khác đè sang nếu tên khác nhau
  if (hasRealName) {
    const exactByName = masterStudents.filter(s => normalizeStudentNameForMatch(s.hoTen) === normName);
    if (exactByName.length === 1) return exactByName[0];
    if (exactByName.length > 1 && cleanId) {
      const exactBoth = exactByName.find(s => s.maHS.trim().toUpperCase() === cleanId);
      if (exactBoth) return exactBoth;
      return exactByName[0];
    }

    // 2. Đối chiếu tên không dấu (nếu duy nhất)
    const accentMatches = masterStudents.filter(s => normalizeAccentInsensitiveName(s.hoTen) === asciiName);
    if (accentMatches.length === 1) return accentMatches[0];
    if (accentMatches.length > 1 && cleanId) {
      const accentBoth = accentMatches.find(s => s.maHS.trim().toUpperCase() === cleanId);
      if (accentBoth) return accentBoth;
      return accentMatches[0];
    }

    // 3. Nếu truyền cả chuỗi "HS01 - Nguyễn Văn A" vào hoTen
    if (normName.length >= 4) {
      const partialMatch = masterStudents.filter(s => {
        const sNorm = normalizeStudentNameForMatch(s.hoTen);
        return sNorm === normName || (sNorm.length >= 5 && normName.includes(sNorm));
      });
      if (partialMatch.length === 1) return partialMatch[0];
    }

    // Có tên cụ thể nhưng không khớp học sinh nào trong lớp -> trả về undefined,
    // KHÔNG khớp mù theo Mã HS để tránh gán nhầm lỗi/điểm của HS này sang HS khác có cùng mã thứ tự HSxx
    return undefined;
  }

  // 4. Chỉ đối chiếu theo Mã HS khi bản ghi không có Họ tên (hoặc chỉ lưu mỗi Mã HS)
  if (cleanId) {
    const byId = masterStudents.find(s => s.maHS.trim().toUpperCase() === cleanId);
    if (byId) return byId;
  }

  // 5. Dự phòng: Nếu raw input truyền cả chuỗi "HS01 - Nguyễn Văn A" vào maHS
  const combinedNorm = normalizeStudentNameForMatch(maHS);
  if (combinedNorm && combinedNorm.length >= 4) {
    const partialMatch = masterStudents.filter(s => {
      const sNorm = normalizeStudentNameForMatch(s.hoTen);
      return sNorm === combinedNorm || (sNorm.length >= 5 && combinedNorm.includes(sNorm));
    });
    if (partialMatch.length === 1) return partialMatch[0];
  }

  return undefined;
}

/**
 * ĐỒNG BỘ LẤY SƠ ĐỒ LỚP LÀM CHUẨN GỐC DUY NHẤT (`layout` + `students`):
 * - Khung Sơ đồ lớp chuẩn có 4 Dãy bàn (4 Tổ) x 6 Bàn (hàng 1..6) = tối đa 48 ghế.
 * - Tự động loại bỏ các dòng mẫu thừa (Nguyễn Minh Khôi / Trần Ngọc Bảo Trâm trong file mẫu) hoặc các dòng không phải tên HS.
 * - Nếu có học sinh thật bị đẩy nhầm xuống hàng 7 (hàng bị ẩn bởi vạch "— CUỐI LỚP —"), tự động đưa lên ghế trống ở hàng 1..6.
 * - Danh sách học sinh trả về (`students`) CHỈ GỒM ĐÚNG NHỮNG HỌC SINH ĐANG NGỒI TRÊN SƠ ĐỒ LỚP (hàng 1..6),
 *   đảm bảo sĩ số trên Sơ đồ lớp (VD: 48 HS) và sĩ số toàn hệ thống luôn khớp nhau 100% (không bao giờ bị lệch 48 vs 50).
 */
export function syncStudentsWithSeatingLayout(
  students: Student[],
  layout: SeatLayoutNode[]
): { students: Student[]; layout: SeatLayoutNode[] } {
  if (!students || students.length === 0) {
    return { students: [], layout: layout || [] };
  }

  // 1. Lọc bỏ các bản ghi không phải học sinh thật hoặc 2 dòng học sinh mẫu bị lẫn vào danh sách thật
  const hasRealClassRoster = students.length > 2;
  const cleanedStudents: Student[] = [];
  const seenIds = new Set<string>();

  for (const s of students) {
    if (!s || !isValidStudentName(s.hoTen)) continue;
    if (hasRealClassRoster && isTemplateSampleStudent(s)) continue;
    if (seenIds.has(s.maHS)) continue;
    seenIds.add(s.maHS);
    cleanedStudents.push({ ...s });
  }

  if (cleanedStudents.length === 0) {
    return { students: [], layout: layout || [] };
  }

  const rawLayout =
    layout && layout.length > 0
      ? layout.map(node => ({ ...node }))
      : generateDefaultLayoutForStudents(cleanedStudents);

  const studentMap = new Map<string, Student>();
  cleanedStudents.forEach(s => {
    studentMap.set(s.maHS, { ...s });
  });

  // Thu thập học sinh bị đẩy nhầm xuống hàng >= 7 (vì hàng 7 trên giao diện là vạch "— CUỐI LỚP —" không hiển thị ghế)
  const displacedFromHiddenRows: string[] = [];
  for (const node of rawLayout) {
    if (node.hang >= 7 && node.maHS && studentMap.has(node.maHS)) {
      displacedFromHiddenRows.push(node.maHS);
    }
  }

  // Chỉ giữ lại các hàng 0..6 trên Sơ đồ lớp (loại bỏ các ghế ẩn ở hàng >= 7)
  const baseLayout = rawLayout.filter(node => node.hang <= 6);

  // Đảm bảo đủ 48 ô ghế vật lý ở hàng 1..6 nếu layout bị thiếu
  if (baseLayout.filter(isPhysicalDeskSeatNode).length === 0) {
    return syncStudentsWithSeatingLayout(cleanedStudents, generateDefaultLayoutForStudents(cleanedStudents));
  }

  // 2. Xác thực các học sinh đang ngồi trên 48 ghế chuẩn (hàng 1..6) của Sơ đồ lớp
  const seatedIds = new Set<string>();
  for (const node of baseLayout) {
    if (isPhysicalDeskSeatNode(node) && node.maHS) {
      if (!studentMap.has(node.maHS) || seatedIds.has(node.maHS)) {
        node.maHS = undefined;
        node.loaiO = 'trong';
      } else {
        node.loaiO = 'ghe';
        seatedIds.add(node.maHS);
      }
    } else if (node.hang >= 1 && node.hang <= 6 && VALID_SEAT_COLS.has(node.cot) && !node.maHS) {
      // Giữ trạng thái ghế trống sẵn sàng xếp chỗ
      if (node.loaiO !== 'ghe' && node.loaiO !== 'trong') {
        node.loaiO = 'trong';
      }
    }
  }

  // 3. Nếu trên 48 ghế của Sơ đồ lớp (hàng 1..6) còn ghế trống, ưu tiên xếp các học sinh bị đẩy xuống hàng 7 trước,
  // sau đó đến các học sinh chưa có ghế (cho đến khi lấp đầy tối đa 48 ghế của Sơ đồ lớp).
  const unseatedCandidates: Student[] = [];
  for (const ma of displacedFromHiddenRows) {
    if (!seatedIds.has(ma) && studentMap.has(ma)) {
      unseatedCandidates.push(studentMap.get(ma)!);
    }
  }
  for (const s of cleanedStudents) {
    if (!seatedIds.has(s.maHS) && !unseatedCandidates.some(u => u.maHS === s.maHS)) {
      unseatedCandidates.push(s);
    }
  }

  for (const s of unseatedCandidates) {
    if (seatedIds.size >= 48) break; // Sơ đồ lớp tối đa 48 ghế (4 Tổ x 6 Bàn)
    const preferredGroup = (s.dayBan || s.to || 1) as 1 | 2 | 3 | 4;
    const [colLeft, colRight] = getSeatColsForGroup(preferredGroup);

    let targetSeat = baseLayout.find(
      n =>
        isPhysicalDeskSeatNode(n) &&
        !n.maHS &&
        (n.cot === colLeft || n.cot === colRight) &&
        (!s.soBan || n.hang === s.soBan)
    );
    if (!targetSeat) {
      targetSeat = baseLayout.find(
        n => isPhysicalDeskSeatNode(n) && !n.maHS && (n.cot === colLeft || n.cot === colRight)
      );
    }
    if (!targetSeat) {
      targetSeat = baseLayout.find(n => isPhysicalDeskSeatNode(n) && !n.maHS);
    }
    if (targetSeat) {
      targetSeat.maHS = s.maHS;
      targetSeat.loaiO = 'ghe';
      seatedIds.add(s.maHS);
    }
  }

  // 4. Cập nhật thông tin Tổ, Dãy bàn, Số bàn cho từng học sinh dựa chuẩn 100% theo vị trí ghế trên Sơ đồ lớp (hàng 1..6)
  for (let group = 1; group <= 4; group++) {
    const [colLeft, colRight] = getSeatColsForGroup(group);
    for (let row = 1; row <= 6; row++) {
      for (const col of [colLeft, colRight]) {
        const seat = baseLayout.find(n => isPhysicalDeskSeatNode(n) && n.hang === row && n.cot === col);
        if (seat && seat.maHS) {
          const st = studentMap.get(seat.maHS);
          if (st) {
            const derivedGroup = getGroupFromSeatCol(seat.cot);
            const hasTT = Array.isArray(st.vaiTro) && st.vaiTro.includes('TT');
            const updated: Student = {
              ...st,
              to: derivedGroup,
              dayBan: derivedGroup,
              soBan: Math.max(1, Math.min(6, seat.hang)),
              toTruongTo: hasTT ? derivedGroup : undefined,
            };
            studentMap.set(seat.maHS, updated);
          }
        }
      }
    }
  }

  // 5. QUAN TRỌNG: Danh sách học sinh chuẩn của lớp CHỈ LẤY NHỮNG HỌC SINH ĐANG NGỒI TRÊN SƠ ĐỒ LỚP (`seatedIds`).
  // Mọi dòng thừa/ngoài sơ đồ lớp đều bị loại bỏ để sĩ số hiển thị khớp tuyệt đối với Sơ đồ lớp (VD: 48 HS = 48 HS).
  const seatedOnlyStudents = cleanedStudents
    .filter(orig => seatedIds.has(orig.maHS))
    .map((orig, idx) => {
      const updated = studentMap.get(orig.maHS) || orig;
      return {
        ...updated,
        viTriGhe: idx + 1,
      };
    });

  return {
    students: seatedOnlyStudents,
    layout: baseLayout,
  };
}

/**
 * QUY CHIẾU BẢNG ĐIỂM MÔN HỌC (`academicRecords`) TỪ SƠ ĐỒ LỚP (`masterStudents`):
 * - Danh sách học sinh trên Sơ đồ lớp là gốc chuẩn duy nhất.
 * - Mỗi học sinh trên Sơ đồ lớp sẽ có đúng 1 bản ghi điểm (theo từng học kỳ), giữ đúng `maHS`, `hoTen`, `to` của Sơ đồ lớp.
 * - Các bản ghi điểm nhập từ file ngoài sẽ được đối chiếu theo `hoTen` hoặc `maHS` vào đúng học sinh trên Sơ đồ lớp.
 */
export function reconcileAcademicRecordsWithSeating(
  masterStudents: Student[],
  academicRecords: StudentAcademicRecord[],
  defaultHocKi: 1 | 2 = 1
): StudentAcademicRecord[] {
  if (!masterStudents || masterStudents.length === 0) return [];

  const validRecords = Array.isArray(academicRecords) ? academicRecords : [];
  const semesters = new Set<1 | 2>([defaultHocKi]);
  validRecords.forEach(r => {
    if (r && (r.hocKi === 1 || r.hocKi === 2)) semesters.add(r.hocKi);
  });

  const result: StudentAcademicRecord[] = [];
  const nowIso = new Date().toISOString();

  for (const sem of Array.from(semesters).sort()) {
    const semRecords = validRecords.filter(r => r && (r.hocKi || 1) === sem);
    const matchedByMasterId = new Map<string, StudentAcademicRecord>();

    for (const rec of semRecords) {
      const matchedStudent = findStudentInSeatingMaster(masterStudents, rec.maHS, rec.hoTen);
      if (matchedStudent) {
        const existing = matchedByMasterId.get(matchedStudent.maHS);
        if (!existing) {
          matchedByMasterId.set(matchedStudent.maHS, {
            ...rec,
            maHS: matchedStudent.maHS,
            hoTen: matchedStudent.hoTen,
            to: matchedStudent.to,
            hocKi: sem,
            namHoc: rec.namHoc || '2026-2027',
            subjects: { ...(rec.subjects || {}) },
            ngayCapNhat: rec.ngayCapNhat || nowIso,
          });
        } else {
          matchedByMasterId.set(matchedStudent.maHS, {
            ...existing,
            maHS: matchedStudent.maHS,
            hoTen: matchedStudent.hoTen,
            to: matchedStudent.to,
            hocKi: sem,
            subjects: {
              ...(existing.subjects || {}),
              ...(rec.subjects || {}),
            },
            diemTBChung: rec.diemTBChung ?? existing.diemTBChung,
            hocLuc: rec.hocLuc ?? existing.hocLuc,
            danhHieu: rec.danhHieu ?? existing.danhHieu,
            nhanXetGVCN: rec.nhanXetGVCN || existing.nhanXetGVCN,
            ngayCapNhat: rec.ngayCapNhat || existing.ngayCapNhat || nowIso,
          });
        }
      }
    }

    // Xuất danh sách đúng theo danh sách học sinh trên Sơ đồ lớp
    for (const student of masterStudents) {
      const matched = matchedByMasterId.get(student.maHS);
      if (matched) {
        result.push(matched);
      } else {
        result.push({
          maHS: student.maHS,
          hoTen: student.hoTen,
          to: student.to,
          hocKi: sem,
          namHoc: '2026-2027',
          subjects: {},
          diemTBChung: null,
          hocLuc: null,
          danhHieu: null,
          ngayCapNhat: nowIso,
        });
      }
    }
  }

  return result;
}

/**
 * QUY CHIẾU NHẬT KÝ NỀ NẾP (`DisciplineRecord[]`) TỪ SƠ ĐỒ LỚP (`masterStudents`):
 * - Mọi bản ghi cộng/trừ điểm đều được đối chiếu với học sinh trong Sơ đồ lớp để đồng bộ chính xác `maHS`, `hoTen`, `to`.
 * - Các bản ghi đối tượng 'To' (chấm cả tổ) được giữ nguyên.
 */
export function reconcileDisciplineRecordsWithSeating(
  masterStudents: Student[],
  records: DisciplineRecord[]
): DisciplineRecord[] {
  if (!Array.isArray(records) || records.length === 0) return [];
  if (!masterStudents || masterStudents.length === 0) return records;

  const reconciled: DisciplineRecord[] = [];
  const seenIds = new Set<string>();

  for (const rec of records) {
    if (!rec) continue;
    if (rec.maGhiNhan) {
      if (seenIds.has(rec.maGhiNhan)) continue;
      seenIds.add(rec.maGhiNhan);
    }
    if (rec.doiTuong === 'To') {
      reconciled.push(rec);
      continue;
    }
    const matchedStudent = findStudentInSeatingMaster(masterStudents, rec.maHS, rec.hoTen);
    if (matchedStudent) {
      reconciled.push({
        ...rec,
        maHS: matchedStudent.maHS,
        hoTen: matchedStudent.hoTen,
        to: matchedStudent.to,
      });
    }
  }
  return reconciled;
}

/**
 * Phân tích thông tin học sinh trong 1 ô của Sơ đồ lớp 2D
 * Hỗ trợ dạng: "Nguyễn Văn A (LT)", "HS01 - Nguyễn Văn A", "Nguyễn Văn A [Bí thư]"
 */
function parseCellStudentInfo(rawCell: string): {
  hoTen: string;
  explicitId?: string;
  roles: RoleCode[];
} | null {
  const cleaned = String(rawCell || '')
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return null;

  const lower = cleaned.toLowerCase();
  const roles = new Set<RoleCode>(['HS']);
  if (lower.includes('lớp trưởng') || /\b(lt)\b/i.test(cleaned)) roles.add('LT');
  if (lower.includes('phó bí thư') || /\b(pbt)\b/i.test(cleaned)) {
    roles.add('PBT');
  } else if (lower.includes('bí thư') || /\b(bt)\b/i.test(cleaned)) {
    roles.add('BT');
  }
  if (lower.includes('lớp phó học tập') || lower.includes('lp học tập') || /\b(lp_ht|lpht)\b/i.test(cleaned)) roles.add('LP_HT');
  if (lower.includes('lớp phó lao động') || lower.includes('lp lao động') || /\b(lp_ld|lpld)\b/i.test(cleaned)) roles.add('LP_LD');
  if (lower.includes('lớp phó văn thể') || lower.includes('lp văn thể') || lower.includes('văn thể mỹ') || lower.includes('văn thể') || /\b(lp_vt|lpvt|vt)\b/i.test(cleaned)) roles.add('LP_VT');
  if (lower.includes('cờ đỏ') || lower.includes('sao đỏ') || /\b(cd|cđ)\b/i.test(cleaned)) roles.add('CD');
  if (lower.includes('tổ trưởng') || /\b(tt)\b/i.test(cleaned)) roles.add('TT');

  const orderedRoles: RoleCode[] = [
    ...Array.from(roles).filter(r => r !== 'HS'),
    'HS',
  ];

  // Tách Mã HS nếu có dạng "HS01 - Nguyễn Văn A" hoặc "1. Nguyễn Văn A"
  let explicitId: string | undefined;
  let namePart = cleaned.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').trim();
  const idMatch = namePart.match(/^(HS\d{1,5})\s*[-–:]\s*(.+)$/i);
  if (idMatch) {
    explicitId = idMatch[1].toUpperCase();
    namePart = idMatch[2].trim();
  } else {
    namePart = namePart.replace(/^\d+[\.\/\)\-:]\s*/, '').trim();
  }

  if (!isValidStudentName(namePart)) return null;
  return { hoTen: namePart, explicitId, roles: orderedRoles };
}

/**
 * NHẬN DIỆN & ĐỌC SHEET SƠ ĐỒ LỚP 2D TRỰC QUAN TỪ FILE EXCEL:
 * Hỗ trợ bảng sơ đồ chỗ ngồi có các cột Dãy 1/Tổ 1 .. Dãy 4/Tổ 4 và các hàng Bàn 1 .. Bàn 6 (tối đa 48 HS).
 */
export function parse2DSeatingGridSheet(
  rows: any[][],
  existingStudents: Student[] = []
): { students: Student[]; layout: SeatLayoutNode[] } | null {
  if (!Array.isArray(rows) || rows.length < 2) return null;

  let headerRowIdx = -1;
  const groupCols: Record<1 | 2 | 3 | 4, number[]> = { 1: [], 2: [], 3: [], 4: [] };

  for (let r = 0; r < Math.min(rows.length, 12); r++) {
    const row = rows[r] || [];
    const tempCols: Record<1 | 2 | 3 | 4, number[]> = { 1: [], 2: [], 3: [], 4: [] };
    let matchCount = 0;

    for (let c = 0; c < row.length; c++) {
      const cellStr = String(row[c] ?? '').toLowerCase().trim();
      if (!cellStr) continue;
      // Không nhầm với dòng tiêu đề danh sách phẳng có cột đơn "Tổ" hoặc "Dãy bàn"
      if (cellStr === 'tổ' || cellStr === 'to' || cellStr === 'dãy bàn' || cellStr === 'day ban') {
        continue;
      }
      for (const g of [1, 2, 3, 4] as const) {
        if (
          cellStr.includes(`dãy ${g}`) ||
          cellStr.includes(`day ${g}`) ||
          cellStr.includes(`tổ ${g}`) ||
          cellStr.includes(`to ${g}`)
        ) {
          tempCols[g].push(c);
          matchCount++;
        }
      }
    }

    if (matchCount >= 2) {
      headerRowIdx = r;
      const subRow = rows[r + 1] || [];
      for (const g of [1, 2, 3, 4] as const) {
        if (tempCols[g].length === 1) {
          const baseCol = tempCols[g][0];
          const nextColHeader = String(row[baseCol + 1] ?? '').trim();
          const subLeft = String(subRow[baseCol] ?? '').toLowerCase();
          const subRight = String(subRow[baseCol + 1] ?? '').toLowerCase();
          const hasDataInNextCol = rows
            .slice(r + 1, Math.min(rows.length, r + 9))
            .some(dataRow => parseCellStudentInfo(String(dataRow?.[baseCol + 1] ?? '')) !== null);

          if (
            !nextColHeader &&
            (subLeft.includes('ghế') ||
              subRight.includes('ghế') ||
              subLeft.includes('trái') ||
              subRight.includes('phải') ||
              hasDataInNextCol)
          ) {
            groupCols[g] = [baseCol, baseCol + 1];
          } else {
            groupCols[g] = [baseCol];
          }
        } else if (tempCols[g].length >= 2) {
          groupCols[g] = tempCols[g].slice(0, 2);
        }
      }
      break;
    }
  }

  if (headerRowIdx === -1) return null;

  // Kiểm tra xem sheet có cột nhãn "Bàn 1".."Bàn 6" tường minh không
  const explicitDeskRowsCount = rows
    .slice(headerRowIdx + 1)
    .filter(r =>
      Array.isArray(r) &&
      r.slice(0, 2).some(cell => /^bàn\s*[1-6]$/i.test(String(cell ?? '').trim()))
    ).length;
  const requireExplicitDeskLabel = explicitDeskRowsCount >= 3;

  const layout = generateDefaultLayoutForStudents([]);
  const parsedStudents: Student[] = [];
  let autoIdCounter = 1;
  const usedIds = new Set<string>();
  const seenNames = new Set<string>();

  let currentDeskRow = 0;
  for (let r = headerRowIdx + 1; r < rows.length; r++) {
    const row = rows[r] || [];
    const firstColText = String(row[0] ?? '').toLowerCase().trim();
    const secondColText = String(row[1] ?? '').toLowerCase().trim();

    if (
      firstColText.includes('vị trí') ||
      row.some(cell => /^ghế\s*(trái|phải|\d+)$/i.test(String(cell ?? '').trim()))
    ) {
      continue;
    }

    // Bỏ qua dòng nếu dòng đó là khu vực Bàn GV / Bục giảng / Cửa lớp / Cuối lớp
    const isFixtureRow = row.some(cell => {
      const s = String(cell ?? '').toLowerCase().trim();
      return (
        s.includes('bàn giáo viên') ||
        s.includes('bàn gv') ||
        s.includes('bục giảng') ||
        s.includes('cửa chính') ||
        s.includes('cửa vào') ||
        s.includes('cửa ra vào') ||
        s.includes('cuối lớp')
      );
    });
    if (isFixtureRow) continue;

    const deskMatch =
      firstColText.match(/^bàn\s*([1-6])$/i) ||
      secondColText.match(/^bàn\s*([1-6])$/i) ||
      firstColText.match(/^([1-6])$/);

    if (deskMatch) {
      currentDeskRow = parseInt(deskMatch[1], 10);
    } else if (requireExplicitDeskLabel) {
      // Nếu bảng đã đánh nhãn Bàn 1..Bàn 6 rõ ràng thì mọi dòng ngoài Bàn 1..6 (như dòng ghi chú/tổng kết) đều bỏ qua
      continue;
    } else {
      const hasAnyCell = ([1, 2, 3, 4] as const).some(g =>
        groupCols[g].some(c => parseCellStudentInfo(String(row[c] ?? '')) !== null)
      );
      if (!hasAnyCell) continue;
      currentDeskRow = currentDeskRow + 1;
      if (currentDeskRow > 6) {
        // Sơ đồ lớp chuẩn chỉ có tối đa 6 bàn mỗi dãy (48 chỗ ngồi)
        break;
      }
    }

    for (const g of [1, 2, 3, 4] as const) {
      const cols = groupCols[g];
      if (cols.length === 0) continue;
      const [seatColLeft, seatColRight] = getSeatColsForGroup(g);

      const rawSeatValues: string[] = [];
      if (cols.length === 1) {
        const cellVal = String(row[cols[0]] ?? '').trim();
        if (cellVal.includes(';') || cellVal.includes('|') || cellVal.includes('/')) {
          rawSeatValues.push(...cellVal.split(/[;|/]/).map(s => s.trim()));
        } else {
          rawSeatValues.push(cellVal);
        }
      } else {
        rawSeatValues.push(String(row[cols[0]] ?? '').trim(), String(row[cols[1]] ?? '').trim());
      }

      const targetCols = [seatColLeft, seatColRight];
      for (let sIdx = 0; sIdx < Math.min(2, rawSeatValues.length); sIdx++) {
        const info = parseCellStudentInfo(rawSeatValues[sIdx]);
        if (!info) continue;

        const normKey = `${g}-${currentDeskRow}-${sIdx}-${normalizeStudentNameForMatch(info.hoTen)}`;
        if (seenNames.has(normKey)) continue;
        seenNames.add(normKey);

        const existing = findStudentInSeatingMaster(existingStudents, info.explicitId, info.hoTen);
        let maHS = info.explicitId || existing?.maHS || '';
        while (!maHS || usedIds.has(maHS)) {
          const num = autoIdCounter++;
          maHS = `HS${num < 10 ? '0' + num : num}`;
        }
        usedIds.add(maHS);

        const hasNonHsRole = info.roles.some(role => role !== 'HS');
        const roles: RoleCode[] = hasNonHsRole
          ? info.roles
          : existing?.vaiTro && existing.vaiTro.length > 0
          ? existing.vaiTro
          : ['HS'];

        const seatCol = targetCols[sIdx];
        const seatNode = layout.find(
          n => isPhysicalDeskSeatNode(n) && n.hang === currentDeskRow && n.cot === seatCol
        );

        let assignedSeat: SeatLayoutNode | undefined = undefined;
        if (seatNode && !seatNode.maHS) {
          assignedSeat = seatNode;
        } else {
          assignedSeat = layout.find(
            n =>
              isPhysicalDeskSeatNode(n) &&
              !n.maHS &&
              (n.cot === seatColLeft || n.cot === seatColRight)
          );
        }

        // Chỉ thêm học sinh khi thực sự có ghế hợp lệ trong 48 ghế của Sơ đồ lớp
        if (!assignedSeat) continue;

        assignedSeat.maHS = maHS;
        assignedSeat.loaiO = 'ghe';

        const newStudent: Student = {
          ...(existing || {}),
          maHS,
          hoTen: info.hoTen,
          tenRutGon: makeShortStudentName(info.hoTen),
          gioiTinh: existing?.gioiTinh || 'Nam',
          to: g,
          dayBan: g,
          soBan: assignedSeat.hang,
          viTriGhe: parsedStudents.length + 1,
          vaiTro: roles,
          toTruongTo: roles.includes('TT') ? g : undefined,
        };

        parsedStudents.push(newStudent);
      }
    }
  }

  if (parsedStudents.length === 0) return null;
  return syncStudentsWithSeatingLayout(parsedStudents, layout);
}
