import * as XLSX from 'xlsx';
import { 
  SubjectDefinition, 
  SubjectScore, 
  StudentAcademicRecord, 
  AcademicStanding 
} from '../types';
import { MOCK_STUDENTS } from './mockData';

export const STORAGE_KEY_ACADEMIC_GRADES = 'app_academic_grades_10a5_v1';

export const DEFAULT_SUBJECTS: SubjectDefinition[] = [
  { id: 'toan', name: 'Toán học', shortName: 'Toán', icon: '📐', type: 'score', category: 'core', order: 1 },
  { id: 'van', name: 'Ngữ văn', shortName: 'Văn', icon: '✍️', type: 'score', category: 'core', order: 2 },
  { id: 'anh', name: 'Tiếng Anh', shortName: 'Anh', icon: '🌐', type: 'score', category: 'core', order: 3 },
  { id: 'ly', name: 'Vật lí', shortName: 'Vật lí', icon: '⚡', type: 'score', category: 'science', order: 4 },
  { id: 'hoa', name: 'Hóa học', shortName: 'Hóa học', icon: '🧪', type: 'score', category: 'science', order: 5 },
  { id: 'sinh', name: 'Sinh học', shortName: 'Sinh học', icon: '🧬', type: 'score', category: 'science', order: 6 },
  { id: 'su', name: 'Lịch sử', shortName: 'Lịch sử', icon: '🏛️', type: 'score', category: 'social', order: 7 },
  { id: 'dia', name: 'Địa lí', shortName: 'Địa lí', icon: '🌍', type: 'score', category: 'social', order: 8 },
  { id: 'gdcd', name: 'GDKT & PL', shortName: 'GDKT&PL', icon: '⚖️', type: 'score', category: 'social', order: 9 },
  { id: 'tin', name: 'Tin học', shortName: 'Tin học', icon: '💻', type: 'score', category: 'science', order: 10 },
  { id: 'cn', name: 'Công nghệ', shortName: 'Công nghệ', icon: '⚙️', type: 'score', category: 'science', order: 11 },
  { id: 'qp', name: 'GDQP - AN', shortName: 'GDQP-AN', icon: '🎖️', type: 'score', category: 'special', order: 12 },
  { id: 'td', name: 'Giáo dục thể chất', shortName: 'GDTC', icon: '🏃', type: 'evaluate', category: 'special', order: 13 },
  { id: 'hdtn', name: 'HĐTN, HN', shortName: 'HĐTN-HN', icon: '🌟', type: 'evaluate', category: 'special', order: 14 },
];

/**
 * Tính điểm trung bình môn từ các điểm thành phần
 * ĐTBm = (Tổng ĐĐGtx + 2*ĐĐGgk + 3*ĐĐGck) / (Số ĐĐGtx + 2 + 3)
 */
export function calculateSubjectAverage(score: Partial<SubjectScore>): number | null {
  const validTx = (score.tx || []).filter((x): x is number => typeof x === 'number' && !isNaN(x));
  const hasGk = typeof score.gk === 'number' && !isNaN(score.gk);
  const hasCk = typeof score.ck === 'number' && !isNaN(score.ck);

  if (validTx.length === 0 && !hasGk && !hasCk) {
    return score.tb !== undefined && score.tb !== null ? score.tb : null;
  }

  // Trọng số chuẩn GDPT 2018
  const sumTx = validTx.reduce((acc, val) => acc + val, 0);
  const gk = hasGk ? (score.gk as number) : 0;
  const ck = hasCk ? (score.ck as number) : 0;

  const totalPoints = sumTx + (hasGk ? gk * 2 : 0) + (hasCk ? ck * 3 : 0);
  const totalCoeff = validTx.length + (hasGk ? 2 : 0) + (hasCk ? 3 : 0);

  if (totalCoeff === 0) return null;
  return Math.round((totalPoints / totalCoeff) * 10) / 10;
}

/**
 * Tính điểm trung bình chung tất cả các môn tính điểm
 */
export function calculateOverallGPA(subjects: Record<string, SubjectScore>): number | null {
  const scoredSubjects = DEFAULT_SUBJECTS.filter(s => s.type === 'score');
  let sum = 0;
  let count = 0;

  scoredSubjects.forEach(s => {
    const sc = subjects[s.id];
    if (sc && typeof sc.tb === 'number' && !isNaN(sc.tb)) {
      sum += sc.tb;
      count += 1;
    }
  });

  if (count === 0) return null;
  return Math.round((sum / count) * 10) / 10;
}

/**
 * Đánh giá xếp loại học lực theo Thông tư 22/2021/TT-BGDĐT
 */
export function evaluateAcademicStanding(
  subjects: Record<string, SubjectScore>,
  gpa: number | null
): { hocLuc: AcademicStanding | null; danhHieu: 'Học sinh Xuất sắc' | 'Học sinh Giỏi' | 'Học sinh Tiên tiến' | null } {
  if (gpa === null) return { hocLuc: null, danhHieu: null };

  const scoredSubs = DEFAULT_SUBJECTS.filter(s => s.type === 'score');
  const evalSubs = DEFAULT_SUBJECTS.filter(s => s.type === 'evaluate');

  const scores = scoredSubs.map(s => subjects[s.id]?.tb).filter((v): v is number => typeof v === 'number');
  const allEvalPassed = evalSubs.every(s => subjects[s.id]?.evaluateResult !== 'CĐ');

  const minScore = scores.length > 0 ? Math.min(...scores) : 0;
  const countAbove9 = scores.filter(v => v >= 9.0).length;

  let hocLuc: AcademicStanding = 'Chưa đạt';
  let danhHieu: 'Học sinh Xuất sắc' | 'Học sinh Giỏi' | 'Học sinh Tiên tiến' | null = null;

  if (gpa >= 9.0 && minScore >= 6.5 && allEvalPassed && countAbove9 >= 6) {
    hocLuc = 'Xuất sắc';
    danhHieu = 'Học sinh Xuất sắc';
  } else if (gpa >= 8.0 && minScore >= 6.5 && allEvalPassed) {
    hocLuc = 'Giỏi';
    danhHieu = 'Học sinh Giỏi';
  } else if (gpa >= 6.5 && minScore >= 5.0 && allEvalPassed) {
    hocLuc = 'Khá';
    danhHieu = 'Học sinh Tiên tiến';
  } else if (gpa >= 5.0 && minScore >= 3.5) {
    hocLuc = 'Đạt';
    danhHieu = null;
  } else {
    hocLuc = 'Chưa đạt';
    danhHieu = null;
  }

  return { hocLuc, danhHieu };
}

/**
 * Sinh dữ liệu điểm mẫu thực tế cho 42 học sinh Lớp 10A5 (Học kỳ 1)
 */
export function generateInitialAcademicRecords(): StudentAcademicRecord[] {
  const records: StudentAcademicRecord[] = [];

  MOCK_STUDENTS.forEach((student, index) => {
    // Base score tier based on position/cadre role
    let baseScore = 7.6;
    if (['HS01', 'HS03'].includes(student.maHS)) baseScore = 9.2; // LT, LP_HT
    else if (['HS02', 'HS04', 'HS12', 'HS23'].includes(student.maHS)) baseScore = 8.6; // BT, LP_LD, TTs
    else if (index % 5 === 0) baseScore = 8.8;
    else if (index % 4 === 0) baseScore = 8.2;
    else if (index % 3 === 0) baseScore = 7.8;
    else if (index % 2 === 0) baseScore = 7.4;
    else baseScore = 7.1;

    const subjectsRecord: Record<string, SubjectScore> = {};

    DEFAULT_SUBJECTS.forEach((subj, sIdx) => {
      if (subj.type === 'evaluate') {
        subjectsRecord[subj.id] = {
          subjectId: subj.id,
          tx: [],
          gk: null,
          ck: null,
          tb: null,
          evaluateResult: 'Đ',
          note: 'Hoàn thành tốt các nhiệm vụ môn học',
        };
        return;
      }

      // Small variation per subject
      const variation = ((sIdx * 7 + index * 13) % 15 - 7) / 10;
      let finalAvg = Math.min(10, Math.max(5.5, Math.round((baseScore + variation) * 10) / 10));

      // Build plausible component scores that average around finalAvg
      const tx1 = Math.min(10, Math.max(5, Math.round((finalAvg + 0.2) * 10) / 10));
      const tx2 = Math.min(10, Math.max(5, Math.round((finalAvg - 0.3) * 10) / 10));
      const tx3 = Math.min(10, Math.max(5, Math.round((finalAvg + 0.1) * 10) / 10));
      const gk = Math.min(10, Math.max(5, Math.round(finalAvg * 10) / 10));
      const ck = Math.min(10, Math.max(5, Math.round((finalAvg + 0.1) * 10) / 10));

      const computedTb = Math.round(((tx1 + tx2 + tx3 + gk * 2 + ck * 3) / 8) * 10) / 10;

      subjectsRecord[subj.id] = {
        subjectId: subj.id,
        tx: [tx1, tx2, tx3],
        gk,
        ck,
        tb: computedTb,
        note: computedTb >= 8.5 ? 'Nắm chắc kiến thức, tư duy tốt' : computedTb >= 7.0 ? 'Có cố gắng, chăm chỉ' : 'Cần tích cực ôn tập thêm',
      };
    });

    const gpa = calculateOverallGPA(subjectsRecord);
    const { hocLuc, danhHieu } = evaluateAcademicStanding(subjectsRecord, gpa);

    records.push({
      maHS: student.maHS,
      hoTen: student.hoTen,
      to: student.to,
      hocKi: 1,
      namHoc: '2026-2027',
      subjects: subjectsRecord,
      diemTBChung: gpa,
      hocLuc,
      danhHieu,
      nhanXetGVCN: gpa && gpa >= 8.5 
        ? 'Ý thức học tập xuất sắc, tích cực tham gia phát biểu và rèn luyện gương mẫu.'
        : gpa && gpa >= 7.5
          ? 'Ngoan ngoãn, chăm học, kết quả học tập tiến bộ đều các môn.'
          : 'Cần phân bổ thêm thời gian tự học ở nhà và chú ý các môn tự nhiên.',
      ngayCapNhat: '2026-11-09T08:00:00Z',
    });
  });

  return records;
}

/**
 * Lấy danh sách điểm từ LocalStorage hoặc sinh ban đầu
 */
export function getAcademicRecords(): StudentAcademicRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACADEMIC_GRADES);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading academic records from localStorage:', e);
  }
  const initial = generateInitialAcademicRecords();
  saveAcademicRecords(initial);
  return initial;
}

/**
 * Lưu danh sách điểm vào LocalStorage
 */
export function saveAcademicRecords(records: StudentAcademicRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACADEMIC_GRADES, JSON.stringify(records));
  } catch (e) {
    console.error('Error saving academic records to localStorage:', e);
  }
}

/**
 * Khôi phục lại dữ liệu điểm mẫu chuẩn
 */
export function resetAcademicRecords(): StudentAcademicRecord[] {
  const initial = generateInitialAcademicRecords();
  saveAcademicRecords(initial);
  return initial;
}

/**
 * Xuất file mẫu Excel (.xlsx) chuẩn để GV nhập điểm
 */
export function exportGradeTemplate(): void {
  const wb = XLSX.utils.book_new();

  // Create Header Row
  const headers = [
    'STT',
    'Mã học sinh',
    'Họ và tên',
    'Tổ',
    // Scored subjects
    'Toán (TX1)', 'Toán (TX2)', 'Toán (TX3)', 'Toán (GK)', 'Toán (CK)', 'Toán (ĐTB)',
    'Ngữ văn (TX1)', 'Ngữ văn (TX2)', 'Ngữ văn (TX3)', 'Ngữ văn (GK)', 'Ngữ văn (CK)', 'Ngữ văn (ĐTB)',
    'Tiếng Anh (TX1)', 'Tiếng Anh (TX2)', 'Tiếng Anh (TX3)', 'Tiếng Anh (GK)', 'Tiếng Anh (CK)', 'Tiếng Anh (ĐTB)',
    'Vật lí (TX1)', 'Vật lí (GK)', 'Vật lí (CK)', 'Vật lí (ĐTB)',
    'Hóa học (TX1)', 'Hóa học (GK)', 'Hóa học (CK)', 'Hóa học (ĐTB)',
    'Sinh học (TX1)', 'Sinh học (GK)', 'Sinh học (CK)', 'Sinh học (ĐTB)',
    'Lịch sử (ĐTB)',
    'Địa lí (ĐTB)',
    'GDKT & PL (ĐTB)',
    'Tin học (ĐTB)',
    'Công nghệ (ĐTB)',
    'GDQP-AN (ĐTB)',
    'GDTC (Đ/CĐ)',
    'HĐTN-HN (Đ/CĐ)',
    'Nhận xét GVCN',
  ];

  const rows: any[] = [headers];

  // Pre-fill all 42 students
  MOCK_STUDENTS.forEach((st, idx) => {
    rows.push([
      idx + 1,
      st.maHS,
      st.hoTen,
      `Tổ ${st.to}`,
      // Math sample
      8.5, 9.0, 8.5, 8.5, 9.0, 8.8,
      // Literature sample
      8.0, 8.5, 8.0, 8.0, 8.5, 8.2,
      // English sample
      8.5, 9.0, 9.0, 8.5, 9.0, 8.9,
      // Physics
      8.5, 8.5, 9.0, 8.8,
      // Chemistry
      8.0, 8.5, 8.5, 8.4,
      // Biology
      8.5, 8.5, 9.0, 8.8,
      // History, Geo, Civics, IT, Tech, Defense
      8.5, 8.6, 9.0, 9.0, 8.8, 9.0,
      // PE & Extracurricular
      'Đ', 'Đ',
      'Học tập chăm chỉ, tác phong tốt.',
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths
  ws['!cols'] = [
    { wch: 6 }, // STT
    { wch: 12 }, // MaHS
    { wch: 25 }, // HoTen
    { wch: 8 }, // To
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Bảng Điểm Mẫu Lớp 10A5');
  XLSX.writeFile(wb, 'Mau_Bang_Diem_Lop_10A5_THPT_So2_DucPho.xlsx');
}

/**
 * Xuất toàn bộ bảng điểm hiện tại của lớp ra file Excel (.xlsx)
 */
export function exportClassGrades(records: StudentAcademicRecord[], hocKi: 1 | 2 = 1): void {
  const wb = XLSX.utils.book_new();

  const headers = [
    'STT',
    'Mã học sinh',
    'Họ và tên',
    'Tổ',
    'Toán',
    'Ngữ văn',
    'Tiếng Anh',
    'Vật lí',
    'Hóa học',
    'Sinh học',
    'Lịch sử',
    'Địa lí',
    'GDKT & PL',
    'Tin học',
    'Công nghệ',
    'GDQP-AN',
    'GDTC',
    'HĐTN-HN',
    'ĐTB Chung',
    'Học lực',
    'Danh hiệu',
    'Nhận xét GVCN',
  ];

  const rows: any[] = [headers];

  records.forEach((rec, idx) => {
    rows.push([
      idx + 1,
      rec.maHS,
      rec.hoTen,
      rec.to,
      rec.subjects['toan']?.tb ?? '',
      rec.subjects['van']?.tb ?? '',
      rec.subjects['anh']?.tb ?? '',
      rec.subjects['ly']?.tb ?? '',
      rec.subjects['hoa']?.tb ?? '',
      rec.subjects['sinh']?.tb ?? '',
      rec.subjects['su']?.tb ?? '',
      rec.subjects['dia']?.tb ?? '',
      rec.subjects['gdcd']?.tb ?? '',
      rec.subjects['tin']?.tb ?? '',
      rec.subjects['cn']?.tb ?? '',
      rec.subjects['qp']?.tb ?? '',
      rec.subjects['td']?.evaluateResult ?? 'Đ',
      rec.subjects['hdtn']?.evaluateResult ?? 'Đ',
      rec.diemTBChung ?? '',
      rec.hocLuc ?? '',
      rec.danhHieu ?? '',
      rec.nhanXetGVCN ?? '',
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, `Bảng Điểm HK${hocKi}`);
  XLSX.writeFile(wb, `Bang_Diem_Hoc_Ky_${hocKi}_Lop_10A5.xlsx`);
}

/**
 * Đọc và phân tích file Excel bảng điểm tải lên từ Giáo viên
 */
export async function importGradesFromExcel(
  file: File,
  currentRecords: StudentAcademicRecord[],
  hocKi: 1 | 2 = 1
): Promise<{
  success: boolean;
  recordsCount: number;
  importedRecords: StudentAcademicRecord[];
  errors: string[];
}> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        if (workbook.SheetNames.length === 0) {
          resolve({
            success: false,
            recordsCount: 0,
            importedRecords: currentRecords,
            errors: ['File Excel không chứa bất kỳ sheet nào!'],
          });
          return;
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonRows.length < 2) {
          resolve({
            success: false,
            recordsCount: 0,
            importedRecords: currentRecords,
            errors: ['File Excel không có dữ liệu hàng học sinh (cần ít nhất 1 hàng tiêu đề và 1 hàng dữ liệu).'],
          });
          return;
        }

        // Row 0 is header
        const rawHeaders: string[] = (jsonRows[0] || []).map((h: any) => String(h || '').trim());
        const lowerHeaders = rawHeaders.map(h => h.toLowerCase());

        // Find index of essential columns
        const idxMaHS = lowerHeaders.findIndex(h => h.includes('mã') || h.includes('mahs') || h.includes('id'));
        const idxHoTen = lowerHeaders.findIndex(h => h.includes('tên') || h.includes('họ') || h.includes('name'));

        // Map column indexes for subjects
        const subjectColMap: Record<string, {
          tx: number[];
          gk?: number;
          ck?: number;
          tb?: number;
          evalCol?: number;
        }> = {};

        DEFAULT_SUBJECTS.forEach(subj => {
          subjectColMap[subj.id] = { tx: [] };
        });

        // Scan headers for subject keywords
        lowerHeaders.forEach((colName, cIdx) => {
          if (cIdx === idxMaHS || cIdx === idxHoTen) return;

          // Helper to check subject
          const matchSubj = (keywords: string[]) => keywords.some(k => colName.includes(k));

          let targetSubjId: string | null = null;
          if (matchSubj(['toán', 'toan', 'math'])) targetSubjId = 'toan';
          else if (matchSubj(['văn', 'ngữ văn', 'van', 'literature'])) targetSubjId = 'van';
          else if (matchSubj(['tiếng anh', 'anh', 'english'])) targetSubjId = 'anh';
          else if (matchSubj(['vật lí', 'vật lý', 'lí', 'ly', 'physics'])) targetSubjId = 'ly';
          else if (matchSubj(['hóa', 'hóa học', 'hoa', 'chemistry'])) targetSubjId = 'hoa';
          else if (matchSubj(['sinh', 'sinh học', 'biology'])) targetSubjId = 'sinh';
          else if (matchSubj(['lịch sử', 'sử', 'history'])) targetSubjId = 'su';
          else if (matchSubj(['địa lí', 'địa lý', 'địa', 'geography'])) targetSubjId = 'dia';
          else if (matchSubj(['gdcd', 'gdkt', 'pháp luật', 'kinh tế'])) targetSubjId = 'gdcd';
          else if (matchSubj(['tin', 'tin học', 'informatics', 'it'])) targetSubjId = 'tin';
          else if (matchSubj(['công nghệ', 'technology'])) targetSubjId = 'cn';
          else if (matchSubj(['quốc phòng', 'qp', 'an ninh', 'gdqp'])) targetSubjId = 'qp';
          else if (matchSubj(['thể chất', 'thể dục', 'gdtc', 'pe'])) targetSubjId = 'td';
          else if (matchSubj(['hướng nghiệp', 'trải nghiệm', 'hdtn', 'hđtn'])) targetSubjId = 'hdtn';

          if (targetSubjId) {
            const conf = subjectColMap[targetSubjId];
            if (colName.includes('tx') || colName.includes('miệng') || colName.includes('15p')) {
              conf.tx.push(cIdx);
            } else if (colName.includes('gk') || colName.includes('giữa kỳ') || colName.includes('giua ky')) {
              conf.gk = cIdx;
            } else if (colName.includes('ck') || colName.includes('cuối kỳ') || colName.includes('cuoi ky') || colName.includes('học kỳ')) {
              conf.ck = cIdx;
            } else if (colName.includes('đtb') || colName.includes('tb') || colName.includes('trung bình')) {
              conf.tb = cIdx;
            } else if (targetSubjId === 'td' || targetSubjId === 'hdtn') {
              conf.evalCol = cIdx;
            } else {
              // Default to TB column if not specified
              if (conf.tb === undefined) conf.tb = cIdx;
            }
          }
        });

        const newRecordsMap = new Map<string, StudentAcademicRecord>();
        // Pre-populate with current
        currentRecords.forEach(r => newRecordsMap.set(r.maHS, { ...r }));

        let updatedCount = 0;
        const errors: string[] = [];

        // Parse student data rows
        for (let r = 1; r < jsonRows.length; r++) {
          const row = jsonRows[r];
          if (!row || row.length === 0) continue;

          let maHS = idxMaHS !== -1 ? String(row[idxMaHS] || '').trim() : '';
          const hoTen = idxHoTen !== -1 ? String(row[idxHoTen] || '').trim() : '';

          // If maHS not provided, try to match by row index or student name
          if (!maHS && r - 1 < MOCK_STUDENTS.length) {
            maHS = MOCK_STUDENTS[r - 1].maHS;
          } else if (!maHS && hoTen) {
            const found = MOCK_STUDENTS.find(s => s.hoTen.toLowerCase() === hoTen.toLowerCase());
            if (found) maHS = found.maHS;
          }

          if (!maHS) continue;

          const existingRecord = newRecordsMap.get(maHS) || {
            maHS,
            hoTen: hoTen || (MOCK_STUDENTS.find(s => s.maHS === maHS)?.hoTen ?? `Học sinh ${maHS}`),
            to: MOCK_STUDENTS.find(s => s.maHS === maHS)?.to ?? 1,
            hocKi,
            namHoc: '2026-2027',
            subjects: {},
            diemTBChung: null,
            hocLuc: null,
            danhHieu: null,
            ngayCapNhat: new Date().toISOString(),
          };

          const updatedSubjects: Record<string, SubjectScore> = { ...existingRecord.subjects };

          DEFAULT_SUBJECTS.forEach(subj => {
            const cols = subjectColMap[subj.id];
            if (!cols) return;

            if (subj.type === 'evaluate') {
              let val = cols.evalCol !== undefined ? String(row[cols.evalCol] || '').trim().toUpperCase() : undefined;
              const evalRes: 'Đ' | 'CĐ' = val === 'CĐ' || val === 'CD' || val === 'K' ? 'CĐ' : 'Đ';
              updatedSubjects[subj.id] = {
                subjectId: subj.id,
                tx: [],
                gk: null,
                ck: null,
                tb: null,
                evaluateResult: evalRes,
              };
              return;
            }

            // Scored subject
            const txVals = cols.tx
              .map(cIdx => parseFloat(String(row[cIdx]).replace(',', '.')))
              .filter(v => !isNaN(v) && v >= 0 && v <= 10);

            const gkVal = cols.gk !== undefined ? parseFloat(String(row[cols.gk]).replace(',', '.')) : NaN;
            const ckVal = cols.ck !== undefined ? parseFloat(String(row[cols.ck]).replace(',', '.')) : NaN;
            const tbVal = cols.tb !== undefined ? parseFloat(String(row[cols.tb]).replace(',', '.')) : NaN;

            const validGk = !isNaN(gkVal) && gkVal >= 0 && gkVal <= 10 ? gkVal : null;
            const validCk = !isNaN(ckVal) && ckVal >= 0 && ckVal <= 10 ? ckVal : null;
            let validTb = !isNaN(tbVal) && tbVal >= 0 && tbVal <= 10 ? tbVal : null;

            // Compute TB if not directly specified
            if (validTb === null && (txVals.length > 0 || validGk !== null || validCk !== null)) {
              validTb = calculateSubjectAverage({
                tx: txVals,
                gk: validGk,
                ck: validCk,
              });
            }

            // Fallback to previous if row has no data for this subject
            if (validTb !== null || txVals.length > 0) {
              updatedSubjects[subj.id] = {
                subjectId: subj.id,
                tx: txVals.length > 0 ? txVals : (existingRecord.subjects[subj.id]?.tx || []),
                gk: validGk !== null ? validGk : (existingRecord.subjects[subj.id]?.gk ?? null),
                ck: validCk !== null ? validCk : (existingRecord.subjects[subj.id]?.ck ?? null),
                tb: validTb !== null ? validTb : (existingRecord.subjects[subj.id]?.tb ?? null),
              };
            }
          });

          // Recalculate GPA & Rank
          const gpa = calculateOverallGPA(updatedSubjects);
          const { hocLuc, danhHieu } = evaluateAcademicStanding(updatedSubjects, gpa);

          newRecordsMap.set(maHS, {
            ...existingRecord,
            hocKi,
            subjects: updatedSubjects,
            diemTBChung: gpa,
            hocLuc,
            danhHieu,
            ngayCapNhat: new Date().toISOString(),
          });

          updatedCount++;
        }

        const finalRecords = Array.from(newRecordsMap.values());
        saveAcademicRecords(finalRecords);

        resolve({
          success: true,
          recordsCount: updatedCount,
          importedRecords: finalRecords,
          errors,
        });
      } catch (err: any) {
        console.error('Error importing Excel:', err);
        resolve({
          success: false,
          recordsCount: 0,
          importedRecords: currentRecords,
          errors: [`Lỗi khi phân tích file Excel: ${err?.message || 'Định dạng file không hợp lệ'}`],
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        recordsCount: 0,
        importedRecords: currentRecords,
        errors: ['Lỗi khi đọc file từ ổ đĩa.'],
      });
    };

    reader.readAsArrayBuffer(file);
  });
}
