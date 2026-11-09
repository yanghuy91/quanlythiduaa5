import { RoleCode } from '../types';

export interface CadreRoleInfo {
  role: RoleCode;
  title: string;
  badgeName: string;
  emoji: string;
  shortEmoji: string;
  accentColor: string;
  gradientBg: string;
  borderTone: string;
  badgeLevel: string;
  motto: string;
  duty: string;
}

export const CADRE_ROLES_INFO: Record<RoleCode, CadreRoleInfo> = {
  LT: {
    role: 'LT',
    title: 'Lớp trưởng',
    badgeName: 'Chỉ Huy Trưởng 10A5',
    emoji: '👑',
    shortEmoji: '👑',
    accentColor: '#D97706', // Gold / Amber
    gradientBg: 'from-amber-500/20 via-amber-500/10 to-transparent',
    borderTone: 'border-amber-500/40',
    badgeLevel: 'Huy hiệu Hoàng Kim 🌟',
    motto: 'Gương mẫu - Quyết đoán - Đồng hành cùng tập thể',
    duty: 'Điều hành nề nếp chung toàn lớp, phối hợp giáo viên chủ nhiệm & đôn đốc ban cán sự.'
  },
  BT: {
    role: 'BT',
    title: 'Bí thư Chi đoàn',
    badgeName: 'Ngọn Cờ Phong Trào',
    emoji: '🚩',
    shortEmoji: '🚩',
    accentColor: '#E11D48', // Crimson / Rose
    gradientBg: 'from-rose-500/20 via-rose-500/10 to-transparent',
    borderTone: 'border-rose-500/40',
    badgeLevel: 'Huy hiệu Hồng Ngọc 🔥',
    motto: 'Nhiệt huyết - Sáng tạo - Tiên phong hành động',
    duty: 'Phụ trách công tác Đoàn, phong trào thanh niên, thi đua 26/3, hoạt động ngoài giờ.'
  },
  LP_HT: {
    role: 'LP_HT',
    title: 'Lớp phó Học tập',
    badgeName: 'Học Giả 10A5',
    emoji: '📖',
    shortEmoji: '📖',
    accentColor: '#059669', // Emerald
    gradientBg: 'from-emerald-500/20 via-emerald-500/10 to-transparent',
    borderTone: 'border-emerald-500/40',
    badgeLevel: 'Huy hiệu Lục Bảo 🌿',
    motto: 'Kiên trì - Vững vàng - Chinh phục tri thức',
    duty: 'Theo dõi việc chuẩn bị bài vở, kiểm tra bài tập 15 phút đầu giờ, thúc đẩy đôi bạn cùng tiến.'
  },
  LP_LD: {
    role: 'LP_LD',
    title: 'Lớp phó Lao động',
    badgeName: 'Chiến Binh Năng Động',
    emoji: '⚡',
    shortEmoji: '⚡',
    accentColor: '#D97706', // Orange / Amber
    gradientBg: 'from-orange-500/20 via-orange-500/10 to-transparent',
    borderTone: 'border-orange-500/40',
    badgeLevel: 'Huy hiệu Ánh Tia Chớp ⚡',
    motto: 'Sạch đẹp - Chu đáo - Trách nhiệm vì lớp học xanh',
    duty: 'Phân công trực nhật, bảo quản bàn ghế, quạt đèn, cơ sở vật chất phòng học.'
  },
  TT: {
    role: 'TT',
    title: 'Tổ trưởng',
    badgeName: 'Thủ Lĩnh Tổ Emulation',
    emoji: '🛡️',
    shortEmoji: '🛡️',
    accentColor: '#2563EB', // Sapphire
    gradientBg: 'from-blue-500/20 via-blue-500/10 to-transparent',
    borderTone: 'border-blue-500/40',
    badgeLevel: 'Huy hiệu Lam Thạch 🛡️',
    motto: 'Bám sát - Công tâm - Đoàn kết tổ viên',
    duty: 'Theo dõi nề nếp hàng ngày của 10-11 thành viên trong tổ, nhắc nhở và ghi nhận công bằng.'
  },
  GV: {
    role: 'GV',
    title: 'Giáo viên Chủ nhiệm',
    badgeName: 'Người Cầm Lái Yêu Thương',
    emoji: '🎓',
    shortEmoji: '🎓',
    accentColor: '#7C3AED', // Purple
    gradientBg: 'from-purple-500/20 via-purple-500/10 to-transparent',
    borderTone: 'border-purple-500/40',
    badgeLevel: 'Ban Cố Vấn 🌟',
    motto: 'Tận tâm - Thấu hiểu - Định hướng tương lai',
    duty: 'Quản lý toàn diện nề nếp, phê duyệt giải trình, đánh giá xếp loại thi đua tuần và tháng.'
  },
  HS: {
    role: 'HS',
    title: 'Học sinh 10A5',
    badgeName: 'Thành viên Tỏa Sáng',
    emoji: '✨',
    shortEmoji: '✨',
    accentColor: '#4F46E5', // Indigo
    gradientBg: 'from-indigo-500/10 via-indigo-500/5 to-transparent',
    borderTone: 'border-token',
    badgeLevel: 'Ngôi Sao Triển Vọng ⭐',
    motto: 'Nỗ lực mỗi ngày - Tự tin khẳng định mình',
    duty: 'Chấp hành nghiêm túc nội quy trường lớp, rèn luyện học tập và giữ gìn nề nếp văn minh.'
  }
};

export interface StudentAchievementBadge {
  id: string;
  title: string;
  emoji: string;
  description: string;
  criteria: string;
  category: 'discipline' | 'academic' | 'diligence' | 'spirit';
  accentColor: string;
}

export const STUDENT_ACHIEVEMENTS: StudentAchievementBadge[] = [
  {
    id: 'badge_iron_discipline',
    title: 'Kỷ Luật Thép',
    emoji: '🛡️',
    description: 'Giữ trọn vẹn 100 điểm, không vi phạm bất kỳ nội quy nào trong tuần.',
    criteria: '100 điểm tuần & 0 lỗi',
    category: 'discipline',
    accentColor: '#059669'
  },
  {
    id: 'badge_punctual_master',
    title: 'Chiến Thần Đúng Giờ',
    emoji: '⏰',
    description: 'Chuyên cần tuyệt đối, không trễ giờ học hay giờ chào cờ.',
    criteria: '0 lần đi muộn',
    category: 'discipline',
    accentColor: '#2563EB'
  },
  {
    id: 'badge_active_spirit',
    title: 'Ngôi Sao Sáng Tạo',
    emoji: '🌟',
    description: 'Tích cực tham gia hoạt động lớp, phong trào Đoàn và sinh hoạt tập thể.',
    criteria: 'Năng nổ phong trào',
    category: 'spirit',
    accentColor: '#E11D48'
  },
  {
    id: 'badge_academic_spark',
    title: 'Chăm Chỉ Chuyên Tâm',
    emoji: '📚',
    description: 'Luôn chuẩn bị bài đầy đủ, ghi chép cẩn thận và chú ý nghe giảng.',
    criteria: 'Đầy đủ bài vở',
    category: 'academic',
    accentColor: '#D97706'
  },
  {
    id: 'badge_green_classroom',
    title: 'Hiệp Sĩ Môi Trường',
    emoji: '🌿',
    description: 'Giữ gìn vệ sinh chung, bàn ghế ngăn nắp và tiết kiệm điện quạt.',
    criteria: 'Ý thức vệ sinh tốt',
    category: 'diligence',
    accentColor: '#10B981'
  },
  {
    id: 'badge_streak_master',
    title: 'Bất Khả Chiến Bại',
    emoji: '🔥',
    description: 'Duy trì xếp loại Tốt liên tiếp trong suốt nhiều tuần học.',
    criteria: 'Chuỗi xếp loại Tốt',
    category: 'spirit',
    accentColor: '#EA580C'
  }
];

// Teen-friendly motivational quotes for 10A5
export const DAILY_MOTTO_QUOTES = [
  '“Học hết mình - Chơi nhiệt tình - Nề nếp đỉnh cao!” 🚀',
  '“10A5: Không chỉ là một lớp học, đây là một đại gia đình!” ❤️',
  '“Mỗi ngày đến trường là một ngày tỏa sáng theo cách của bạn!” ✨',
  '“Kỷ luật tạo nên sức mạnh - Đoàn kết mang lại thành công!” 🌟',
  '“Chăm chỉ hôm nay - Gặt hái tương lai ngày mai!” 🎯'
];
