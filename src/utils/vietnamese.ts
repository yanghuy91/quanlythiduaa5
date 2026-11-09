/**
 * Vietnamese text utilities: Accent stripping, fuzzy searching, initials, sorting
 */

export function removeVietnameseAccents(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export function getInitials(fullName: string): string {
  if (!fullName) return '';
  return fullName
    .split(/\s+/)
    .map(word => removeVietnameseAccents(word[0]))
    .join('');
}

export function searchStudents<T extends { hoTen: string; tenRutGon: string; maHS: string; to: number }>(
  students: T[],
  query: string
): T[] {
  const cleanQuery = removeVietnameseAccents(query);
  if (!cleanQuery) return students;

  return students.filter(student => {
    const cleanFullName = removeVietnameseAccents(student.hoTen);
    const cleanShortName = removeVietnameseAccents(student.tenRutGon);
    const initials = getInitials(student.hoTen);
    const maHS = student.maHS.toLowerCase();
    const to = `to ${student.to}`;

    return (
      cleanFullName.includes(cleanQuery) ||
      cleanShortName.includes(cleanQuery) ||
      initials.includes(cleanQuery) ||
      maHS.includes(cleanQuery) ||
      to.includes(cleanQuery)
    );
  });
}

/**
 * Sort by Vietnamese first name (Tên chính), then middle & last name
 */
export function sortVietnameseNames<T extends { hoTen: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const partsA = a.hoTen.trim().split(/\s+/);
    const partsB = b.hoTen.trim().split(/\s+/);
    const firstNameA = partsA[partsA.length - 1];
    const firstNameB = partsB[partsB.length - 1];

    const cmp = firstNameA.localeCompare(firstNameB, 'vi', { sensitivity: 'base' });
    if (cmp !== 0) return cmp;
    return a.hoTen.localeCompare(b.hoTen, 'vi', { sensitivity: 'base' });
  });
}

/**
 * Lấy 1 chữ cái in hoa đầu tiên của Tên chính làm đại diện avatar hình tròn.
 * Đảm bảo hiển thị gọn gàng, sắc nét, không bị lung tung.
 * Ví dụ: "Bùi Gia Khiêm" -> "K", "Bùi Minh Triết" -> "T", "Trần Thị Mai Anh" -> "A"
 */
export function getStudentAvatarInitial(hoTen: string): string {
  if (!hoTen) return '?';
  const parts = hoTen.trim().split(/\s+/);
  const givenName = parts[parts.length - 1] || '';
  return givenName.charAt(0).toUpperCase() || '?';
}

/**
 * Lấy tên hiển thị chuẩn trên ô sơ đồ lớp:
 * - Chỉ ghi Tên (không ghi Họ)
 * - Nếu trong lớp có bạn trùng tên thì thêm chữ lót viết tắt phía trước.
 * - Ví dụ:
 *   "Khiêm", "Triết", "Bách", "Nam"
 *   "K.Huy" vs "V.Huy"
 *   "Mai Anh" vs "Minh Anh" vs "T.Anh"
 *   "Hoàng Long" vs "Hải Long"
 *   "Q.Bảo" vs "G.Bảo"
 *   "K.Linh" vs "D.Linh"
 */
export function getSeatingMapDisplayName(
  student: { hoTen: string },
  allStudents?: { hoTen: string }[]
): string {
  if (!student || !student.hoTen) return '';
  const parts = student.hoTen.trim().split(/\s+/);
  const givenName = parts[parts.length - 1];

  if (!allStudents || allStudents.length === 0) {
    return givenName;
  }

  const peersWithSameName = allStudents.filter(s => {
    const sParts = s.hoTen.trim().split(/\s+/);
    return sParts[sParts.length - 1] === givenName;
  });

  if (peersWithSameName.length <= 1) {
    return givenName;
  }

  // Trường hợp tên Anh
  if (givenName === 'Anh') {
    if (student.hoTen.includes('Mai Anh')) return 'Mai Anh';
    if (student.hoTen.includes('Minh Anh')) return 'Minh Anh';
    if (student.hoTen.includes('Tuấn Anh')) return 'T.Anh';
  }

  // Trường hợp tên Long
  if (givenName === 'Long') {
    if (student.hoTen.includes('Hoàng Long')) return 'Hoàng Long';
    if (student.hoTen.includes('Hải Long')) return 'Hải Long';
  }

  // Quy tắc chung: Chữ cái đầu của chữ lót + '.' + Tên
  const middleName = parts.length > 2 ? parts[parts.length - 2] : (parts.length === 2 ? parts[0] : '');
  if (middleName) {
    return `${middleName.charAt(0).toUpperCase()}.${givenName}`;
  }

  return givenName;
}
