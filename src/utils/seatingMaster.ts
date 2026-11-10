import { Student, SeatLayoutNode, StudentAcademicRecord, DisciplineRecord, RoleCode } from '../types';

/**
 * Khởi tạo khung Sơ đồ lớp chuẩn (4 Dãy bàn / 4 Tổ x 6 Bàn = 48 ghế)
 */
export function generateDefaultLayoutForStudents(studentsList: Student[] = []): SeatLayoutNode[] {
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
  if (to === 1) return [10, 9];
  if (to === 2) return [7, 6];
  if (to === 3) return [4, 3];
  return [1, 0];
}

/**
 * Tìm học sinh trong danh sách chuẩn Sơ đồ lớp (`masterStudents`) bằng Mã HS hoặc Họ tên.
 * Ưu tiên khớp theo Họ và tên chuẩn hóa trước (vì các file ngoài như vnEdu/Excel thường có STT/Mã HS khác
 * hoặc tự đánh số HS01..HS42 theo thứ tự ABC thay vì thứ tự Sơ đồ lớp).
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

  // 1. Nếu có Họ và tên: Ưu tiên đối chiếu chính xác theo Họ và tên với Sơ đồ lớp
  if (normName) {
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
  }

  // 3. Đối chiếu theo Mã HS (khi file chỉ nhập Mã HS hoặc tên bị viết tắt)
  if (cleanId) {
    const byId = masterStudents.find(s => s.maHS.trim().toUpperCase() === cleanId);
    if (byId) return byId;
  }

  // 4. Dự phòng: Nếu raw input truyền cả chuỗi "HS01 - Nguyễn Văn A" vào maHS hoặc hoTen
  const combinedNorm = normName || normalizeStudentNameForMatch(maHS);
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
 * ĐỒNG BỘ LẤY SƠ ĐỒ LỚP LÀM CHUẨN (`layout` + `students`):
 * - Mọi học sinh đang ngồi trên `layout` (`loaiO === 'ghe' && maHS`) sẽ được cập nhật chính xác
 *   `to` (Tổ 1..4), `dayBan` (1..4), `soBan` (1..6) và `toTruongTo` theo đúng vị trí ghế trên Sơ đồ lớp.
 * - Nếu có học sinh trong `students` chưa có ghế trên `layout`, tự động xếp vào ghế trống của Tổ tương ứng
 *   để Sơ đồ lớp và Danh sách học sinh luôn khớp 100%.
 */
export function syncStudentsWithSeatingLayout(
  students: Student[],
  layout: SeatLayoutNode[]
): { students: Student[]; layout: SeatLayoutNode[] } {
  if (!students || students.length === 0) {
    return { students: [], layout: layout || [] };
  }

  const baseLayout =
    layout && layout.length > 0
      ? layout.map(node => ({ ...node }))
      : generateDefaultLayoutForStudents(students);

  const studentMap = new Map<string, Student>();
  students.forEach(s => {
    studentMap.set(s.maHS, { ...s });
  });

  // Loại bỏ các maHS trên ghế không còn tồn tại trong danh sách học sinh,
  // hoặc bị trùng ghế (1 học sinh ngồi 2 ghế)
  const seatedIds = new Set<string>();
  for (const node of baseLayout) {
    if (node.loaiO === 'ghe' && node.maHS) {
      if (!studentMap.has(node.maHS) || seatedIds.has(node.maHS)) {
        node.maHS = undefined;
      } else {
        seatedIds.add(node.maHS);
      }
    }
  }

  // Xếp chỗ tự động cho những học sinh có trong danh sách nhưng chưa có ghế trên Sơ đồ lớp
  for (const s of students) {
    if (!seatedIds.has(s.maHS)) {
      const preferredGroup = (s.dayBan || s.to || 1) as 1 | 2 | 3 | 4;
      const [colLeft, colRight] = getSeatColsForGroup(preferredGroup);
      let targetSeat = baseLayout.find(
        n =>
          n.loaiO === 'ghe' &&
          !n.maHS &&
          (n.cot === colLeft || n.cot === colRight) &&
          (!s.soBan || n.hang === s.soBan)
      );
      if (!targetSeat) {
        targetSeat = baseLayout.find(
          n => n.loaiO === 'ghe' && !n.maHS && (n.cot === colLeft || n.cot === colRight)
        );
      }
      if (!targetSeat) {
        targetSeat = baseLayout.find(n => n.loaiO === 'ghe' && !n.maHS);
      }
      if (targetSeat) {
        targetSeat.maHS = s.maHS;
        seatedIds.add(s.maHS);
      }
    }
  }

  // Cập nhật thông tin Tổ, Dãy bàn, Số bàn cho từng học sinh dựa chuẩn theo vị trí trên Sơ đồ lớp
  const maxRow = Math.max(6, ...baseLayout.map(n => n.hang));
  for (let group = 1; group <= 4; group++) {
    const [colLeft, colRight] = getSeatColsForGroup(group);
    for (let row = 1; row <= maxRow; row++) {
      for (const col of [colLeft, colRight]) {
        const seat = baseLayout.find(n => n.loaiO === 'ghe' && n.hang === row && n.cot === col);
        if (seat && seat.maHS) {
          const st = studentMap.get(seat.maHS);
          if (st) {
            const derivedGroup = getGroupFromSeatCol(seat.cot);
            const hasTT = Array.isArray(st.vaiTro) && st.vaiTro.includes('TT');
            const updated: Student = {
              ...st,
              to: derivedGroup,
              dayBan: derivedGroup,
              soBan: Math.max(1, seat.hang),
              toTruongTo: hasTT ? derivedGroup : undefined,
            };
            studentMap.set(seat.maHS, updated);
          }
        }
      }
    }
  }

  // Giữ thứ tự gốc nhưng cập nhật đầy đủ thuộc tính Tổ/Dãy/Bàn từ Sơ đồ lớp
  const syncedStudents = students.map((orig, idx) => {
    const updated = studentMap.get(orig.maHS) || orig;
    return {
      ...updated,
      viTriGhe: updated.viTriGhe || idx + 1,
    };
  });

  return {
    students: syncedStudents,
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
  for (const rec of records) {
    if (!rec) continue;
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
  if (
    lower === 'trống' ||
    lower === 'trong' ||
    lower === 'ghế trống' ||
    lower === 'bàn giáo viên' ||
    lower === 'bàn gv' ||
    lower === 'bục giảng' ||
    lower === 'cửa vào' ||
    lower === 'cửa chính' ||
    lower === 'cửa lớp' ||
    /^bàn\s*\d+$/i.test(cleaned) ||
    /^dãy\s*\d+/i.test(cleaned) ||
    /^tổ\s*\d+/i.test(cleaned) ||
    /^ghế\s*(trái|phải|\d+)$/i.test(cleaned)
  ) {
    return null;
  }

  const roles = new Set<RoleCode>(['HS']);
  if (lower.includes('lớp trưởng') || /\b(lt)\b/i.test(cleaned)) roles.add('LT');
  if (lower.includes('lớp phó học tập') || /\b(lp_ht|lpht|lp)\b/i.test(cleaned)) roles.add('LP_HT');
  if (lower.includes('lớp phó lao động') || /\b(lp_ld|lpld)\b/i.test(cleaned)) roles.add('LP_LD');
  if (lower.includes('bí thư') || /\b(bt)\b/i.test(cleaned)) roles.add('BT');
  if (lower.includes('tổ trưởng') || /\b(tt)\b/i.test(cleaned)) roles.add('TT');

  const orderedRoles: RoleCode[] = [
    ...Array.from(roles).filter(r => r !== 'HS'),
    'HS',
  ];

  // Tách Mã HS nếu có dạng "HS01 - Nguyễn Văn A"
  let explicitId: string | undefined;
  let namePart = cleaned.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').trim();
  const idMatch = namePart.match(/^(HS\d{1,5})\s*[-–:]\s*(.+)$/i);
  if (idMatch) {
    explicitId = idMatch[1].toUpperCase();
    namePart = idMatch[2].trim();
  }

  if (!namePart || namePart.length < 2 || /^\d+$/.test(namePart)) return null;
  return { hoTen: namePart, explicitId, roles: orderedRoles };
}

/**
 * NHẬN DIỆN & ĐỌC SHEET SƠ ĐỒ LỚP 2D TRỰC QUAN TỪ FILE EXCEL:
 * Hỗ trợ bảng sơ đồ chỗ ngồi có các cột Dãy 1/Tổ 1 .. Dãy 4/Tổ 4 và các hàng Bàn 1 .. Bàn 6.
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
          if (
            !nextColHeader &&
            (subLeft.includes('ghế') ||
              subRight.includes('ghế') ||
              subLeft.includes('trái') ||
              subRight.includes('phải'))
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

  const layout = generateDefaultLayoutForStudents([]);
  const parsedStudents: Student[] = [];
  let autoIdCounter = 1;
  const usedIds = new Set<string>();

  let currentDeskRow = 0;
  for (let r = headerRowIdx + 1; r < rows.length; r++) {
    const row = rows[r] || [];
    const firstColText = String(row[0] ?? '').toLowerCase().trim();

    if (
      firstColText.includes('vị trí') ||
      row.some(cell => /^ghế\s*(trái|phải|\d+)$/i.test(String(cell ?? '').trim()))
    ) {
      continue;
    }

    const deskMatch = firstColText.match(/bàn\s*(\d+)/i) || firstColText.match(/^(\d+)$/);
    if (deskMatch) {
      currentDeskRow = Math.min(6, Math.max(1, parseInt(deskMatch[1], 10)));
    } else {
      const hasAnyCell = ([1, 2, 3, 4] as const).some(g =>
        groupCols[g].some(c => parseCellStudentInfo(String(row[c] ?? '')) !== null)
      );
      if (!hasAnyCell) continue;
      currentDeskRow = Math.min(6, currentDeskRow + 1);
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

        const newStudent: Student = {
          ...(existing || {}),
          maHS,
          hoTen: info.hoTen,
          tenRutGon: makeShortStudentName(info.hoTen),
          gioiTinh: existing?.gioiTinh || 'Nam',
          to: g,
          dayBan: g,
          soBan: currentDeskRow,
          viTriGhe: parsedStudents.length + 1,
          vaiTro: roles,
          toTruongTo: roles.includes('TT') ? g : undefined,
        };

        parsedStudents.push(newStudent);

        const seatCol = targetCols[sIdx];
        const seatNode = layout.find(
          n => n.loaiO === 'ghe' && n.hang === currentDeskRow && n.cot === seatCol
        );
        if (seatNode && !seatNode.maHS) {
          seatNode.maHS = maHS;
        } else {
          const fallbackSeat = layout.find(
            n =>
              n.loaiO === 'ghe' &&
              !n.maHS &&
              (n.cot === seatColLeft || n.cot === seatColRight)
          );
          if (fallbackSeat) {
            fallbackSeat.maHS = maHS;
            newStudent.soBan = fallbackSeat.hang;
          }
        }
      }
    }
  }

  if (parsedStudents.length === 0) return null;
  return syncStudentsWithSeatingLayout(parsedStudents, layout);
}
