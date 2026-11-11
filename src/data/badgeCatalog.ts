import { BadgeIconType } from '../components/common/BadgeEmblem';
import {
  Student,
  DisciplineRecord,
  StudentAcademicRecord,
  TeacherSettings,
  RoleCode,
} from '../types';
import {
  isRecordMatchingStudent,
  parseRecordPoints,
  calculateDenseRankings,
} from '../utils/emulation';

export type BadgeCategory = 'discipline' | 'academic' | 'movement' | 'cadre';

export type BadgeAutoConditionType =
  | 'min_week_score'        // Đạt điểm tuần >= X trong ít nhất N tuần (kể từ mốc tính điểm)
  | 'zero_violations_weeks' // 0 lỗi vi phạm trong ít nhất N tuần (kể từ mốc tính điểm)
  | 'no_group_violation'    // Không vi phạm nhóm/từ khóa lỗi cụ thể trong ít nhất N tuần
  | 'min_avg_score'         // Điểm trung bình nề nếp các tuần >= X điểm
  | 'top_rank'              // Đạt Top X Bảng xếp hạng thi đua lớp
  | 'min_bonus_points'      // Tổng điểm cộng tích lũy >= X điểm (hoặc >= N lượt khen thưởng)
  | 'min_gpa'               // Điểm trung bình các môn học (ĐTB học kỳ) >= X
  | 'min_subject_score'     // Có ít nhất N môn học đạt điểm TB >= X
  | 'is_cadre_role'         // Giữ chức vụ Cán sự / Cờ đỏ / Tổ trưởng & điểm TB nề nếp >= X
  | 'manual_only';          // Chỉ trao thủ công bởi GVCN

export interface BadgeAutoRule {
  enabled: boolean;
  conditionType: BadgeAutoConditionType;
  minScore?: number;          // VD: 100, 95, 90
  minWeeks?: number;          // Số tuần cần đạt kể từ mốc thời gian (VD: 1, 2, 4)
  violationKeyword?: string;  // Từ khóa nhóm/hành vi không được vi phạm (VD: 'muộn', 'đồng phục', 'vệ sinh', 'trật tự', 'nghỉ')
  maxRank?: number;           // Thứ hạng tối đa trên BXH (VD: 1, 3, 5, 10)
  minBonusPoints?: number;    // Điểm cộng tối thiểu (VD: 5, 10)
  minGpa?: number;            // ĐTB chung các môn (VD: 8.0, 8.5, 9.0)
  minSubjectScore?: number;   // Điểm môn tối thiểu (VD: 9.0, 9.5, 10.0)
  minSubjectCount?: number;   // Số môn đạt ngưỡng (VD: 1, 2, 3)
  requiredRole?: RoleCode | 'ANY_CADRE';
}

export interface AchievementBadge {
  id: string;
  name: string; // Tên huy hiệu (GV có thể sửa)
  iconType: BadgeIconType;
  category: BadgeCategory;
  categoryLabel: string;
  description: string; // Mô tả ngắn
  criteria: string; // Điều kiện trao hiển thị (GV có thể sửa hoặc tự sinh từ autoRule)
  accentColor: string;
  gradientBg: string;
  rarity: 'Phổ biến' | 'Hiếm' | 'Sử thi' | 'Huyền thoại';
  defaultAwarded?: boolean;
  autoRule?: BadgeAutoRule;
}

export const BADGE_CONDITION_TYPE_LABELS: Record<BadgeAutoConditionType, string> = {
  min_week_score: 'Điểm tuần đạt chuẩn (>= X điểm trong N tuần)',
  zero_violations_weeks: 'Không vi phạm lỗi nào (0 lỗi trong N tuần)',
  no_group_violation: 'Không vi phạm nhóm lỗi cụ thể trong N tuần',
  min_avg_score: 'Điểm trung bình nề nếp từ mốc thời gian >= X điểm',
  top_rank: 'Đạt Top Bảng xếp hạng thi đua (Top 1 / 3 / 5 / 10)',
  min_bonus_points: 'Tích lũy Điểm cộng / Tuyên dương >= X điểm',
  min_gpa: 'Điểm trung bình học tập (ĐTB các môn) >= X',
  min_subject_score: 'Có môn học đạt điểm tổng kết cao (>= X điểm)',
  is_cadre_role: 'Ban cán sự / Cờ đỏ / Tổ trưởng hoàn thành nhiệm vụ',
  manual_only: 'Trao thủ công (GVCN trực tiếp xét chọn)',
};

export function describeBadgeAutoRule(rule?: BadgeAutoRule): string {
  if (!rule || !rule.enabled || rule.conditionType === 'manual_only') {
    return 'Do Giáo viên chủ nhiệm trực tiếp xét duyệt và trao tặng.';
  }
  const weeks = Math.max(1, rule.minWeeks || 1);
  switch (rule.conditionType) {
    case 'min_week_score':
      return `Đạt từ ${rule.minScore ?? 100} điểm nề nếp/tuần trở lên trong ít nhất ${weeks} tuần (tính từ mốc thời gian GV chọn).`;
    case 'zero_violations_weeks':
      return `Không vi phạm bất kỳ lỗi nề nếp nào (0 lỗi) trong ít nhất ${weeks} tuần kể từ mốc tính điểm.`;
    case 'no_group_violation':
      return `Không vi phạm lỗi "${rule.violationKeyword || 'nội quy'}" trong ít nhất ${weeks} tuần kể từ mốc tính điểm.`;
    case 'min_avg_score':
      return `Điểm trung bình nề nếp các tuần đạt từ ${rule.minScore ?? 95} điểm trở lên (tính từ mốc thời gian GV chọn).`;
    case 'top_rank':
      return `Đạt Top ${rule.maxRank ?? 5} Bảng xếp hạng thi đua lớp (và đạt ít nhất ${rule.minScore ?? 90} điểm).`;
    case 'min_bonus_points':
      return `Tích lũy được từ +${rule.minBonusPoints ?? 5} điểm cộng tuyên dương trở lên kể từ mốc tính điểm.`;
    case 'min_gpa':
      return `Điểm trung bình chung các môn học (ĐTB) đạt từ ${(rule.minGpa ?? 8.0).toFixed(1)} trở lên.`;
    case 'min_subject_score':
      return `Có ít nhất ${rule.minSubjectCount ?? 1} môn học đạt điểm trung bình từ ${(rule.minSubjectScore ?? 9.0).toFixed(1)} trở lên.`;
    case 'is_cadre_role': {
      const roleName =
        rule.requiredRole === 'LT' ? 'Lớp trưởng' :
        rule.requiredRole === 'BT' ? 'Bí thư' :
        rule.requiredRole === 'PBT' ? 'Phó Bí thư' :
        rule.requiredRole === 'LP_HT' ? 'Lớp phó Học tập' :
        rule.requiredRole === 'LP_LD' ? 'Lớp phó Lao động' :
        rule.requiredRole === 'LP_VT' ? 'Lớp phó Văn thể' :
        rule.requiredRole === 'CD' ? 'Cờ đỏ' :
        rule.requiredRole === 'TT' ? 'Tổ trưởng' : 'Ban cán sự / Cờ đỏ / Tổ trưởng';
      return `Giữ chức vụ ${roleName} và duy trì điểm trung bình nề nếp >= ${rule.minScore ?? 90} điểm.`;
    }
    default:
      return 'Đạt tiêu chuẩn thi đua theo mốc thời gian do GVCN quy định.';
  }
}

export const DEFAULT_30_BADGES: AchievementBadge[] = [
  // --- NHÓM 1: KỶ LUẬT & CHUYÊN CẦN ---
  {
    id: 'b_iron_discipline',
    name: 'Kỷ Luật Thép',
    iconType: 'iron_discipline',
    category: 'discipline',
    categoryLabel: 'Kỷ luật & Chuyên cần',
    description: 'Giữ vững nề nếp hoàn hảo, không một lỗi vi phạm.',
    criteria: 'Đạt 100 điểm tuyệt đối trong ít nhất 2 tuần kể từ mốc tính điểm.',
    accentColor: '#10B981',
    gradientBg: 'from-emerald-500/15 via-teal-500/10 to-transparent',
    rarity: 'Huyền thoại',
    autoRule: {
      enabled: true,
      conditionType: 'min_week_score',
      minScore: 100,
      minWeeks: 2,
    },
  },
  {
    id: 'b_punctuality_hero',
    name: 'Chiến Thần Đúng Giờ',
    iconType: 'punctuality_hero',
    category: 'discipline',
    categoryLabel: 'Kỷ luật & Chuyên cần',
    description: 'Tác phong nhanh nhẹn, luôn có mặt đúng giờ đầu buổi học.',
    criteria: 'Không vi phạm lỗi đi muộn / trễ giờ trong ít nhất 2 tuần kể từ mốc tính điểm.',
    accentColor: '#06B6D4',
    gradientBg: 'from-cyan-500/15 via-blue-500/10 to-transparent',
    rarity: 'Hiếm',
    autoRule: {
      enabled: true,
      conditionType: 'no_group_violation',
      violationKeyword: 'muộn',
      minWeeks: 2,
    },
  },
  {
    id: 'b_neat_attire',
    name: 'Tác Phong Chuẩn Mực',
    iconType: 'neat_attire',
    category: 'discipline',
    categoryLabel: 'Kỷ luật & Chuyên cần',
    description: 'Trang phục chuẩn nội quy, đầu tóc gọn gàng, phù hiệu đầy đủ.',
    criteria: 'Không vi phạm lỗi đồng phục / tác phong trong ít nhất 1 tuần kể từ mốc tính điểm.',
    accentColor: '#3B82F6',
    gradientBg: 'from-blue-500/15 via-indigo-500/10 to-transparent',
    rarity: 'Phổ biến',
    autoRule: {
      enabled: true,
      conditionType: 'no_group_violation',
      violationKeyword: 'đồng phục',
      minWeeks: 1,
    },
  },
  {
    id: 'b_green_classroom',
    name: 'Hiệp Sĩ Không Gian Xanh',
    iconType: 'green_classroom',
    category: 'discipline',
    categoryLabel: 'Kỷ luật & Chuyên cần',
    description: 'Bảo vệ môi trường lớp học, giữ gìn vệ sinh chung sạch đẹp.',
    criteria: 'Không vi phạm lỗi vệ sinh / trực nhật trong ít nhất 2 tuần kể từ mốc tính điểm.',
    accentColor: '#22C55E',
    gradientBg: 'from-green-500/15 via-emerald-500/10 to-transparent',
    rarity: 'Phổ biến',
    autoRule: {
      enabled: true,
      conditionType: 'no_group_violation',
      violationKeyword: 'vệ sinh',
      minWeeks: 2,
    },
  },
  {
    id: 'b_orderly_desk',
    name: 'Bàn Ghế Ngăn Nắp',
    iconType: 'orderly_desk',
    category: 'discipline',
    categoryLabel: 'Kỷ luật & Chuyên cần',
    description: 'Khu vực chỗ ngồi sạch tinh tươm, bàn ghế thẳng hàng lối.',
    criteria: 'Không vi phạm lỗi nào (0 lỗi) trong ít nhất 1 tuần kể từ mốc tính điểm.',
    accentColor: '#F59E0B',
    gradientBg: 'from-amber-500/15 via-yellow-500/10 to-transparent',
    rarity: 'Phổ biến',
    autoRule: {
      enabled: true,
      conditionType: 'zero_violations_weeks',
      minWeeks: 1,
    },
  },
  {
    id: 'b_self_discipline',
    name: 'Gương Mẫu Tự Giác',
    iconType: 'self_discipline',
    category: 'discipline',
    categoryLabel: 'Kỷ luật & Chuyên cần',
    description: 'Tự giác học tập trong giờ tự quản, giữ trật tự nghiêm túc.',
    criteria: 'Không vi phạm lỗi mất trật tự / nói chuyện trong ít nhất 2 tuần.',
    accentColor: '#8B5CF6',
    gradientBg: 'from-purple-500/15 via-indigo-500/10 to-transparent',
    rarity: 'Hiếm',
    autoRule: {
      enabled: true,
      conditionType: 'no_group_violation',
      violationKeyword: 'trật tự',
      minWeeks: 2,
    },
  },
  {
    id: 'b_school_etiquette',
    name: 'Văn Minh Học Đường',
    iconType: 'school_etiquette',
    category: 'discipline',
    categoryLabel: 'Kỷ luật & Chuyên cần',
    description: 'Lễ phép với thầy cô, hòa nhã với bạn bè, nói lời hay ý đẹp.',
    criteria: 'Điểm trung bình nề nếp đạt từ 95 điểm trở lên kể từ mốc tính điểm.',
    accentColor: '#EC4899',
    gradientBg: 'from-pink-500/15 via-rose-500/10 to-transparent',
    rarity: 'Hiếm',
    autoRule: {
      enabled: true,
      conditionType: 'min_avg_score',
      minScore: 95,
      minWeeks: 1,
    },
  },
  {
    id: 'b_perfect_attendance',
    name: 'Chuyên Cần Hoàn Hảo',
    iconType: 'perfect_attendance',
    category: 'discipline',
    categoryLabel: 'Kỷ luật & Chuyên cần',
    description: 'Có mặt đầy đủ tất cả các buổi học chính khóa và ngoại khóa.',
    criteria: 'Không vi phạm lỗi nghỉ học / bỏ tiết trong ít nhất 3 tuần kể từ mốc tính điểm.',
    accentColor: '#14B8A6',
    gradientBg: 'from-teal-500/15 via-cyan-500/10 to-transparent',
    rarity: 'Sử thi',
    autoRule: {
      enabled: true,
      conditionType: 'no_group_violation',
      violationKeyword: 'nghỉ',
      minWeeks: 3,
    },
  },

  // --- NHÓM 2: HỌC TẬP & TRI THỨC ---
  {
    id: 'b_all_rounder',
    name: 'Học Bá Toàn Năng',
    iconType: 'all_rounder',
    category: 'academic',
    categoryLabel: 'Học tập & Tri thức',
    description: 'Dẫn đầu toàn diện về điểm trung bình các môn học.',
    criteria: 'Điểm trung bình chung các môn học (ĐTB) đạt từ 8.5 trở lên.',
    accentColor: '#F59E0B',
    gradientBg: 'from-amber-500/15 via-yellow-500/10 to-transparent',
    rarity: 'Huyền thoại',
    autoRule: {
      enabled: true,
      conditionType: 'min_gpa',
      minGpa: 8.5,
    },
  },
  {
    id: 'b_resilient_climber',
    name: 'Vua Vượt Khó',
    iconType: 'resilient_climber',
    category: 'academic',
    categoryLabel: 'Học tập & Tri thức',
    description: 'Bứt phá vượt bậc, nỗ lực cải thiện kết quả học tập và rèn luyện.',
    criteria: 'Điểm trung bình chung các môn học (ĐTB) đạt từ 7.5 trở lên.',
    accentColor: '#6366F1',
    gradientBg: 'from-indigo-500/15 via-purple-500/10 to-transparent',
    rarity: 'Sử thi',
    autoRule: {
      enabled: true,
      conditionType: 'min_gpa',
      minGpa: 7.5,
    },
  },
  {
    id: 'b_perfect_ten',
    name: 'Ngôi Sao Điểm 10',
    iconType: 'perfect_ten',
    category: 'academic',
    categoryLabel: 'Học tập & Tri thức',
    description: 'Đạt điểm số xuất sắc trong các môn học.',
    criteria: 'Có ít nhất 1 môn học đạt điểm trung bình từ 9.0 trở lên.',
    accentColor: '#D97706',
    gradientBg: 'from-amber-500/15 via-orange-500/10 to-transparent',
    rarity: 'Hiếm',
    autoRule: {
      enabled: true,
      conditionType: 'min_subject_score',
      minSubjectScore: 9.0,
      minSubjectCount: 1,
    },
  },
  {
    id: 'b_diligent_quill',
    name: 'Bút Vàng Chăm Chỉ',
    iconType: 'diligent_quill',
    category: 'academic',
    categoryLabel: 'Học tập & Tri thức',
    description: 'Vở sạch chữ đẹp, chuẩn bị bài và làm bài tập đầy đủ.',
    criteria: 'Không vi phạm lỗi thiếu bài tập / quên sách vở trong ít nhất 2 tuần.',
    accentColor: '#0284C7',
    gradientBg: 'from-sky-500/15 via-blue-500/10 to-transparent',
    rarity: 'Phổ biến',
    autoRule: {
      enabled: true,
      conditionType: 'no_group_violation',
      violationKeyword: 'bài',
      minWeeks: 2,
    },
  },
  {
    id: 'b_creative_genius',
    name: 'Thần Đồng Sáng Tạo',
    iconType: 'creative_genius',
    category: 'academic',
    categoryLabel: 'Học tập & Tri thức',
    description: 'Nhiều ý tưởng độc đáo, giải pháp thông minh trong học tập.',
    criteria: 'Có ít nhất 2 môn học đạt điểm trung bình từ 8.5 trở lên.',
    accentColor: '#A855F7',
    gradientBg: 'from-purple-500/15 via-fuchsia-500/10 to-transparent',
    rarity: 'Hiếm',
    autoRule: {
      enabled: true,
      conditionType: 'min_subject_score',
      minSubjectScore: 8.5,
      minSubjectCount: 2,
    },
  },
  {
    id: 'b_study_buddies',
    name: 'Đôi Bạn Cùng Tiến',
    iconType: 'study_buddies',
    category: 'academic',
    categoryLabel: 'Học tập & Tri thức',
    description: 'Tận tình kèm cặp, hỗ trợ bạn cùng bàn tiến bộ vượt bậc.',
    criteria: 'ĐTB các môn >= 8.0 và điểm trung bình nề nếp >= 95đ.',
    accentColor: '#38BDF8',
    gradientBg: 'from-sky-500/15 via-cyan-500/10 to-transparent',
    rarity: 'Sử thi',
    autoRule: {
      enabled: true,
      conditionType: 'min_gpa',
      minGpa: 8.0,
    },
  },
  {
    id: 'b_master_presenter',
    name: 'Thủ Lĩnh Thuyết Trình',
    iconType: 'master_presenter',
    category: 'academic',
    categoryLabel: 'Học tập & Tri thức',
    description: 'Hùng biện cuốn hút, tự tin phát biểu xây dựng bài sôi nổi.',
    criteria: 'Tích lũy từ +5 điểm cộng phát biểu / học tập trở lên.',
    accentColor: '#F97316',
    gradientBg: 'from-orange-500/15 via-amber-500/10 to-transparent',
    rarity: 'Hiếm',
    autoRule: {
      enabled: true,
      conditionType: 'min_bonus_points',
      minBonusPoints: 5,
    },
  },
  {
    id: 'b_challenge_conqueror',
    name: 'Chinh Phục Thử Thách',
    iconType: 'challenge_conqueror',
    category: 'academic',
    categoryLabel: 'Học tập & Tri thức',
    description: 'Dũng cảm nhận và hoàn thành xuất sắc các bài tập khó.',
    criteria: 'Có ít nhất 3 môn học đạt điểm trung bình từ 8.5 trở lên.',
    accentColor: '#06B6D4',
    gradientBg: 'from-cyan-500/15 via-teal-500/10 to-transparent',
    rarity: 'Hiếm',
    autoRule: {
      enabled: true,
      conditionType: 'min_subject_score',
      minSubjectScore: 8.5,
      minSubjectCount: 3,
    },
  },

  // --- NHÓM 3: PHONG TRÀO & ĐOÀN HỘI ---
  {
    id: 'b_union_torch',
    name: 'Ngọn Đuốc Đoàn Viên',
    iconType: 'union_torch',
    category: 'movement',
    categoryLabel: 'Phong trào & Đoàn hội',
    description: 'Nhiệt huyết xung kích trong các hoạt động Đoàn trường và Chi đoàn.',
    criteria: 'Giữ chức vụ Bí thư Chi đoàn và đạt điểm nề nếp >= 90đ.',
    accentColor: '#EF4444',
    gradientBg: 'from-red-500/15 via-rose-500/10 to-transparent',
    rarity: 'Sử thi',
    autoRule: {
      enabled: true,
      conditionType: 'is_cadre_role',
      requiredRole: 'BT',
      minScore: 90,
    },
  },
  {
    id: 'b_arts_ambassador',
    name: 'Đại Sứ Văn Nghệ',
    iconType: 'arts_ambassador',
    category: 'movement',
    categoryLabel: 'Phong trào & Đoàn hội',
    description: 'Tài năng ca múa nhạc, khuấy động không khí sinh hoạt lớp.',
    criteria: 'Tích lũy từ +5 điểm cộng phong trào hoặc do GVCN trao tặng.',
    accentColor: '#EC4899',
    gradientBg: 'from-pink-500/15 via-purple-500/10 to-transparent',
    rarity: 'Hiếm',
    autoRule: {
      enabled: true,
      conditionType: 'min_bonus_points',
      minBonusPoints: 5,
    },
  },
  {
    id: 'b_sports_mvp',
    name: 'Cầu Thủ Xuất Sắc',
    iconType: 'sports_mvp',
    category: 'movement',
    categoryLabel: 'Phong trào & Đoàn hội',
    description: 'Thi đấu quật cường, mang vinh quang thể thao về cho tập thể 10A5.',
    criteria: 'Tích lũy từ +10 điểm cộng phong trào hoặc do GVCN trao tặng.',
    accentColor: '#10B981',
    gradientBg: 'from-emerald-500/15 via-green-500/10 to-transparent',
    rarity: 'Sử thi',
    autoRule: {
      enabled: true,
      conditionType: 'min_bonus_points',
      minBonusPoints: 10,
    },
  },
  {
    id: 'b_positive_energy',
    name: 'Năng Lượng Tích Cực',
    iconType: 'positive_energy',
    category: 'movement',
    categoryLabel: 'Phong trào & Đoàn hội',
    description: 'Nụ cười tỏa nắng, luôn mang đến sự vui vẻ, hòa đồng cho cả lớp.',
    criteria: 'Điểm trung bình nề nếp đạt từ 98 điểm trở lên kể từ mốc tính điểm.',
    accentColor: '#FBBF24',
    gradientBg: 'from-amber-500/15 via-yellow-500/10 to-transparent',
    rarity: 'Phổ biến',
    autoRule: {
      enabled: true,
      conditionType: 'min_avg_score',
      minScore: 98,
      minWeeks: 1,
    },
  },
  {
    id: 'b_heart_volunteer',
    name: 'Tình Nguyện Nhiệt Thành',
    iconType: 'heart_volunteer',
    category: 'movement',
    categoryLabel: 'Phong trào & Đoàn hội',
    description: 'Xung phong trong các đợt quyên góp, lao động tình nguyện vì cộng đồng.',
    criteria: 'Tích lũy từ +8 điểm cộng tuyên dương trở lên.',
    accentColor: '#F43F5E',
    gradientBg: 'from-rose-500/15 via-red-500/10 to-transparent',
    rarity: 'Hiếm',
    autoRule: {
      enabled: true,
      conditionType: 'min_bonus_points',
      minBonusPoints: 8,
    },
  },
  {
    id: 'b_fitness_warrior',
    name: 'Chiến Binh Hội Khỏe',
    iconType: 'fitness_warrior',
    category: 'movement',
    categoryLabel: 'Phong trào & Đoàn hội',
    description: 'Tập thể dục giữa giờ nghiêm túc, rèn luyện thân thể dẻo dai.',
    criteria: 'Không vi phạm lỗi thể dục giữa giờ trong ít nhất 2 tuần.',
    accentColor: '#6366F1',
    gradientBg: 'from-indigo-500/15 via-blue-500/10 to-transparent',
    rarity: 'Phổ biến',
    autoRule: {
      enabled: true,
      conditionType: 'no_group_violation',
      violationKeyword: 'thể dục',
      minWeeks: 2,
    },
  },
  {
    id: 'b_march_youth',
    name: 'Sao Sáng 26/3',
    iconType: 'march_youth',
    category: 'movement',
    categoryLabel: 'Phong trào & Đoàn hội',
    description: 'Huy hiệu kỷ niệm thành tích xuất sắc trong đợt thi đua Đoàn.',
    criteria: 'Đạt Top 5 Bảng xếp hạng thi đua toàn lớp.',
    accentColor: '#EF4444',
    gradientBg: 'from-red-500/15 via-orange-500/10 to-transparent',
    rarity: 'Huyền thoại',
    autoRule: {
      enabled: true,
      conditionType: 'top_rank',
      maxRank: 5,
      minScore: 95,
    },
  },

  // --- NHÓM 4: TẬP THỂ & CÁN SỰ (10 - GỒM CẢ PHÓ BÍ THƯ, LỚP PHÓ VĂN THỂ, CỜ ĐỎ) ---
  {
    id: 'b_cadre_leader',
    name: 'Thủ Lĩnh Bản Lĩnh',
    iconType: 'cadre_leader',
    category: 'cadre',
    categoryLabel: 'Tập thể & Cán sự',
    description: 'Cán sự công tâm, chỉ huy quyết đoán, được tập thể tôn trọng.',
    criteria: 'Giữ chức vụ Ban cán sự / Tổ trưởng và điểm TB nề nếp >= 90đ.',
    accentColor: '#F59E0B',
    gradientBg: 'from-amber-500/15 via-yellow-500/10 to-transparent',
    rarity: 'Sử thi',
    autoRule: {
      enabled: true,
      conditionType: 'is_cadre_role',
      requiredRole: 'ANY_CADRE',
      minScore: 90,
    },
  },
  {
    id: 'b_deputy_union_sec',
    name: 'Ngọn Lửa Phó Bí Thư',
    iconType: 'deputy_union_sec',
    category: 'cadre',
    categoryLabel: 'Tập thể & Cán sự',
    description: 'Phó Bí thư Chi đoàn xung kích, gắn kết đoàn viên và tiếp lửa phong trào.',
    criteria: 'Giữ chức vụ Phó Bí thư Chi đoàn (PBT) và điểm TB nề nếp >= 90đ.',
    accentColor: '#E11D48',
    gradientBg: 'from-rose-500/15 via-orange-500/10 to-transparent',
    rarity: 'Sử thi',
    autoRule: {
      enabled: true,
      conditionType: 'is_cadre_role',
      requiredRole: 'PBT',
      minScore: 90,
    },
  },
  {
    id: 'b_arts_sports_deputy',
    name: 'Đại Sứ Văn Thể Mỹ',
    iconType: 'arts_sports_deputy',
    category: 'cadre',
    categoryLabel: 'Tập thể & Cán sự',
    description: 'Lớp phó Văn thể năng nổ, dẫn dắt phong trào văn hóa, văn nghệ, thể thao.',
    criteria: 'Giữ chức vụ Lớp phó Văn thể (LP_VT) và điểm TB nề nếp >= 90đ.',
    accentColor: '#A21CAF',
    gradientBg: 'from-fuchsia-500/15 via-purple-500/10 to-transparent',
    rarity: 'Sử thi',
    autoRule: {
      enabled: true,
      conditionType: 'is_cadre_role',
      requiredRole: 'LP_VT',
      minScore: 90,
    },
  },
  {
    id: 'b_red_flag_warden',
    name: 'Sao Đỏ Kỷ Cương (Cờ Đỏ)',
    iconType: 'red_flag_warden',
    category: 'cadre',
    categoryLabel: 'Tập thể & Cán sự',
    description: 'Đội viên Cờ đỏ gương mẫu, công tâm, giữ vững kỷ cương nề nếp lớp học.',
    criteria: 'Giữ chức vụ Cờ đỏ (CD) và điểm TB nề nếp >= 90đ.',
    accentColor: '#DC2626',
    gradientBg: 'from-red-500/15 via-rose-500/10 to-transparent',
    rarity: 'Sử thi',
    autoRule: {
      enabled: true,
      conditionType: 'is_cadre_role',
      requiredRole: 'CD',
      minScore: 90,
    },
  },
  {
    id: 'b_loving_guide',
    name: 'Người Cầm Lái Yêu Thương',
    iconType: 'loving_guide',
    category: 'cadre',
    categoryLabel: 'Tập thể & Cán sự',
    description: 'Luôn lắng nghe, thấu hiểu, gắn kết các thành viên như gia đình.',
    criteria: 'Giữ chức vụ Lớp trưởng (LT) và điểm TB nề nếp >= 95đ.',
    accentColor: '#0EA5E9',
    gradientBg: 'from-sky-500/15 via-blue-500/10 to-transparent',
    rarity: 'Sử thi',
    autoRule: {
      enabled: true,
      conditionType: 'is_cadre_role',
      requiredRole: 'LT',
      minScore: 95,
    },
  },
  {
    id: 'b_golden_hands',
    name: 'Bàn Tay Vàng Trực Nhật',
    iconType: 'golden_hands',
    category: 'cadre',
    categoryLabel: 'Tập thể & Cán sự',
    description: 'Trực nhật chu đáo, bảng sạch, giẻ ướt, phấn thơm, lớp tinh tươm.',
    criteria: 'Dành cho Ban cán sự (Lớp phó Lao động LP_LD) đạt điểm TB nề nếp >= 90đ.',
    accentColor: '#14B8A6',
    gradientBg: 'from-teal-500/15 via-emerald-500/10 to-transparent',
    rarity: 'Phổ biến',
    autoRule: {
      enabled: true,
      conditionType: 'is_cadre_role',
      requiredRole: 'LP_LD',
      minScore: 90,
    },
  },
  {
    id: 'b_rescue_knight',
    name: 'Hiệp Sĩ Cứu Trợ',
    iconType: 'rescue_knight',
    category: 'cadre',
    categoryLabel: 'Tập thể & Cán sự',
    description: 'Sẵn sàng trực nhật thay bạn bị ốm, hỗ trợ việc lớp không nề hà.',
    criteria: 'Dành cho Ban cán sự (Lớp phó Học tập LP_HT hoặc Tổ trưởng TT) gương mẫu.',
    accentColor: '#8B5CF6',
    gradientBg: 'from-purple-500/15 via-violet-500/10 to-transparent',
    rarity: 'Hiếm',
    autoRule: {
      enabled: true,
      conditionType: 'is_cadre_role',
      requiredRole: 'LP_HT',
      minScore: 90,
    },
  },
  {
    id: 'b_team_spirit',
    name: 'Tinh Thần Đồng Đội',
    iconType: 'team_spirit',
    category: 'cadre',
    categoryLabel: 'Tập thể & Cán sự',
    description: 'Vì cái chung, luôn đặt danh dự tập thể 10A5 lên trên cá nhân.',
    criteria: 'Dành cho Ban cán sự đạt Top 10 Bảng xếp hạng thi đua toàn lớp.',
    accentColor: '#F59E0B',
    gradientBg: 'from-amber-500/15 via-orange-500/10 to-transparent',
    rarity: 'Sử thi',
    autoRule: {
      enabled: true,
      conditionType: 'top_rank',
      maxRank: 10,
      minScore: 90,
    },
  },
  {
    id: 'b_class_heart',
    name: 'Trái Tim 10A5',
    iconType: 'class_heart',
    category: 'cadre',
    categoryLabel: 'Tập thể & Cán sự',
    description: 'Tận tâm cống hiến thầm lặng vì một tập thể đoàn kết vững mạnh.',
    criteria: 'Dành cho Ban cán sự đạt Top 3 Bảng xếp hạng thi đua toàn lớp.',
    accentColor: '#E11D48',
    gradientBg: 'from-rose-500/15 via-pink-500/10 to-transparent',
    rarity: 'Huyền thoại',
    autoRule: {
      enabled: true,
      conditionType: 'top_rank',
      maxRank: 3,
      minScore: 95,
    },
  },
  {
    id: 'b_star_10a5',
    name: 'Sao Vàng Vinh Dự 10A5',
    iconType: 'star_10a5',
    category: 'cadre',
    categoryLabel: 'Tập thể & Cán sự',
    description: 'Phần thưởng danh giá cao quý nhất do Giáo viên chủ nhiệm trao tặng.',
    criteria: 'Dành cho Ban cán sự đạt Hạng 1 (Top 1) Bảng xếp hạng thi đua toàn lớp.',
    accentColor: '#F59E0B',
    gradientBg: 'from-amber-500/20 via-yellow-400/15 to-transparent',
    rarity: 'Huyền thoại',
    autoRule: {
      enabled: true,
      conditionType: 'top_rank',
      maxRank: 1,
      minScore: 98,
    },
  },
];

const STORAGE_KEY_BADGES = 'app_badges_catalog_10a5_v3';
const STORAGE_KEY_STUDENT_BADGES = 'app_student_badges_10a5_v3';
const STORAGE_KEY_STUDENT_ACTIVE_BADGE = 'app_student_active_badge_10a5_v2';

/**
 * Kiểm tra học sinh có thuộc Ban cán sự lớp (LT, BT, PBT, LP_HT, LP_LD, LP_VT, CD, TT) hay không
 */
export function isStudentCadre(student?: Pick<Student, 'vaiTro'> | null): boolean {
  if (!student || !Array.isArray(student.vaiTro)) return false;
  return student.vaiTro.some(r => r !== 'HS');
}

/**
 * Kiểm tra huy hiệu có thuộc nhóm chỉ dành riêng cho Ban cán sự hay không
 * (Toàn bộ nhóm Tập thể & Cán sự + các huy hiệu gắn với chức vụ cán sự)
 */
export function isBadgeReservedForCadre(badge?: AchievementBadge | null): boolean {
  if (!badge) return false;
  return (
    badge.category === 'cadre' ||
    badge.autoRule?.conditionType === 'is_cadre_role' ||
    badge.id === 'b_union_torch'
  );
}

/**
 * Thu hồi toàn bộ huy hiệu của tất cả học sinh trong lớp (kể cả huy hiệu đang ghim đại diện)
 */
export function revokeAllStudentBadges(): void {
  try {
    localStorage.setItem(STORAGE_KEY_STUDENT_BADGES, JSON.stringify({}));
    localStorage.setItem(STORAGE_KEY_STUDENT_ACTIVE_BADGE, JSON.stringify({}));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lop10a5:badge_change'));
    }
  } catch (e) {
    console.error('Error revoking all student badges:', e);
  }
}

/**
 * Load badge catalog with GV customized names/criteria/autoRule from localStorage.
 */
export function getBadgeCatalog(): AchievementBadge[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BADGES) || localStorage.getItem('app_badges_catalog_10a5_v2');
    if (!raw) return DEFAULT_30_BADGES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return DEFAULT_30_BADGES.map(def => {
        const custom = parsed.find((p: AchievementBadge) => p.id === def.id);
        if (!custom) return def;
        return {
          ...def,
          ...custom,
          autoRule: {
            ...(def.autoRule || { enabled: true, conditionType: 'manual_only' }),
            ...(custom.autoRule || {}),
          },
        };
      });
    }
  } catch (e) {
    console.error('Error loading badge catalog:', e);
  }
  return DEFAULT_30_BADGES;
}

/**
 * Save updated badge catalog (e.g. GV edits name, criteria, or autoRule).
 */
export function saveBadgeCatalog(catalog: AchievementBadge[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_BADGES, JSON.stringify(catalog));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lop10a5:badge_change'));
    }
  } catch (e) {
    console.error('Error saving badge catalog:', e);
  }
}

/**
 * Reset badge catalog to defaults.
 */
export function resetBadgeCatalog(): AchievementBadge[] {
  try {
    localStorage.removeItem(STORAGE_KEY_BADGES);
    localStorage.removeItem('app_badges_catalog_10a5_v2');
  } catch (e) {
    console.error('Error resetting badge catalog:', e);
  }
  return DEFAULT_30_BADGES;
}

/**
 * Get map of studentId -> list of awarded badgeIds
 * (No hardcoded fake starter badges — badges come from real evaluation or GV awards)
 */
export function getStudentBadgesMap(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STUDENT_BADGES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading student badges:', e);
  }
  return {};
}

/**
 * Save awarded badges for a student
 */
export function awardBadgeToStudent(studentId: string, badgeId: string): void {
  try {
    const map = getStudentBadgesMap();
    const current = map[studentId] || [];
    if (!current.includes(badgeId)) {
      map[studentId] = [...current, badgeId];
      localStorage.setItem(STORAGE_KEY_STUDENT_BADGES, JSON.stringify(map));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('lop10a5:badge_change'));
      }
    }
  } catch (e) {
    console.error('Error awarding badge:', e);
  }
}

/**
 * Revoke a badge from student
 */
export function revokeBadgeFromStudent(studentId: string, badgeId: string): void {
  try {
    const map = getStudentBadgesMap();
    const current = map[studentId] || [];
    map[studentId] = current.filter(id => id !== badgeId);
    localStorage.setItem(STORAGE_KEY_STUDENT_BADGES, JSON.stringify(map));
    if (getStudentActiveBadge(studentId) === badgeId) {
      setStudentActiveBadge(studentId, null);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lop10a5:badge_change'));
    }
  } catch (e) {
    console.error('Error revoking badge:', e);
  }
}

/**
 * Get active displayed badge for student (displayed next to Avatar)
 */
export function getStudentActiveBadge(studentId: string): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STUDENT_ACTIVE_BADGE);
    if (raw) {
      const map = JSON.parse(raw);
      return map[studentId] || null;
    }
  } catch (e) {
    console.error('Error loading active badge:', e);
  }
  return null;
}

/**
 * Set active displayed badge for student
 */
export function setStudentActiveBadge(studentId: string, badgeId: string | null): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STUDENT_ACTIVE_BADGE);
    const map = raw ? JSON.parse(raw) : {};
    if (badgeId) {
      map[studentId] = badgeId;
    } else {
      delete map[studentId];
    }
    localStorage.setItem(STORAGE_KEY_STUDENT_ACTIVE_BADGE, JSON.stringify(map));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lop10a5:badge_change'));
    }
  } catch (e) {
    console.error('Error setting active badge:', e);
  }
}

/**
 * Export all student badges and active badge settings for sync
 */
export function getAllStudentBadgesState(): { 
  studentBadgesMap: Record<string, string[]>; 
  studentActiveBadges: Record<string, string>; 
} {
  let activeBadges: Record<string, string> = {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STUDENT_ACTIVE_BADGE);
    if (raw) activeBadges = JSON.parse(raw);
  } catch {}

  return {
    studentBadgesMap: getStudentBadgesMap(),
    studentActiveBadges: activeBadges,
  };
}

/**
 * Hydrate student badges and active badges from persistent server state
 */
export function setAllStudentBadgesState(
  studentBadgesMap?: Record<string, string[]>, 
  studentActiveBadges?: Record<string, string>
): void {
  try {
    if (studentBadgesMap && typeof studentBadgesMap === 'object') {
      localStorage.setItem(STORAGE_KEY_STUDENT_BADGES, JSON.stringify(studentBadgesMap));
    }
    if (studentActiveBadges && typeof studentActiveBadges === 'object') {
      localStorage.setItem(STORAGE_KEY_STUDENT_ACTIVE_BADGE, JSON.stringify(studentActiveBadges));
    }
  } catch (e) {
    console.error('Error setting student badges state:', e);
  }
}

/**
 * Tự động xét duyệt và trao các huy hiệu đủ điều kiện dựa trên:
 * - Mốc thời gian bắt đầu tính điểm / xét huy hiệu do GV chọn (`tuanBatDauXetHuyHieu` / `ngayBatDauXetHuyHieu`)
 * - Điều kiện trao (`autoRule`) của từng huy hiệu
 * - Ràng buộc: Các huy hiệu nhóm Tập thể & Cán sự hoặc gắn chức vụ chỉ được xét trao cho Ban cán sự
 * @param replaceExisting Nếu true, thu hồi toàn bộ huy hiệu cũ và tính lại từ đầu theo đúng điều kiện mới
 */
export function evaluateAndAutoAwardBadges(params: {
  students: Student[];
  records: DisciplineRecord[];
  academicRecords?: StudentAcademicRecord[];
  settings: TeacherSettings;
  currentWeek: number;
  catalog?: AchievementBadge[];
  replaceExisting?: boolean;
}): {
  updatedMap: Record<string, string[]>;
  newlyAwardedCount: number;
  totalAwardedCount: number;
} {
  const {
    students,
    records,
    academicRecords = [],
    settings,
    currentWeek,
    catalog = getBadgeCatalog(),
    replaceExisting = false,
  } = params;

  const existingMap = replaceExisting ? {} : getStudentBadgesMap();
  if (!students || students.length === 0) {
    return { updatedMap: existingMap, newlyAwardedCount: 0, totalAwardedCount: 0 };
  }

  const startWeek = Math.max(
    1,
    Number(settings.tuanBatDauXetHuyHieu || settings.tuanBatDauTinhDiem || 1)
  );
  const startDate = String(
    settings.ngayBatDauXetHuyHieu || settings.ngayBatDauTinhDiem || ''
  ).trim();
  const noDataWeeks = (settings.noDataWeeks || []).map(Number);

  // Các tuần hợp lệ kể từ mốc thời gian bắt đầu xét huy hiệu đến tuần hiện tại
  const activeWeeks: number[] = [];
  for (let w = startWeek; w <= Number(currentWeek); w++) {
    if (!noDataWeeks.includes(w)) {
      activeWeeks.push(w);
    }
  }

  // Lọc các bản ghi hợp lệ nằm trong mốc thời gian
  const validRecords = (records || []).filter(r => {
    if (!r || r.trangThai === 'DaHuy' || r.trangThai === 'DaChapNhan') return false;
    const w = Number(r.tuanHoc);
    if (w < startWeek || w > Number(currentWeek) || noDataWeeks.includes(w)) return false;
    if (startDate && r.ngayHoc && String(r.ngayHoc).trim() < startDate) return false;
    return true;
  });

  // Tính thống kê từng học sinh trên các tuần activeWeeks
  interface StudentEvalStats {
    student: Student;
    weeklyScores: number[];
    weeklyViolationCounts: number[];
    studentRecords: DisciplineRecord[];
    avgScore: number;
    totalDeductions: number;
    totalBonusPoints: number;
    gpa: number | null;
    subjectTbs: number[];
  }

  const statsByMa = new Map<string, StudentEvalStats>();

  for (const stu of students) {
    const stuRecs = validRecords.filter(r => isRecordMatchingStudent(r, stu.maHS, stu.hoTen));
    const weeklyScores: number[] = [];
    const weeklyViolationCounts: number[] = [];
    let totalDeductions = 0;
    let totalBonusPoints = 0;

    for (const w of activeWeeks) {
      const wRecs = stuRecs.filter(r => Number(r.tuanHoc) === w);
      let wDed = 0;
      let wBon = 0;
      let wViolCount = 0;
      for (const rec of wRecs) {
        const { isBonus, points } = parseRecordPoints(rec);
        if (!isBonus) {
          wDed += points;
          wViolCount += 1;
        } else {
          wBon += points;
        }
      }
      totalDeductions += wDed;
      totalBonusPoints += wBon;
      const effectiveBonus = settings.batDiemCong ? wBon : 0;
      const wScore = Math.max(0, settings.diemKhoiDau - wDed + effectiveBonus);
      weeklyScores.push(wScore);
      weeklyViolationCounts.push(wViolCount);
    }

    const avgScore =
      weeklyScores.length > 0
        ? Math.round((weeklyScores.reduce((a, b) => a + b, 0) / weeklyScores.length) * 10) / 10
        : settings.diemKhoiDau;

    // Điểm học tập (ưu tiên HK1 hoặc bản ghi mới nhất)
    const acad = academicRecords.find(
      ar => ar.maHS.trim().toUpperCase() === stu.maHS.trim().toUpperCase()
    );
    const gpa = acad && typeof acad.diemTBChung === 'number' ? acad.diemTBChung : null;
    const subjectTbs: number[] = [];
    if (acad && acad.subjects) {
      Object.values(acad.subjects).forEach(sub => {
        if (sub && typeof sub.tb === 'number') {
          subjectTbs.push(sub.tb);
        }
      });
    }

    statsByMa.set(stu.maHS, {
      student: stu,
      weeklyScores,
      weeklyViolationCounts,
      studentRecords: stuRecs,
      avgScore,
      totalDeductions,
      totalBonusPoints,
      gpa,
      subjectTbs,
    });
  }

  // Tính thứ hạng Dense Ranking trên điểm trung bình nề nếp từ mốc thời gian
  const rankedList = calculateDenseRankings(
    Array.from(statsByMa.values()),
    item => item.avgScore,
    item => item.totalDeductions,
    item => item.totalBonusPoints
  );
  const rankByMa = new Map<string, number>();
  rankedList.forEach(r => rankByMa.set(r.student.maHS, r.officialRank));

  const nextMap: Record<string, string[]> = {};
  Object.keys(existingMap).forEach(k => {
    nextMap[k] = [...(existingMap[k] || [])];
  });

  let newlyAwardedCount = 0;
  let totalAwardedCount = 0;
  let hasChanged = replaceExisting;

  for (const stu of students) {
    const stStats = statsByMa.get(stu.maHS);
    if (!stStats) continue;
    const isCadre = isStudentCadre(stu);
    const currentBadges = new Set<string>(nextMap[stu.maHS] || []);
    const stuRank = rankByMa.get(stu.maHS) ?? 99;

    // Nếu học sinh không phải Ban cán sự mà đang giữ huy hiệu chỉ dành riêng cho Ban cán sự thì thu hồi
    if (!isCadre) {
      for (const badge of catalog) {
        if (isBadgeReservedForCadre(badge) && currentBadges.has(badge.id)) {
          currentBadges.delete(badge.id);
          hasChanged = true;
        }
      }
    }

    for (const badge of catalog) {
      // Ràng buộc cứng: Huy hiệu nhóm Tập thể & Cán sự hoặc gắn chức vụ chỉ dành cho Ban cán sự
      if (isBadgeReservedForCadre(badge) && !isCadre) {
        continue;
      }

      const rule = badge.autoRule;
      if (!rule || !rule.enabled || rule.conditionType === 'manual_only') {
        continue;
      }

      let qualified = false;
      const reqWeeks = Math.max(1, Number(rule.minWeeks || 1));

      switch (rule.conditionType) {
        case 'min_week_score': {
          const threshold = Number(rule.minScore ?? 100);
          const qualifyingWeeks = stStats.weeklyScores.filter(s => s >= threshold).length;
          qualified = activeWeeks.length >= reqWeeks && qualifyingWeeks >= reqWeeks;
          break;
        }
        case 'zero_violations_weeks': {
          const zeroWeeks = stStats.weeklyViolationCounts.filter(c => c === 0).length;
          qualified = activeWeeks.length >= reqWeeks && zeroWeeks >= reqWeeks;
          break;
        }
        case 'no_group_violation': {
          const kw = String(rule.violationKeyword || '').trim().toLowerCase();
          if (activeWeeks.length >= reqWeeks) {
            let cleanWeeks = 0;
            for (const w of activeWeeks) {
              const hasKwViolation = stStats.studentRecords.some(rec => {
                if (Number(rec.tuanHoc) !== w) return false;
                const { isBonus } = parseRecordPoints(rec);
                if (isBonus) return false;
                if (!kw) return true;
                const text = `${rec.nhomHanhVi || ''} ${rec.tenHanhVi || ''} ${rec.ghiChu || ''}`.toLowerCase();
                return text.includes(kw);
              });
              if (!hasKwViolation) cleanWeeks += 1;
            }
            qualified = cleanWeeks >= reqWeeks;
          }
          break;
        }
        case 'min_avg_score': {
          const threshold = Number(rule.minScore ?? 95);
          qualified = activeWeeks.length >= reqWeeks && stStats.avgScore >= threshold;
          break;
        }
        case 'top_rank': {
          const maxR = Number(rule.maxRank ?? 5);
          const minSc = Number(rule.minScore ?? 90);
          qualified = activeWeeks.length >= 1 && stuRank <= maxR && stStats.avgScore >= minSc;
          break;
        }
        case 'min_bonus_points': {
          const minBon = Number(rule.minBonusPoints ?? 5);
          qualified = stStats.totalBonusPoints >= minBon;
          break;
        }
        case 'min_gpa': {
          const minG = Number(rule.minGpa ?? 8.0);
          qualified = stStats.gpa !== null && stStats.gpa >= minG;
          break;
        }
        case 'min_subject_score': {
          const minSubSc = Number(rule.minSubjectScore ?? 9.0);
          const minCnt = Math.max(1, Number(minSubjectCountOrDefault(rule.minSubjectCount)));
          const cnt = stStats.subjectTbs.filter(tb => tb >= minSubSc).length;
          qualified = cnt >= minCnt;
          break;
        }
        case 'is_cadre_role': {
          const minSc = Number(rule.minScore ?? 90);
          const reqRole = rule.requiredRole || 'ANY_CADRE';
          const hasRole =
            reqRole === 'ANY_CADRE'
              ? isCadre
              : stu.vaiTro.includes(reqRole as RoleCode);
          qualified = hasRole && stStats.avgScore >= minSc;
          break;
        }
      }

      if (qualified && !currentBadges.has(badge.id)) {
        currentBadges.add(badge.id);
        newlyAwardedCount += 1;
        hasChanged = true;
      }
    }

    nextMap[stu.maHS] = Array.from(currentBadges);
    totalAwardedCount += nextMap[stu.maHS].length;
  }

  if (hasChanged) {
    try {
      localStorage.setItem(STORAGE_KEY_STUDENT_BADGES, JSON.stringify(nextMap));
      // Đồng bộ lại huy hiệu đang ghim đại diện: nếu huy hiệu đang ghim không còn trong danh sách sở hữu thì gỡ ghim
      const rawActive = localStorage.getItem(STORAGE_KEY_STUDENT_ACTIVE_BADGE);
      if (rawActive) {
        const activeMap = JSON.parse(rawActive) as Record<string, string>;
        let activeModified = false;
        Object.keys(activeMap).forEach(stId => {
          const owned = nextMap[stId] || [];
          if (!owned.includes(activeMap[stId])) {
            delete activeMap[stId];
            activeModified = true;
          }
        });
        if (activeModified) {
          localStorage.setItem(STORAGE_KEY_STUDENT_ACTIVE_BADGE, JSON.stringify(activeMap));
        }
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('lop10a5:badge_change'));
      }
    } catch (e) {
      console.error('Error saving auto-awarded badges:', e);
    }
  }

  return {
    updatedMap: nextMap,
    newlyAwardedCount,
    totalAwardedCount,
  };
}

function minSubjectCountOrDefault(val?: number): number {
  return typeof val === 'number' && val >= 1 ? val : 1;
}

