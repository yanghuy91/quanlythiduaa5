import diamondCrownImg from '../assets/images/rank_diamond_crown.jpg';
import platinumShieldImg from '../assets/images/rank_platinum_shield.jpg';
import goldLaurelImg from '../assets/images/rank_gold_laurel.jpg';
import cadreCrestImg from '../assets/images/badge_class_cadre.jpg';

/**
 * System of Special Avatar Frames & Emblems for Class 10A5
 * Quản lý Nề nếp & Thi đua Lớp học 10A5 - THPT Số 2 Đức Phổ
 */

export interface AvatarFrameConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  imageSrc?: string;
  category: 'rank' | 'honor' | 'cadre' | 'special';
  borderClass: string;
  bgGlowClass: string;
  tagClass: string;
  tagLabel: string;
  minRank?: number;
  maxRank?: number;
  requiresSpecialCondition?: string;
}

export const AVATAR_FRAMES: AvatarFrameConfig[] = [
  {
    id: 'diamond_champion',
    name: 'Khung Quán Quân Kim Cương (Top 1)',
    description: 'Vinh quang tột đỉnh dành cho học sinh dẫn đầu thi đua lớp',
    icon: '💎',
    imageSrc: diamondCrownImg,
    category: 'rank',
    borderClass: 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-surface shadow-[0_0_14px_rgba(6,182,212,0.85)]',
    bgGlowClass: 'from-cyan-400/25 via-blue-500/20 to-purple-500/25',
    tagClass: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-cyan-300/50',
    tagLabel: 'TOP 1',
    minRank: 1,
    maxRank: 1,
  },
  {
    id: 'platinum_elite',
    name: 'Khung Bạch Kim Tinh Anh (Top 2 - 3)',
    description: 'Dành cho các chiến binh xuất sắc trong top 3 của lớp',
    icon: '✨',
    imageSrc: platinumShieldImg,
    category: 'rank',
    borderClass: 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-surface shadow-[0_0_12px_rgba(129,140,248,0.8)]',
    bgGlowClass: 'from-indigo-400/25 via-purple-400/20 to-pink-400/25',
    tagClass: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-indigo-300/50',
    tagLabel: 'TOP 2-3',
    minRank: 2,
    maxRank: 3,
  },
  {
    id: 'gold_royal',
    name: 'Khung Hoàng Kim Danh Giá (Top 4 - 10)',
    description: 'Dành cho top 10 gương mặt ưu tú giữ vững phong độ nề nếp',
    icon: '🥇',
    imageSrc: goldLaurelImg,
    category: 'rank',
    borderClass: 'ring-2 ring-amber-400 ring-offset-2 ring-offset-surface shadow-[0_0_12px_rgba(251,191,36,0.8)]',
    bgGlowClass: 'from-amber-400/25 via-yellow-400/20 to-orange-400/25',
    tagClass: 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-amber-300/50',
    tagLabel: 'TOP 10',
    minRank: 4,
    maxRank: 10,
  },
  {
    id: 'iron_discipline',
    name: 'Khung Kỷ Luật Thép (100đ Hoàn Hảo)',
    description: 'Không một lần vi phạm, gương mẫu tuyệt đối trong học tập và nề nếp',
    icon: '🛡️',
    category: 'honor',
    borderClass: 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-surface shadow-[0_0_12px_rgba(16,185,129,0.7)]',
    bgGlowClass: 'from-emerald-400/25 to-teal-500/25',
    tagClass: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-300/50',
    tagLabel: 'KỶ LUẬT THÉP',
    requiresSpecialCondition: 'Điểm 100 tuyệt đối',
  },
  {
    id: 'lightning_comeback',
    name: 'Khung Tia Chớp Bứt Phá',
    description: 'Tiến bộ vượt bậc nhất tuần/tháng, nỗ lực sửa sai tuyệt vời',
    icon: '⚡',
    category: 'honor',
    borderClass: 'ring-2 ring-amber-500 ring-offset-2 ring-offset-surface shadow-[0_0_12px_rgba(245,158,11,0.7)]',
    bgGlowClass: 'from-amber-500/25 to-red-500/25',
    tagClass: 'bg-gradient-to-r from-amber-500 to-red-600 text-white shadow-red-300/50',
    tagLabel: 'TIẾN BỘ',
    requiresSpecialCondition: 'Tiến bộ vượt bậc',
  },
  {
    id: 'noble_paragon',
    name: 'Khung Gương Mẫu Tận Tụy (GV Trao)',
    description: 'Học sinh được Giáo viên chủ nhiệm đặc biệt khen thưởng tinh thần lớp',
    icon: '🌟',
    category: 'special',
    borderClass: 'ring-2 ring-purple-500 ring-offset-2 ring-offset-surface shadow-[0_0_12px_rgba(168,85,247,0.7)]',
    bgGlowClass: 'from-purple-500/25 via-pink-500/20 to-rose-500/25',
    tagClass: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-purple-300/50',
    tagLabel: 'GV KHEN THƯỞNG',
    requiresSpecialCondition: 'GVCN vinh danh',
  },
];

export interface CadreEmblemConfig {
  code: string;
  name: string;
  shortLabel: string;
  icon: string;
  imageSrc?: string;
  badgeClass: string;
  haloClass: string;
}

export const CADRE_EMBLEMS: Record<string, CadreEmblemConfig> = {
  LT: {
    code: 'LT',
    name: 'Lớp Trưởng Toàn Năng',
    shortLabel: 'Lớp Trưởng',
    icon: '👑',
    imageSrc: cadreCrestImg,
    badgeClass: 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white border-amber-300 shadow-amber-500/30',
    haloClass: 'ring-2 ring-amber-400',
  },
  BT: {
    code: 'BT',
    name: 'Bí Thư Tiên Phong',
    shortLabel: 'Bí Thư',
    icon: '🚩',
    imageSrc: cadreCrestImg,
    badgeClass: 'bg-gradient-to-r from-red-500 to-rose-600 text-white border-red-300 shadow-red-500/30',
    haloClass: 'ring-2 ring-red-400',
  },
  LP_HT: {
    code: 'LP_HT',
    name: 'Lớp Phó Học Tập Uyên Bác',
    shortLabel: 'LP Học tập',
    icon: '📖',
    imageSrc: cadreCrestImg,
    badgeClass: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-blue-300 shadow-blue-500/30',
    haloClass: 'ring-2 ring-blue-400',
  },
  LP_LD: {
    code: 'LP_LD',
    name: 'Lớp Phó Lao Động Nhiệt Huyết',
    shortLabel: 'LP Lao động',
    icon: '⚡',
    imageSrc: cadreCrestImg,
    badgeClass: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-300 shadow-emerald-500/30',
    haloClass: 'ring-2 ring-emerald-400',
  },
  TT_1: {
    code: 'TT_1',
    name: 'Tổ Trưởng Tổ 1',
    shortLabel: 'TT Tổ 1',
    icon: '🛡️',
    imageSrc: cadreCrestImg,
    badgeClass: 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white border-cyan-300 shadow-cyan-500/30',
    haloClass: 'ring-2 ring-cyan-400',
  },
  TT_2: {
    code: 'TT_2',
    name: 'Tổ Trưởng Tổ 2',
    shortLabel: 'TT Tổ 2',
    icon: '🛡️',
    imageSrc: cadreCrestImg,
    badgeClass: 'bg-gradient-to-r from-emerald-600 to-green-700 text-white border-emerald-300 shadow-emerald-500/30',
    haloClass: 'ring-2 ring-emerald-400',
  },
  TT_3: {
    code: 'TT_3',
    name: 'Tổ Trưởng Tổ 3',
    shortLabel: 'TT Tổ 3',
    icon: '🛡️',
    imageSrc: cadreCrestImg,
    badgeClass: 'bg-gradient-to-r from-amber-600 to-orange-700 text-white border-amber-300 shadow-amber-500/30',
    haloClass: 'ring-2 ring-amber-400',
  },
  TT_4: {
    code: 'TT_4',
    name: 'Tổ Trưởng Tổ 4',
    shortLabel: 'TT Tổ 4',
    icon: '🛡️',
    imageSrc: cadreCrestImg,
    badgeClass: 'bg-gradient-to-r from-purple-600 to-pink-700 text-white border-purple-300 shadow-purple-500/30',
    haloClass: 'ring-2 ring-purple-400',
  },
};

/**
 * Get frame config by ID
 */
export function getFrameById(frameId?: string): AvatarFrameConfig | undefined {
  if (!frameId) return undefined;
  return AVATAR_FRAMES.find((f) => f.id === frameId);
}

/**
 * Automatically determine frame based on rank or student profile
 */
export function getFrameForStudent(
  rank?: number,
  diemHienTai?: number,
  customFrameId?: string
): AvatarFrameConfig | undefined {
  if (customFrameId) {
    const custom = AVATAR_FRAMES.find((f) => f.id === customFrameId);
    if (custom) return custom;
  }

  if (rank !== undefined) {
    if (rank === 1) return AVATAR_FRAMES.find((f) => f.id === 'diamond_champion');
    if (rank >= 2 && rank <= 3) return AVATAR_FRAMES.find((f) => f.id === 'platinum_elite');
    if (rank >= 4 && rank <= 10) return AVATAR_FRAMES.find((f) => f.id === 'gold_royal');
  }

  if (diemHienTai !== undefined && diemHienTai >= 100) {
    return AVATAR_FRAMES.find((f) => f.id === 'iron_discipline');
  }

  return undefined;
}
