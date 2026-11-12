import { DisciplineRecord, StudentWeekSummary, TeacherSettings, WeekEvaluation, StatusColorLevel, SeverityLevel, RuleItem, ScoreRatingTier, RatingColorKey } from '../types';

export const RATING_COLOR_PALETTE: Record<
  RatingColorKey,
  { name: string; badge: string; text: string; dot: string; hex: string }
> = {
  emerald: {
    name: 'Xanh lá',
    badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    hex: '#10b981',
  },
  teal: {
    name: 'Xanh ngọc',
    badge: 'bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-500/30',
    text: 'text-teal-600 dark:text-teal-400',
    dot: 'bg-teal-500',
    hex: '#14b8a6',
  },
  sky: {
    name: 'Xanh dương',
    badge: 'bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/30',
    text: 'text-sky-600 dark:text-sky-400',
    dot: 'bg-sky-500',
    hex: '#0284c7',
  },
  indigo: {
    name: 'Xanh chàm',
    badge: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30',
    text: 'text-indigo-600 dark:text-indigo-400',
    dot: 'bg-indigo-500',
    hex: '#4f46e5',
  },
  purple: {
    name: 'Tím',
    badge: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30',
    text: 'text-purple-600 dark:text-purple-400',
    dot: 'bg-purple-500',
    hex: '#9333ea',
  },
  amber: {
    name: 'Vàng cam',
    badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30',
    text: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
    hex: '#f59e0b',
  },
  orange: {
    name: 'Cam đậm',
    badge: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-500/30',
    text: 'text-orange-600 dark:text-orange-400',
    dot: 'bg-orange-500',
    hex: '#ea580c',
  },
  rose: {
    name: 'Đỏ',
    badge: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30',
    text: 'text-rose-600 dark:text-rose-400',
    dot: 'bg-rose-500',
    hex: '#e11d48',
  },
  slate: {
    name: 'Xám',
    badge: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30',
    text: 'text-slate-600 dark:text-slate-400',
    dot: 'bg-slate-500',
    hex: '#64748b',
  },
};

export const RATING_PRESETS: Record<string, { label: string; description: string; tiers: ScoreRatingTier[] }> = {
  default_4: {
    label: 'Chuẩn 4 mức (Mặc định)',
    description: 'Tốt (≥90đ) · Khá (≥75đ) · Đạt (≥60đ) · Cần cố gắng (<60đ)',
    tiers: [
      { id: 'Tot', label: 'Tốt', minScore: 90, color: 'emerald', icon: '🌟' },
      { id: 'Kha', label: 'Khá', minScore: 75, color: 'sky', icon: '🚀' },
      { id: 'Dat', label: 'Đạt', minScore: 60, color: 'amber', icon: '⚠️' },
      { id: 'ChuaDat', label: 'Cần cố gắng', minScore: 0, color: 'rose', icon: '❗' },
    ],
  },
  detailed_6: {
    label: 'Chia nhỏ 6 mức chi tiết',
    description: 'Xuất sắc (≥98đ) · Tốt (≥90đ) · Khá giỏi (≥82đ) · Khá (≥75đ) · Trung bình (≥60đ) · Cần cố gắng (<60đ)',
    tiers: [
      { id: 'XuatSac', label: 'Xuất sắc', minScore: 98, color: 'purple', icon: '🏆' },
      { id: 'Tot', label: 'Tốt', minScore: 90, color: 'emerald', icon: '🌟' },
      { id: 'KhaGioi', label: 'Khá giỏi', minScore: 82, color: 'teal', icon: '✨' },
      { id: 'Kha', label: 'Khá', minScore: 75, color: 'sky', icon: '🚀' },
      { id: 'Dat', label: 'Trung bình', minScore: 60, color: 'amber', icon: '⚠️' },
      { id: 'ChuaDat', label: 'Cần cố gắng', minScore: 0, color: 'rose', icon: '❗' },
    ],
  },
  detailed_5: {
    label: 'Chia 5 mức (Có Xuất sắc)',
    description: 'Xuất sắc (≥95đ) · Tốt (≥85đ) · Khá (≥75đ) · Đạt (≥60đ) · Chưa đạt (<60đ)',
    tiers: [
      { id: 'XuatSac', label: 'Xuất sắc', minScore: 95, color: 'indigo', icon: '💎' },
      { id: 'Tot', label: 'Tốt', minScore: 85, color: 'emerald', icon: '🌟' },
      { id: 'Kha', label: 'Khá', minScore: 75, color: 'sky', icon: '🚀' },
      { id: 'Dat', label: 'Đạt', minScore: 60, color: 'amber', icon: '⚠️' },
      { id: 'ChuaDat', label: 'Chưa đạt', minScore: 0, color: 'rose', icon: '❗' },
    ],
  },
  compact_3: {
    label: 'Tinh gọn 3 mức',
    description: 'Hoàn thành tốt (≥85đ) · Hoàn thành (≥65đ) · Cần cố gắng (<65đ)',
    tiers: [
      { id: 'Tot', label: 'Hoàn thành tốt', minScore: 85, color: 'emerald', icon: '🌟' },
      { id: 'Dat', label: 'Hoàn thành', minScore: 65, color: 'sky', icon: '👍' },
      { id: 'ChuaDat', label: 'Cần cố gắng', minScore: 0, color: 'rose', icon: '❗' },
    ],
  },
};

/**
 * Lấy danh sách các mức phân loại thi đua theo điểm (đã sắp xếp từ điểm cao xuống thấp)
 */
export function getScoreRatingTiers(settings?: TeacherSettings): ScoreRatingTier[] {
  if (settings?.phanLoaiDiem && Array.isArray(settings.phanLoaiDiem) && settings.phanLoaiDiem.length >= 2) {
    const sorted = [...settings.phanLoaiDiem]
      .map((t, idx) => ({
        id: String(t.id || `tier_${idx}`),
        label: String(t.label || `Mức ${idx + 1}`).trim() || `Mức ${idx + 1}`,
        minScore: Number.isFinite(Number(t.minScore)) ? Math.max(0, Number(t.minScore)) : 0,
        color: (RATING_COLOR_PALETTE[t.color as RatingColorKey] ? t.color : 'sky') as RatingColorKey,
        icon: t.icon ?? '',
      }))
      .sort((a, b) => b.minScore - a.minScore);
    // Đảm bảo mức cuối cùng luôn bao phủ từ 0 điểm
    sorted[sorted.length - 1] = {
      ...sorted[sorted.length - 1],
      minScore: 0,
    };
    return sorted;
  }

  const nguongTot = Number.isFinite(Number(settings?.nguongTot)) ? Number(settings!.nguongTot) : 90;
  const nguongKha = Number.isFinite(Number(settings?.nguongKha)) ? Number(settings!.nguongKha) : 75;
  const nguongDat = Number.isFinite(Number(settings?.nguongDat)) ? Number(settings!.nguongDat) : 60;

  const defaultTiers: ScoreRatingTier[] = [
    { id: 'Tot', label: 'Tốt', minScore: nguongTot, color: 'emerald', icon: '🌟' },
    { id: 'Kha', label: 'Khá', minScore: nguongKha, color: 'sky', icon: '🚀' },
    { id: 'Dat', label: 'Đạt', minScore: nguongDat, color: 'amber', icon: '⚠️' },
    { id: 'ChuaDat', label: 'Cần cố gắng', minScore: 0, color: 'rose', icon: '❗' },
  ];
  return defaultTiers.sort((a, b) => b.minScore - a.minScore);
}

/**
 * Xác định mức phân loại thi đua tương ứng với số điểm
 */
export function evaluateScoreTier(score: number, settings?: TeacherSettings): ScoreRatingTier {
  const tiers = getScoreRatingTiers(settings);
  const numScore = Number.isFinite(Number(score)) ? Number(score) : 0;
  for (const tier of tiers) {
    if (numScore >= tier.minScore) {
      return tier;
    }
  }
  return tiers[tiers.length - 1];
}

/**
 * Tra cứu thông tin phân loại (tên, màu, icon) từ mã xepLoai hoặc điểm số
 */
export function getRatingTierInfo(
  xepLoaiId: string | undefined,
  score: number,
  settings?: TeacherSettings
): ScoreRatingTier {
  const tiers = getScoreRatingTiers(settings);
  if (xepLoaiId) {
    const found = tiers.find(t => t.id === xepLoaiId || t.label === xepLoaiId);
    if (found) return found;
  }
  return evaluateScoreTier(score, settings);
}

export function getRatingColorClasses(color?: RatingColorKey) {
  const base = RATING_COLOR_PALETTE[color || 'sky'] || RATING_COLOR_PALETTE.sky;
  return {
    ...base,
    badgeBg: base.badge,
    badgeText: base.text,
    badgeBorder: '',
  };
}

/**
 * Chuỗi mô tả ngắn gọn các mức xếp loại hiện hành
 */
export function formatRatingTiersSummary(settings?: TeacherSettings): string {
  const tiers = getScoreRatingTiers(settings);
  return tiers
    .map((t, idx) => {
      if (idx === tiers.length - 1 && tiers.length > 1) {
        const prevMin = tiers[idx - 1].minScore;
        return `${t.label} (<${prevMin}đ)`;
      }
      return `${t.label} (≥${t.minScore}đ)`;
    })
    .join(', ');
}

export const STANDARD_RULE_CATEGORIES = [
  'Học tập',
  'Hoạt động/Lao động',
  'Tác phong',
  'Nề nếp/Đạo đức',
] as const;

export type StandardRuleCategory = (typeof STANDARD_RULE_CATEGORIES)[number] | 'Điểm cộng';

/**
 * Chuẩn hóa tên nhóm hành vi / nhóm vi phạm về đúng 4 nhóm chuẩn:
 * - Học tập
 * - Hoạt động/Lao động
 * - Tác phong
 * - Nề nếp/Đạo đức
 * (Và "Điểm cộng" đối với các hành vi cộng điểm thưởng)
 */
export function normalizeRuleCategory(
  rawGroup?: string,
  tenHanhVi?: string,
  loaiDiem?: 'Tru' | 'Cong'
): string {
  const norm = (s?: string) =>
    String(s || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/\s+/g, ' ');

  const g = norm(rawGroup);
  const b = norm(tenHanhVi);

  if (
    loaiDiem === 'Cong' ||
    g.includes('diem cong') ||
    g.includes('khen thuong') ||
    g.includes('tuyen duong') ||
    g === 'cong' ||
    g === 'thuong'
  ) {
    return 'Điểm cộng';
  }

  // 1. Nếu tên nhóm nhập vào đã khớp rõ với 4 phân loại mới
  if (g === 'hoat dong/lao dong' || g.includes('hoat dong') || g.includes('lao dong') || g.includes('phong trao') || g.includes('ve sinh') || g.includes('truc nhat')) {
    return 'Hoạt động/Lao động';
  }
  if (g === 'tac phong' || g.includes('tac phong') || g.includes('dong phuc') || g.includes('trang phuc')) {
    return 'Tác phong';
  }
  if (g === 'ne nep/dao duc' || g.includes('dao duc')) {
    return 'Nề nếp/Đạo đức';
  }
  if (g === 'hoc tap' || g.includes('hoc tap') || g.includes('bai tap') || g.includes('kiem tra')) {
    return 'Học tập';
  }

  // 2. Phân loại thông minh theo nội dung hành vi (bao gồm cả dữ liệu cũ từ nhóm Chuyên cần / Nề nếp cũ)
  if (
    b.includes('dong phuc') ||
    b.includes('trang phuc') ||
    b.includes('phu hieu') ||
    b.includes('the hoc sinh') ||
    b.includes('bang ten') ||
    b.includes('khan quang') ||
    b.includes('nhuom toc') ||
    b.includes('dau toc') ||
    b.includes('mong tay') ||
    b.includes('trang diem') ||
    b.includes('tac phong') ||
    b.includes('di muon') ||
    b.includes('di hoc muon') ||
    b.includes('vao lop tre') ||
    b.includes('tre gio')
  ) {
    return 'Tác phong';
  }

  if (
    b.includes('hoat dong') ||
    b.includes('phong trao') ||
    b.includes('lao dong') ||
    b.includes('ve sinh') ||
    b.includes('truc nhat') ||
    b.includes('rac') ||
    b.includes('quet lop') ||
    b.includes('lau bang') ||
    b.includes('chao co') ||
    b.includes('sinh hoat') ||
    b.includes('quoc ca') ||
    b.includes('the duc') ||
    b.includes('chi doan') ||
    b.includes('doan') ||
    b.includes('ngoai khoa') ||
    b.includes('van nghe') ||
    b.includes('the thao') ||
    b.includes('tat quat') ||
    b.includes('tat den')
  ) {
    return 'Hoạt động/Lao động';
  }

  if (
    b.includes('bai tap') ||
    b.includes('sach vo') ||
    b.includes('dung cu') ||
    b.includes('ghi chep') ||
    b.includes('gian lan') ||
    b.includes('kiem tra') ||
    b.includes('thi cu') ||
    b.includes('chuan bi bai') ||
    b.includes('thuoc bai') ||
    b.includes('phu dao') ||
    b.includes('vang tiet') ||
    b.includes('tron tiet') ||
    b.includes('bo tiet') ||
    b.includes('bo gio') ||
    b.includes('nghi hoc') ||
    b.includes('vang hoc') ||
    b.includes('trong gio hoc')
  ) {
    return 'Học tập';
  }

  return 'Nề nếp/Đạo đức';
}

/**
 * Chuẩn hóa toàn bộ danh sách nội quy để nhóm hành vi và mức độ luôn đồng bộ
 */
export function normalizeRulesList(rules: RuleItem[]): RuleItem[] {
  if (!Array.isArray(rules)) return [];
  return rules.map((r, idx) => {
    const loaiDiem = r.loaiDiem === 'Cong' ? 'Cong' : 'Tru';
    const diemSo = Math.max(1, Math.abs(Number(r.diemSo) || 2));
    return {
      ...r,
      nhomHanhVi: normalizeRuleCategory(r.nhomHanhVi, r.tenHanhVi, loaiDiem),
      loaiDiem,
      diemSo,
      mucDo: classifySeverityByPoints(diemSo, loaiDiem === 'Cong', r.mucDo),
      thuTu: r.thuTu || idx + 1,
    };
  });
}

export function normalizeStudentName(name?: string): string {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function isRecordMatchingStudent(
  rec: DisciplineRecord,
  maHS: string,
  hoTen?: string
): boolean {
  if (!rec) return false;
  if (rec.maHS && maHS && String(rec.maHS).trim().toLowerCase() === String(maHS).trim().toLowerCase()) {
    return true;
  }
  if (hoTen && rec.hoTen) {
    const normStudent = normalizeStudentName(hoTen);
    const normRec = normalizeStudentName(rec.hoTen);
    if (normStudent && normRec && normStudent === normRec) {
      return true;
    }
  }
  return false;
}

export function parseRecordPoints(rec: DisciplineRecord): { isBonus: boolean; points: number } {
  const rawScore = Number(rec.diemSo);
  const absPoints = Number.isFinite(rawScore) ? Math.abs(rawScore) : 0;
  const rawType = String(rec.loaiDiem || '').trim().toLowerCase();

  const isBonus =
    rawType === 'cong' ||
    rawType === 'cộng' ||
    rawType === 'bonus' ||
    rawType === '+' ||
    (rawType === '' && rawScore > 0 && String(rec.maNoiQuy || '').toUpperCase().startsWith('KT'));

  return {
    isBonus,
    points: absPoints,
  };
}

/**
 * Chuẩn hóa chuỗi văn bản để đối chiếu tên hành vi nội quy
 */
function normalizeRuleText(text?: string): string {
  return String(text || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ');
}

/**
 * Xác định mức độ vi phạm (Nhẹ / Vừa / Nặng) căn cứ vào:
 * 1. Quy định trong file nhập vào (nếu cột Mức độ có ghi rõ Nhẹ / Vừa / Nặng)
 * 2. Điểm trừ của hành vi:
 *    - Điểm cộng: luôn là 'Nhe' (không phải lỗi)
 *    - Điểm trừ >= 5 điểm: 'Nang' (Nặng)
 *    - Điểm trừ từ 3 đến 4 điểm: 'Vua' (Vừa)
 *    - Điểm trừ từ 1 đến 2 điểm: 'Nhe' (Nhẹ)
 */
export function classifySeverityByPoints(
  points: number,
  isBonus = false,
  explicitSeverityText?: string
): SeverityLevel {
  if (isBonus) return 'Nhe';

  if (explicitSeverityText) {
    const norm = normalizeRuleText(explicitSeverityText);
    if (norm === 'nang' || norm.includes('muc nang') || norm === 'severe' || norm === 'high') {
      return 'Nang';
    }
    if (norm === 'vua' || norm.includes('trung binh') || norm.includes('muc vua') || norm === 'medium') {
      return 'Vua';
    }
    if (norm === 'nhe' || norm.includes('muc nhe') || norm === 'low') {
      return 'Nhe';
    }
  }

  const absPoints = Math.abs(Number(points) || 0);
  if (absPoints >= 5) return 'Nang';
  if (absPoints >= 3) return 'Vua';
  return 'Nhe';
}

/**
 * Tìm quy định trong danh mục Nội quy lớp (do GV nhập vào hoặc thiết lập) khớp với mã hoặc tên hành vi
 */
export function findMatchingRule(
  rules: RuleItem[] | undefined,
  maNoiQuy?: string,
  tenHanhVi?: string,
  loaiDiem?: 'Tru' | 'Cong'
): RuleItem | undefined {
  if (!Array.isArray(rules) || rules.length === 0) return undefined;

  const cleanCode = String(maNoiQuy || '').trim().toUpperCase();
  if (
    cleanCode &&
    cleanCode !== 'NQ_VIPHAM' &&
    cleanCode !== 'NQ_CONG' &&
    !cleanCode.startsWith('NQ_CUSTOM_')
  ) {
    const byCode = rules.find(r => String(r.maNoiQuy || '').trim().toUpperCase() === cleanCode);
    if (byCode) return byCode;
  }

  const normName = normalizeRuleText(tenHanhVi);
  if (!normName) return undefined;

  return rules.find(r => {
    if (loaiDiem && r.loaiDiem !== loaiDiem) return false;
    return normalizeRuleText(r.tenHanhVi) === normName;
  });
}

/**
 * Xác định mức độ vi phạm thực tế của một bản ghi nề nếp:
 * - Căn cứ vào quy định của danh mục Nội quy lớp (nếu khớp quy định và cùng mức điểm trừ)
 * - Và căn cứ vào số điểm trừ thực tế của bản ghi (không mặc định cứng)
 */
export function resolveRecordSeverity(
  rec: DisciplineRecord,
  rules?: RuleItem[]
): SeverityLevel {
  const { isBonus, points } = parseRecordPoints(rec);
  if (isBonus) return 'Nhe';

  const matchedRule = findMatchingRule(rules, rec.maNoiQuy, rec.tenHanhVi, 'Tru');
  if (matchedRule && Number(matchedRule.diemSo) === points && matchedRule.mucDo) {
    return matchedRule.mucDo;
  }

  return classifySeverityByPoints(points, false);
}

export function isRecordWithinScoringMilestone(
  rec: DisciplineRecord,
  _settings?: TeacherSettings
): boolean {
  if (!rec) return false;
  // Theo quy tắc chuẩn: Chỉ các tuần GV đánh dấu nghỉ (noDataWeeks) mới không tính điểm;
  // các tuần khác đều tính điểm trừ/cộng bình thường để đồng nhất 100% giữa sổ chi tiết và bảng xếp hạng.
  return true;
}

export function formatEditTimeLimit(minutes?: number): string {
  const m = Number(minutes ?? 0);
  if (!Number.isFinite(m) || m <= 0) return 'Không giới hạn';
  if (m < 60) return `${m} phút`;
  if (m % 1440 === 0) {
    const days = m / 1440;
    return days === 1 ? '24 giờ (1 ngày)' : `${days} ngày`;
  }
  return `${Math.round((m / 60) * 10) / 10} giờ`;
}

export function isWithinEditTimeLimit(recordIsoTime?: string, limitMinutes?: number): boolean {
  const m = Number(limitMinutes ?? 0);
  if (!Number.isFinite(m) || m <= 0) return true; // <= 0 nghĩa là Không giới hạn thời gian
  if (!recordIsoTime) return true;
  const recordMs = new Date(recordIsoTime).getTime();
  if (!Number.isFinite(recordMs)) return true;
  const nowMs = Date.now();
  return nowMs <= recordMs + m * 60 * 1000;
}

export function getRemainingEditTimeLabel(recordIsoTime?: string, limitMinutes?: number): string {
  const m = Number(limitMinutes ?? 0);
  if (!Number.isFinite(m) || m <= 0) return 'Không giới hạn';
  if (!recordIsoTime) return 'Không giới hạn';
  const recordMs = new Date(recordIsoTime).getTime();
  if (!Number.isFinite(recordMs)) return 'Không giới hạn';
  const diffMs = recordMs + m * 60 * 1000 - Date.now();
  if (diffMs <= 0) return `Đã hết hạn (${formatEditTimeLimit(m)})`;
  const diffMinutes = Math.ceil(diffMs / (60 * 1000));
  if (diffMinutes < 60) return `Còn ${diffMinutes} phút`;
  const diffHours = Math.ceil(diffMs / (60 * 60 * 1000));
  if (diffHours <= 48) return `Còn ${diffHours}h`;
  const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  return `Còn ${diffDays} ngày`;
}

export function isWithinExplanationDayLimit(recordIsoTimeOrDate?: string, limitDays?: number): boolean {
  const d = Number(limitDays ?? 0);
  if (!Number.isFinite(d) || d <= 0) return true; // <= 0 nghĩa là Không giới hạn
  if (!recordIsoTimeOrDate) return true;
  const recordMs = new Date(recordIsoTimeOrDate).getTime();
  if (!Number.isFinite(recordMs)) return true;
  return Date.now() <= recordMs + d * 24 * 60 * 60 * 1000;
}

export function calculateStudentWeekSummary(
  maHS: string,
  hoTen: string,
  to: number,
  tuanHoc: number,
  records: DisciplineRecord[],
  settings: TeacherSettings,
  currentWeek?: number,
  rules?: RuleItem[]
): StudentWeekSummary {
  const targetWeek = Number(tuanHoc);
  const noDataWeeks = (settings.noDataWeeks || []).map(Number);
  const isFutureWeek = currentWeek !== undefined && targetWeek > Number(currentWeek);
  const isNoDataWeek = noDataWeeks.includes(targetWeek);
  const topTier = getScoreRatingTiers(settings)[0];

  if (isFutureWeek || isNoDataWeek) {
    return {
      maHS,
      hoTen,
      to,
      tuanHoc: targetWeek,
      diemKhoiDau: settings.diemKhoiDau,
      tongDiemTru: 0,
      tongDiemCong: 0,
      diemHienTai: settings.diemKhoiDau,
      xepLoai: topTier?.id || 'Tot',
      mucMau: 'none',
      soLoiTrongTuan: 0,
      coLoiNang: false,
      chuaCoDiem: true,
      lyDoChuaCoDiem: isFutureWeek ? 'future' : 'no_data',
    };
  }

  // Lọc bản ghi của học sinh trong tuần
  const studentRecords = records.filter(r => 
    isRecordMatchingStudent(r, maHS, hoTen) &&
    Number(r.tuanHoc) === targetWeek &&
    r.trangThai !== 'DaHuy' &&
    r.trangThai !== 'DaChapNhan' // Bản ghi đã chấp nhận giải trình thì không tính điểm
  );

  let tongDiemTru = 0;
  let tongDiemCong = 0;
  let coLoiNang = false;

  studentRecords.forEach(rec => {
    const { isBonus, points } = parseRecordPoints(rec);
    if (!isBonus) {
      tongDiemTru += points;
      if (resolveRecordSeverity(rec, rules) === 'Nang') {
        coLoiNang = true;
      }
    } else if (settings.batDiemCong) {
      tongDiemCong += points;
    }
  });

  const diemHienTai = Math.max(0, settings.diemKhoiDau - tongDiemTru + tongDiemCong);

  // Xếp loại cá nhân linh hoạt theo danh sách phân loại điểm của Giáo viên
  const matchedTier = evaluateScoreTier(diemHienTai, settings);
  const xepLoai: WeekEvaluation = matchedTier.id;

  // Mức màu trạng thái viền sơ đồ
  let mucMau: StatusColorLevel = 'none';
  if (settings.batDiemCong && tongDiemCong > tongDiemTru && tongDiemTru === 0) {
    mucMau = 'ok';
  } else if (tongDiemTru >= 10 || coLoiNang) {
    mucMau = 'bad';
  } else if (tongDiemTru > 0) {
    mucMau = 'warn';
  } else {
    mucMau = 'none';
  }

  return {
    maHS,
    hoTen,
    to,
    tuanHoc: targetWeek,
    diemKhoiDau: settings.diemKhoiDau,
    tongDiemTru,
    tongDiemCong,
    diemHienTai,
    xepLoai,
    mucMau,
    soLoiTrongTuan: studentRecords.length,
    coLoiNang,
    chuaCoDiem: false,
  };
}

export function getCurrentSession(): 'Sang' | 'Chieu' {
  const hour = new Date().getHours();
  // Buổi sáng: 06:30 -> 12:00, Buổi chiều: 12:00 -> 18:00
  return hour < 12 ? 'Sang' : 'Chieu';
}

export function checkDuplicateRecord(
  records: DisciplineRecord[],
  maHS: string,
  ngayHoc: string,
  buoi: 'Sang' | 'Chieu',
  maNoiQuy: string
): {
  isDuplicate: boolean;
  isIdentical: boolean;
  existingRecords: DisciplineRecord[];
  lanThu: number;
} {
  const existing = records.filter(
    r => r.maHS === maHS &&
         r.ngayHoc === ngayHoc &&
         r.buoi === buoi &&
         r.trangThai !== 'DaHuy'
  );

  if (existing.length === 0) {
    return {
      isDuplicate: false,
      isIdentical: false,
      existingRecords: [],
      lanThu: 1
    };
  }

  const isIdentical = existing.some(r => r.maNoiQuy === maNoiQuy);

  return {
    isDuplicate: true,
    isIdentical,
    existingRecords: existing,
    lanThu: existing.length + 1
  };
}

/**
 * Thuật toán xếp hạng thi đua chuẩn (Standard Competition Ranking - 1224):
 * - Học sinh có cùng số điểm sẽ có cùng một thứ hạng (Đồng hạng).
 * - Học sinh có mức điểm thấp hơn tiếp theo sẽ xếp ở vị trí bằng (tổng số học sinh xếp trên + 1).
 *   Ví dụ: Có 10 học sinh đạt 100đ (cùng xếp Hạng 1) thì học sinh đạt 98đ kế tiếp sẽ xếp Hạng 11.
 * - Nếu cùng điểm: thứ tự hiển thị ưu tiên người ít bị trừ điểm hơn -> nhiều điểm cộng hơn -> thứ tự bảng chữ cái tiếng Việt.
 */
export function calculateDenseRankings<T extends { student: { hoTen: string } }>(
  items: T[],
  getScore: (item: T) => number,
  getDeductions?: (item: T) => number,
  getBonuses?: (item: T) => number
): Array<T & { officialRank: number; isTied: boolean; tieCount: number }> {
  // 1. Sắp xếp danh sách
  const sorted = [...items].sort((a, b) => {
    const scoreA = getScore(a);
    const scoreB = getScore(b);
    if (scoreB !== scoreA) return scoreB - scoreA;

    if (getDeductions) {
      const dedA = getDeductions(a);
      const dedB = getDeductions(b);
      if (dedA !== dedB) return dedA - dedB; // Ít trừ điểm hơn xếp trên
    }

    if (getBonuses) {
      const bonA = getBonuses(a);
      const bonB = getBonuses(b);
      if (bonB !== bonA) return bonB - bonA; // Nhiều điểm cộng hơn xếp trên
    }

    return a.student.hoTen.localeCompare(b.student.hoTen, 'vi');
  });

  // 2. Đếm số lượng học sinh trùng từng mức điểm
  const scoreFrequency = new Map<number, number>();
  for (const item of sorted) {
    const s = getScore(item);
    scoreFrequency.set(s, (scoreFrequency.get(s) || 0) + 1);
  }

  // 3. Gán thứ hạng chuẩn: nếu có N học sinh đồng hạng phía trên thì người tiếp theo có điểm thấp hơn xếp hạng N + 1 (idx + 1)
  let currentRank = 1;
  return sorted.map((item, idx) => {
    const currentScore = getScore(item);
    if (idx > 0) {
      const prevScore = getScore(sorted[idx - 1]);
      if (currentScore < prevScore) {
        currentRank = idx + 1;
      }
    }
    const count = scoreFrequency.get(currentScore) || 1;
    return {
      ...item,
      officialRank: currentRank,
      isTied: count > 1,
      tieCount: count,
    };
  });
}

