import { BadgeIconType } from '../components/common/BadgeEmblem';

export type BadgeCategory = 'discipline' | 'academic' | 'movement' | 'cadre';

export interface AchievementBadge {
  id: string;
  name: string; // Tên huy hiệu (GV có thể sửa)
  iconType: BadgeIconType;
  category: BadgeCategory;
  categoryLabel: string;
  description: string; // Mô tả ngắn
  criteria: string; // Điều kiện trao (GV có thể sửa)
  accentColor: string;
  gradientBg: string;
  rarity: 'Phổ biến' | 'Hiếm' | 'Sử thi' | 'Huyền thoại';
  defaultAwarded?: boolean;
}

export const DEFAULT_30_BADGES: AchievementBadge[] = [
  // --- NHÓM 1: KỶ LUẬT & CHUYÊN CẦN (8) ---
  {
    id: 'b_iron_discipline',
    name: 'Kỷ Luật Thép',
    iconType: 'iron_discipline',
    category: 'discipline',
    categoryLabel: 'Kỷ luật & Chuyên cần',
    description: 'Giữ vững nề nếp hoàn hảo, không một lỗi vi phạm suốt tháng.',
    criteria: 'Điểm nề nếp đạt 100đ tuyệt đối trong tháng, gương mẫu tuyệt đối.',
    accentColor: '#10B981',
    gradientBg: 'from-emerald-500/15 via-teal-500/10 to-transparent',
    rarity: 'Huyền thoại',
  },
  {
    id: 'b_punctuality_hero',
    name: 'Chiến Thần Đúng Giờ',
    iconType: 'punctuality_hero',
    category: 'discipline',
    categoryLabel: 'Kỷ luật & Chuyên cần',
    description: 'Tác phong nhanh nhẹn, luôn có mặt sớm trước 15 phút đầu giờ.',
    criteria: 'Không đi muộn, không trễ tiết trong 4 tuần liên tục.',
    accentColor: '#06B6D4',
    gradientBg: 'from-cyan-500/15 via-blue-500/10 to-transparent',
    rarity: 'Hiếm',
  },
  {
    id: 'b_neat_attire',
    name: 'Tác Phong Chuẩn Mực',
    iconType: 'neat_attire',
    category: 'discipline',
    categoryLabel: 'Kỷ luật & Chuyên cần',
    description: 'Trang phục chuẩn nội quy, đầu tóc gọn gàng, phù hiệu đầy đủ.',
    criteria: 'Đồng phục, sơ vin, phù hiệu THPT Số 2 Đức Phổ chuẩn 100% các buổi học.',
    accentColor: '#3B82F6',
    gradientBg: 'from-blue-500/15 via-indigo-500/10 to-transparent',
    rarity: 'Phổ biến',
  },
  {
    id: 'b_green_classroom',
    name: 'Hiệp Sĩ Không Gian Xanh',
    iconType: 'green_classroom',
    category: 'discipline',
    categoryLabel: 'Kỷ luật & Chuyên cần',
    description: 'Bảo vệ môi trường lớp học, chăm sóc cây xanh, phân loại rác.',
    criteria: 'Tích cực gom rác, giữ bồn hoa cây cảnh lớp tươi tốt, nhắc nhở bạn cùng lớp.',
    accentColor: '#22C55E',
    gradientBg: 'from-green-500/15 via-emerald-500/10 to-transparent',
    rarity: 'Phổ biến',
  },
  {
    id: 'b_orderly_desk',
    name: 'Bàn Ghế Ngăn Nắp',
    iconType: 'orderly_desk',
    category: 'discipline',
    categoryLabel: 'Kỷ luật & Chuyên cần',
    description: 'Khu vực chỗ ngồi sạch tinh tươm, bàn ghế thẳng hàng lối.',
    criteria: 'Ngăn bàn không có rác thừa, cặp sách để đúng vị trí suốt tuần.',
    accentColor: '#F59E0B',
    gradientBg: 'from-amber-500/15 via-yellow-500/10 to-transparent',
    rarity: 'Phổ biến',
  },
  {
    id: 'b_self_discipline',
    name: 'Gương Mẫu Tự Giác',
    iconType: 'self_discipline',
    category: 'discipline',
    categoryLabel: 'Kỷ luật & Chuyên cần',
    description: 'Tự giác học tập trong giờ tự quản, không làm phiền bạn xung quanh.',
    criteria: 'Giữ trật tự tuyệt đối trong giờ tự quản 15 phút và tiết trống.',
    accentColor: '#8B5CF6',
    gradientBg: 'from-purple-500/15 via-indigo-500/10 to-transparent',
    rarity: 'Hiếm',
  },
  {
    id: 'b_school_etiquette',
    name: 'Văn Minh Học Đường',
    iconType: 'school_etiquette',
    category: 'discipline',
    categoryLabel: 'Kỷ luật & Chuyên cần',
    description: 'Lễ phép với thầy cô, hòa nhã với bạn bè, nói lời hay ý đẹp.',
    criteria: 'Chào hỏi thầy cô đúng mực, giao tiếp văn hóa, không văng tục chửi bậy.',
    accentColor: '#EC4899',
    gradientBg: 'from-pink-500/15 via-rose-500/10 to-transparent',
    rarity: 'Hiếm',
  },
  {
    id: 'b_perfect_attendance',
    name: 'Chuyên Cần Hoàn Hảo',
    iconType: 'perfect_attendance',
    category: 'discipline',
    categoryLabel: 'Kỷ luật & Chuyên cần',
    description: 'Có mặt đầy đủ tất cả các buổi học chính khóa và ngoại khóa.',
    criteria: 'Chuyên cần 100%, không nghỉ học (kể cả có phép) trong suốt tháng.',
    accentColor: '#14B8A6',
    gradientBg: 'from-teal-500/15 via-cyan-500/10 to-transparent',
    rarity: 'Sử thi',
  },

  // --- NHÓM 2: HỌC TẬP & TRI THỨC (8) ---
  {
    id: 'b_all_rounder',
    name: 'Học Bá Toàn Năng',
    iconType: 'all_rounder',
    category: 'academic',
    categoryLabel: 'Học tập & Tri thức',
    description: 'Dẫn đầu toàn diện về điểm kiểm tra và tinh thần học hỏi.',
    criteria: 'Đạt danh hiệu Học sinh Giỏi / Xuất sắc tuần và tháng do GVCN bình chọn.',
    accentColor: '#F59E0B',
    gradientBg: 'from-amber-500/15 via-yellow-500/10 to-transparent',
    rarity: 'Huyền thoại',
  },
  {
    id: 'b_resilient_climber',
    name: 'Vua Vượt Khó',
    iconType: 'resilient_climber',
    category: 'academic',
    categoryLabel: 'Học tập & Tri thức',
    description: 'Bứt phá vượt bậc, nỗ lực sửa sai và cải thiện kết quả rõ rệt.',
    criteria: 'Nâng hạng thi đua ít nhất 10 bậc trong tuần hoặc tháng gần nhất.',
    accentColor: '#6366F1',
    gradientBg: 'from-indigo-500/15 via-purple-500/10 to-transparent',
    rarity: 'Sử thi',
  },
  {
    id: 'b_perfect_ten',
    name: 'Ngôi Sao Điểm 10',
    iconType: 'perfect_ten',
    category: 'academic',
    categoryLabel: 'Học tập & Tri thức',
    description: 'Đạt điểm số tuyệt đối trong các bài kiểm tra miệng, 15 phút, 1 tiết.',
    criteria: 'Đạt từ 2 điểm 10 hoặc 3 điểm 9 trở lên trong tuần.',
    accentColor: '#D97706',
    gradientBg: 'from-amber-500/15 via-orange-500/10 to-transparent',
    rarity: 'Hiếm',
  },
  {
    id: 'b_diligent_quill',
    name: 'Bút Vàng Chăm Chỉ',
    iconType: 'diligent_quill',
    category: 'academic',
    categoryLabel: 'Học tập & Tri thức',
    description: 'Vở sạch chữ đẹp, soạn bài và làm bài tập chu đáo 100%.',
    criteria: 'Được Lớp phó Học tập và GV bộ môn khen ngợi về bài vở chu đáo.',
    accentColor: '#0284C7',
    gradientBg: 'from-sky-500/15 via-blue-500/10 to-transparent',
    rarity: 'Phổ biến',
  },
  {
    id: 'b_creative_genius',
    name: 'Thần Đồng Sáng Tạo',
    iconType: 'creative_genius',
    category: 'academic',
    categoryLabel: 'Học tập & Tri thức',
    description: 'Nhiều ý tưởng độc đáo, giải pháp thông minh trong bài tập nhóm.',
    criteria: 'Đóng góp ý tưởng giải bài hoặc dự án môn học xuất sắc được GV biểu dương.',
    accentColor: '#A855F7',
    gradientBg: 'from-purple-500/15 via-fuchsia-500/10 to-transparent',
    rarity: 'Hiếm',
  },
  {
    id: 'b_study_buddies',
    name: 'Đôi Bạn Cùng Tiến',
    iconType: 'study_buddies',
    category: 'academic',
    categoryLabel: 'Học tập & Tri thức',
    description: 'Tận tình kèm cặp, hỗ trợ bạn cùng bàn tiến bộ vượt bậc.',
    criteria: 'Kèm bạn cùng tiến bộ ít nhất 1 bậc xếp loại trong đợt thi đua.',
    accentColor: '#38BDF8',
    gradientBg: 'from-sky-500/15 via-cyan-500/10 to-transparent',
    rarity: 'Sử thi',
  },
  {
    id: 'b_master_presenter',
    name: 'Thủ Lĩnh Thuyết Trình',
    iconType: 'master_presenter',
    category: 'academic',
    categoryLabel: 'Học tập & Tri thức',
    description: 'Hùng biện cuốn hút, tự tin trình bày thuyết phục trước đám đông.',
    criteria: 'Đại diện tổ thuyết trình đạt điểm tối đa từ giáo viên bộ môn.',
    accentColor: '#F97316',
    gradientBg: 'from-orange-500/15 via-amber-500/10 to-transparent',
    rarity: 'Hiếm',
  },
  {
    id: 'b_challenge_conqueror',
    name: 'Chinh Phục Thử Thách',
    iconType: 'challenge_conqueror',
    category: 'academic',
    categoryLabel: 'Học tập & Tri thức',
    description: 'Dũng cảm nhận và hoàn thành xuất sắc các bài tập khó, dự án lớn.',
    criteria: 'Xung phong lên bảng giải các bài toán, câu hỏi thử thách của GV.',
    accentColor: '#06B6D4',
    gradientBg: 'from-cyan-500/15 via-teal-500/10 to-transparent',
    rarity: 'Hiếm',
  },

  // --- NHÓM 3: PHONG TRÀO & ĐOÀN HỘI (7) ---
  {
    id: 'b_union_torch',
    name: 'Ngọn Đuốc Đoàn Viên',
    iconType: 'union_torch',
    category: 'movement',
    categoryLabel: 'Phong trào & Đoàn hội',
    description: 'Nhiệt huyết xung kích trong các hoạt động Đoàn trường và Chi đoàn.',
    criteria: 'Được Bí thư Chi đoàn đề xuất khen thưởng phong trào thanh niên.',
    accentColor: '#EF4444',
    gradientBg: 'from-red-500/15 via-rose-500/10 to-transparent',
    rarity: 'Sử thi',
  },
  {
    id: 'b_arts_ambassador',
    name: 'Đại Sứ Văn Nghệ',
    iconType: 'arts_ambassador',
    category: 'movement',
    categoryLabel: 'Phong trào & Đoàn hội',
    description: 'Tài năng ca múa nhạc, khuấy động không khí sinh hoạt lớp.',
    criteria: 'Tham gia biểu diễn văn nghệ chào mừng 20/11, 26/3 hoặc sinh hoạt đầu tuần.',
    accentColor: '#EC4899',
    gradientBg: 'from-pink-500/15 via-purple-500/10 to-transparent',
    rarity: 'Hiếm',
  },
  {
    id: 'b_sports_mvp',
    name: 'Cầu Thủ Xuất Sắc',
    iconType: 'sports_mvp',
    category: 'movement',
    categoryLabel: 'Phong trào & Đoàn hội',
    description: 'Thi đấu quật cường, mang vinh quang thể thao về cho tập thể 10A5.',
    criteria: 'Đoạt giải trong các hội thao, giải bóng đá, bóng chuyền, điền kinh cấp trường.',
    accentColor: '#10B981',
    gradientBg: 'from-emerald-500/15 via-green-500/10 to-transparent',
    rarity: 'Sử thi',
  },
  {
    id: 'b_positive_energy',
    name: 'Năng Lượng Tích Cực',
    iconType: 'positive_energy',
    category: 'movement',
    categoryLabel: 'Phong trào & Đoàn hội',
    description: 'Nụ cười tỏa nắng, luôn mang đến sự vui vẻ, hòa đồng cho cả lớp.',
    criteria: 'Được tập thể yêu mến, luôn động viên bạn bè trong các hoạt động.',
    accentColor: '#FBBF24',
    gradientBg: 'from-amber-500/15 via-yellow-500/10 to-transparent',
    rarity: 'Phổ biến',
  },
  {
    id: 'b_heart_volunteer',
    name: 'Tình Nguyện Nhiệt Thành',
    iconType: 'heart_volunteer',
    category: 'movement',
    categoryLabel: 'Phong trào & Đoàn hội',
    description: 'Xung phong trong các đợt quyên góp, lao động tình nguyện vì cộng đồng.',
    criteria: 'Tham gia tích cực hoạt động đền ơn đáp nghĩa, kế hoạch nhỏ, nuôi heo đất.',
    accentColor: '#F43F5E',
    gradientBg: 'from-rose-500/15 via-red-500/10 to-transparent',
    rarity: 'Hiếm',
  },
  {
    id: 'b_fitness_warrior',
    name: 'Chiến Binh Hội Khỏe',
    iconType: 'fitness_warrior',
    category: 'movement',
    categoryLabel: 'Phong trào & Đoàn hội',
    description: 'Tập thể dục giữa giờ nghiêm túc, rèn luyện thân thể dẻo dai.',
    criteria: 'Không vắng tập thể dục giữa giờ, động tác dứt khoát, đúng nhịp chuẩn.',
    accentColor: '#6366F1',
    gradientBg: 'from-indigo-500/15 via-blue-500/10 to-transparent',
    rarity: 'Phổ biến',
  },
  {
    id: 'b_march_youth',
    name: 'Sao Sáng 26/3',
    iconType: 'march_youth',
    category: 'movement',
    categoryLabel: 'Phong trào & Đoàn hội',
    description: 'Huy hiệu kỷ niệm thành tích xuất sắc trong đợt thi đua Tháng Ba Đoàn.',
    criteria: 'Đóng góp lớn giúp lớp đạt giải cao trong Hội trại / Tuần lễ 26/3.',
    accentColor: '#EF4444',
    gradientBg: 'from-red-500/15 via-orange-500/10 to-transparent',
    rarity: 'Huyền thoại',
  },

  // --- NHÓM 4: TẬP THỂ & CÁN SỰ (7) ---
  {
    id: 'b_cadre_leader',
    name: 'Thủ Lĩnh Bản Lĩnh',
    iconType: 'cadre_leader',
    category: 'cadre',
    categoryLabel: 'Tập thể & Cán sự',
    description: 'Cán sự công tâm, chỉ huy quyết đoán, được tập thể tôn trọng.',
    criteria: 'Hoàn thành xuất sắc nhiệm vụ quản lý tổ hoặc ban cán sự lớp.',
    accentColor: '#F59E0B',
    gradientBg: 'from-amber-500/15 via-yellow-500/10 to-transparent',
    rarity: 'Sử thi',
  },
  {
    id: 'b_loving_guide',
    name: 'Người Cầm Lái Yêu Thương',
    iconType: 'loving_guide',
    category: 'cadre',
    categoryLabel: 'Tập thể & Cán sự',
    description: 'Luôn lắng nghe, thấu hiểu, gắn kết các thành viên như gia đình.',
    criteria: 'Gương mẫu hòa giải xung đột, xây dựng tinh thần đoàn kết keo sơn.',
    accentColor: '#0EA5E9',
    gradientBg: 'from-sky-500/15 via-blue-500/10 to-transparent',
    rarity: 'Sử thi',
  },
  {
    id: 'b_golden_hands',
    name: 'Bàn Tay Vàng Trực Nhật',
    iconType: 'golden_hands',
    category: 'cadre',
    categoryLabel: 'Tập thể & Cán sự',
    description: 'Trực nhật chu đáo, bảng sạch, giẻ ướt, phấn thơm, lớp tinh tươm.',
    criteria: 'Tổ chức hoặc trực tiếp thực hiện trực nhật đạt điểm tuyệt đối từ đoàn trường.',
    accentColor: '#14B8A6',
    gradientBg: 'from-teal-500/15 via-emerald-500/10 to-transparent',
    rarity: 'Phổ biến',
  },
  {
    id: 'b_rescue_knight',
    name: 'Hiệp Sĩ Cứu Trợ',
    iconType: 'rescue_knight',
    category: 'cadre',
    categoryLabel: 'Tập thể & Cán sự',
    description: 'Sẵn sàng trực nhật thay bạn bị ốm, hỗ trợ việc lớp không nề hà.',
    criteria: 'Ít nhất 2 lần tình nguyện gánh vác việc chung khi bạn có việc đột xuất.',
    accentColor: '#8B5CF6',
    gradientBg: 'from-purple-500/15 via-violet-500/10 to-transparent',
    rarity: 'Hiếm',
  },
  {
    id: 'b_team_spirit',
    name: 'Tinh Thần Đồng Đội',
    iconType: 'team_spirit',
    category: 'cadre',
    categoryLabel: 'Tập thể & Cán sự',
    description: 'Vì cái chung, luôn đặt danh dự tập thể 10A5 lên trên cá nhân.',
    criteria: 'Góp công lớn đưa tổ hoặc lớp đứng đầu trong các kỳ thi đua tuần.',
    accentColor: '#F59E0B',
    gradientBg: 'from-amber-500/15 via-orange-500/10 to-transparent',
    rarity: 'Sử thi',
  },
  {
    id: 'b_class_heart',
    name: 'Trái Tim 10A5',
    iconType: 'class_heart',
    category: 'cadre',
    categoryLabel: 'Tập thể & Cán sự',
    description: 'Tận tâm cống hiến thầm lặng vì một tập thể đoàn kết vững mạnh.',
    criteria: 'Được toàn thể lớp bình chọn là gương mặt truyền cảm hứng của 10A5.',
    accentColor: '#E11D48',
    gradientBg: 'from-rose-500/15 via-pink-500/10 to-transparent',
    rarity: 'Huyền thoại',
  },
  {
    id: 'b_star_10a5',
    name: 'Sao Vàng Vinh Dự 10A5',
    iconType: 'star_10a5',
    category: 'cadre',
    categoryLabel: 'Tập thể & Cán sự',
    description: 'Phần thưởng danh giá cao quý nhất do Giáo viên chủ nhiệm trao tặng.',
    criteria: 'Học sinh xuất sắc toàn diện cả học lực, đạo đức nề nếp và phong trào.',
    accentColor: '#F59E0B',
    gradientBg: 'from-amber-500/20 via-yellow-400/15 to-transparent',
    rarity: 'Huyền thoại',
  },
];

const STORAGE_KEY_BADGES = 'app_badges_catalog_10a5_v2';
const STORAGE_KEY_STUDENT_BADGES = 'app_student_badges_10a5_v2';
const STORAGE_KEY_STUDENT_ACTIVE_BADGE = 'app_student_active_badge_10a5_v2';

/**
 * Load badge catalog with GV customized names/criteria from localStorage.
 */
export function getBadgeCatalog(): AchievementBadge[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BADGES);
    if (!raw) return DEFAULT_30_BADGES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Merge with defaults to ensure all properties exist
      return DEFAULT_30_BADGES.map(def => {
        const custom = parsed.find((p: AchievementBadge) => p.id === def.id);
        return custom ? { ...def, ...custom } : def;
      });
    }
  } catch (e) {
    console.error('Error loading badge catalog:', e);
  }
  return DEFAULT_30_BADGES;
}

/**
 * Save updated badge catalog (e.g. GV edits name or criteria).
 */
export function saveBadgeCatalog(catalog: AchievementBadge[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_BADGES, JSON.stringify(catalog));
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
  } catch (e) {
    console.error('Error resetting badge catalog:', e);
  }
  return DEFAULT_30_BADGES;
}

/**
 * Get map of studentId -> list of awarded badgeIds
 */
export function getStudentBadgesMap(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STUDENT_BADGES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading student badges:', e);
  }
  // Initial default awards: give each student 2-3 starter badges based on their role/seat
  const defaultMap: Record<string, string[]> = {
    HS01: ['b_all_rounder', 'b_cadre_leader', 'b_star_10a5'], // Nguyễn Gia Khiêm (Lớp trưởng)
    HS02: ['b_union_torch', 'b_march_youth', 'b_positive_energy'], // Trần Minh Triết (Bí thư)
    HS03: ['b_diligent_quill', 'b_study_buddies', 'b_perfect_ten'], // Lê Hoàng Long (Lớp phó HT)
    HS04: ['b_green_classroom', 'b_golden_hands', 'b_orderly_desk'], // Phạm Gia Bảo (Lớp phó LĐ)
    HS05: ['b_iron_discipline', 'b_neat_attire', 'b_perfect_attendance'],
    HS12: ['b_cadre_leader', 'b_punctuality_hero'], // Tổ trưởng 2
    HS23: ['b_cadre_leader', 'b_creative_genius'], // Tổ trưởng 3
    HS34: ['b_cadre_leader', 'b_loving_guide'], // Tổ trưởng 4
  };
  return defaultMap;
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
