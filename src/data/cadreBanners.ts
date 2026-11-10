import bannerGv from '../assets/banners/banner_gv.jpg';
import bannerLt from '../assets/banners/banner_lt.jpg';
import bannerBt from '../assets/banners/banner_bt.jpg';
import bannerLpHt from '../assets/banners/banner_lp_ht.jpg';
import bannerLpLd from '../assets/banners/banner_lp_ld.jpg';
import bannerTt from '../assets/banners/banner_tt.jpg';
import bannerHs from '../assets/banners/banner_hs.jpg';
import { RoleCode } from '../types';

export interface CadreBannerConfig {
  roleKey: string;
  roleName: string;
  subtitle: string;
  imageSrc?: string;
  gradientFallback: string;
  accentBadge: string;
  tagline: string;
}

export const CADRE_BANNERS: Record<string, CadreBannerConfig> = {
  GV: {
    roleKey: 'GV',
    roleName: 'Giáo viên Chủ nhiệm',
    subtitle: 'Lớp 10A5 · THPT Số 2 Đức Phổ',
    imageSrc: bannerGv,
    gradientFallback: 'from-purple-900 via-indigo-950 to-slate-900',
    accentBadge: 'bg-amber-400 text-slate-950 border-white',
    tagline: 'Tận tâm - Thấu hiểu - Định hướng tương lai 🎓',
  },
  LT: {
    roleKey: 'LT',
    roleName: 'Lớp trưởng',
    subtitle: 'Chỉ Huy Trưởng Nề Nếp 10A5',
    imageSrc: bannerLt,
    gradientFallback: 'from-amber-900 via-yellow-950 to-slate-900',
    accentBadge: 'bg-amber-400 text-slate-950 border-white',
    tagline: 'Gương mẫu - Quyết đoán - Đồng hành cùng tập thể ⭐',
  },
  BT: {
    roleKey: 'BT',
    roleName: 'Bí thư Chi đoàn',
    subtitle: 'Ngọn Cờ Phong Trào & Thi Đua 26/3',
    imageSrc: bannerBt,
    gradientFallback: 'from-rose-900 via-red-950 to-slate-900',
    accentBadge: 'bg-rose-500 text-white border-rose-200',
    tagline: 'Nhiệt huyết - Sáng tạo - Tiên phong hành động 🚩',
  },
  LP_HT: {
    roleKey: 'LP_HT',
    roleName: 'Lớp phó Học tập',
    subtitle: 'Trụ Cột Tri Thức & Kỷ Cương Bài Vở',
    imageSrc: bannerLpHt,
    gradientFallback: 'from-emerald-900 via-teal-950 to-slate-900',
    accentBadge: 'bg-emerald-400 text-slate-950 border-white',
    tagline: 'Kiên trì - Vững vàng - Chinh phục tri thức 📖',
  },
  LP_LD: {
    roleKey: 'LP_LD',
    roleName: 'Lớp phó Lao động',
    subtitle: 'Chiến Binh Không Gian Xanh & Kỷ Luật',
    imageSrc: bannerLpLd,
    gradientFallback: 'from-orange-900 via-amber-950 to-slate-900',
    accentBadge: 'bg-orange-400 text-slate-950 border-white',
    tagline: 'Sạch đẹp - Chu đáo - Trách nhiệm vì lớp học xanh ⚡',
  },
  TT_1: {
    roleKey: 'TT_1',
    roleName: 'Tổ trưởng Tổ 1',
    subtitle: 'Dãy 1 Cửa Chính · 11 Thành Viên',
    imageSrc: bannerTt,
    gradientFallback: 'from-amber-900 via-slate-900 to-slate-950',
    accentBadge: 'bg-amber-400 text-slate-950 border-white',
    tagline: 'Bám sát nề nếp dãy cửa, nhắc nhở kịp thời 🛡️',
  },
  TT_2: {
    roleKey: 'TT_2',
    roleName: 'Tổ trưởng Tổ 2',
    subtitle: 'Dãy 2 Giữa · 11 Thành Viên',
    imageSrc: bannerTt,
    gradientFallback: 'from-emerald-900 via-slate-900 to-slate-950',
    accentBadge: 'bg-emerald-400 text-slate-950 border-white',
    tagline: 'Công tâm, gương mẫu, hỗ trợ tổ viên tiến bộ 🛡️',
  },
  TT_3: {
    roleKey: 'TT_3',
    roleName: 'Tổ trưởng Tổ 3',
    subtitle: 'Dãy 3 Giữa · 10 Thành Viên',
    imageSrc: bannerTt,
    gradientFallback: 'from-purple-900 via-slate-900 to-slate-950',
    accentBadge: 'bg-purple-400 text-slate-950 border-white',
    tagline: 'Đoàn kết, tự giác, hoàn thành xuất sắc nhiệm vụ 🛡️',
  },
  TT_4: {
    roleKey: 'TT_4',
    roleName: 'Tổ trưởng Tổ 4',
    subtitle: 'Dãy 4 Bàn GV · 10 Thành Viên',
    imageSrc: bannerTt,
    gradientFallback: 'from-blue-900 via-slate-900 to-slate-950',
    accentBadge: 'bg-sky-400 text-slate-950 border-white',
    tagline: 'Gần gũi thầy cô, quản lý nề nếp dãy trong nghiêm túc 🛡️',
  },
  TT: {
    roleKey: 'TT',
    roleName: 'Tổ trưởng',
    subtitle: 'Đầu Tàu Gương Mẫu Của Tổ',
    imageSrc: bannerTt,
    gradientFallback: 'from-indigo-900 via-slate-900 to-slate-950',
    accentBadge: 'bg-indigo-400 text-slate-950 border-white',
    tagline: 'Trách nhiệm, kỷ cương, cùng tổ viên thi đua dẫn đầu 🛡️',
  },
  HS: {
    roleKey: 'HS',
    roleName: 'Học sinh 10A5',
    subtitle: 'Tập thể Lớp 10A5 · THPT Số 2 Đức Phổ',
    imageSrc: bannerHs,
    gradientFallback: 'from-amber-600 via-sky-800 to-indigo-950',
    accentBadge: 'bg-sky-400 text-slate-950 border-white',
    tagline: 'Chăm ngoan - Sáng tạo - Đoàn kết vững bước tương lai 🌟',
  },
};

export function getCadreBanner(role: RoleCode, to?: number): CadreBannerConfig {
  if (role === 'TT') {
    const key = `TT_${to || 1}`;
    return CADRE_BANNERS[key] || CADRE_BANNERS.TT || CADRE_BANNERS.TT_1;
  }
  if (role === 'HS') {
    return CADRE_BANNERS.HS;
  }
  return CADRE_BANNERS[role] || CADRE_BANNERS.HS;
}
