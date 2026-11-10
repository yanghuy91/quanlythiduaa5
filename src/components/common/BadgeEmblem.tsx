import React from 'react';

export type BadgeIconType =
  // Kỷ luật & Chuyên cần (8)
  | 'iron_discipline'
  | 'punctuality_hero'
  | 'neat_attire'
  | 'green_classroom'
  | 'orderly_desk'
  | 'self_discipline'
  | 'school_etiquette'
  | 'perfect_attendance'
  // Học tập & Tri thức (8)
  | 'all_rounder'
  | 'resilient_climber'
  | 'perfect_ten'
  | 'diligent_quill'
  | 'creative_genius'
  | 'study_buddies'
  | 'master_presenter'
  | 'challenge_conqueror'
  // Phong trào & Đoàn hội (7)
  | 'union_torch'
  | 'arts_ambassador'
  | 'sports_mvp'
  | 'positive_energy'
  | 'heart_volunteer'
  | 'fitness_warrior'
  | 'march_youth'
  // Tập thể & Cán sự
  | 'cadre_leader'
  | 'loving_guide'
  | 'golden_hands'
  | 'rescue_knight'
  | 'team_spirit'
  | 'class_heart'
  | 'star_10a5'
  | 'deputy_union_sec'
  | 'arts_sports_deputy'
  | 'red_flag_warden';

export function getCadreRoleEmblemType(role: string): BadgeIconType {
  switch (role) {
    case 'LT':
      return 'cadre_leader';
    case 'BT':
      return 'union_torch';
    case 'PBT':
      return 'deputy_union_sec';
    case 'LP_HT':
      return 'all_rounder';
    case 'LP_LD':
      return 'green_classroom';
    case 'LP_VT':
      return 'arts_sports_deputy';
    case 'CD':
      return 'red_flag_warden';
    case 'TT':
      return 'iron_discipline';
    case 'GV':
      return 'loving_guide';
    default:
      return 'star_10a5';
  }
}

interface BadgeEmblemProps {
  type: BadgeIconType | string;
  size?: '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  isUnlocked?: boolean;
}

const SIZE_MAP = {
  '2xs': 'w-3.5 h-3.5',
  xs: 'w-5 h-5',
  sm: 'w-7 h-7',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
  xl: 'w-20 h-20',
};

export const BadgeEmblem: React.FC<BadgeEmblemProps> = ({
  type,
  size = 'md',
  className = '',
  isUnlocked = true,
}) => {
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;
  const filterClass = isUnlocked ? '' : 'grayscale opacity-40 contrast-75';

  // SVG emblem definitions with rich gradients & vector paths
  const renderEmblem = () => {
    switch (type) {
      // 1. Kỷ Luật Thép
      case 'iron_discipline':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="g_iron_bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>
              <linearGradient id="g_silver" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F8FAFC" />
                <stop offset="100%" stopColor="#94A3B8" />
              </linearGradient>
            </defs>
            <polygon points="50,5 92,20 80,75 50,95 20,75 8,20" fill="url(#g_iron_bg)" stroke="#F8FAFC" strokeWidth="3" />
            <polygon points="50,14 84,26 74,70 50,86 26,70 16,26" fill="#065F46" />
            <path d="M50,22 L50,78 M32,48 L68,48" stroke="url(#g_silver)" strokeWidth="6" strokeLinecap="round" />
            <circle cx="50" cy="48" r="8" fill="#FCD34D" stroke="#D97706" strokeWidth="2" />
          </svg>
        );

      // 2. Chiến Thần Đúng Giờ
      case 'punctuality_hero':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="g_punc" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06B6D4" />
                <stop offset="100%" stopColor="#0284C7" />
              </linearGradient>
            </defs>
            <polygon points="50,6 88,28 88,72 50,94 12,72 12,28" fill="url(#g_punc)" stroke="#E0F2FE" strokeWidth="3" />
            <circle cx="50" cy="50" r="32" fill="#0C4A6E" stroke="#38BDF8" strokeWidth="2.5" />
            <circle cx="50" cy="50" r="28" fill="#082F49" />
            <circle cx="50" cy="50" r="3" fill="#38BDF8" />
            <polyline points="50,28 50,50 64,50" stroke="#FDE047" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="50" y1="23" x2="50" y2="26" stroke="#FFFFFF" strokeWidth="2" />
            <line x1="77" y1="50" x2="74" y2="50" stroke="#FFFFFF" strokeWidth="2" />
            <line x1="50" y1="77" x2="50" y2="74" stroke="#FFFFFF" strokeWidth="2" />
            <line x1="23" y1="50" x2="26" y2="50" stroke="#FFFFFF" strokeWidth="2" />
          </svg>
        );

      // 3. Tác Phong Chuẩn Mực
      case 'neat_attire':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="g_neat" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#1E3A8A" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="44" fill="url(#g_neat)" stroke="#93C5FD" strokeWidth="3" />
            {/* White Collar & Blue Tie */}
            <polygon points="50,22 30,38 42,42 50,28 58,42 70,38" fill="#FFFFFF" stroke="#DBEAFE" strokeWidth="1.5" />
            <polygon points="46,38 54,38 56,44 44,44" fill="#F59E0B" />
            <polygon points="45,44 55,44 57,70 50,78 43,70" fill="#EF4444" stroke="#DC2626" strokeWidth="1" />
            <polygon points="47,44 53,44 51,68 47,44" fill="#F87171" />
          </svg>
        );

      // 4. Không Gian Xanh
      case 'green_classroom':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="g_green" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22C55E" />
                <stop offset="100%" stopColor="#15803D" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="44" fill="url(#g_green)" stroke="#BBF7D0" strokeWidth="3" />
            {/* Sprout Leaf Emblem */}
            <path d="M50,78 C50,45 28,40 28,30 C28,18 42,18 50,30 C58,18 72,18 72,30 C72,40 50,45 50,78 Z" fill="#DCFCE7" stroke="#166534" strokeWidth="2" />
            <path d="M50,78 C50,55 64,48 68,36" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" fill="none" />
            <circle cx="50" cy="28" r="4" fill="#FDE047" />
          </svg>
        );

      // 5. Bàn Ghế Ngăn Nắp
      case 'orderly_desk':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="g_desk" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#B45309" />
              </linearGradient>
            </defs>
            <polygon points="50,8 90,30 90,70 50,92 10,70 10,30" fill="url(#g_desk)" stroke="#FEF3C7" strokeWidth="3" />
            {/* Isometric Neat Desk */}
            <polygon points="50,28 76,40 50,52 24,40" fill="#FEF3C7" stroke="#92400E" strokeWidth="2" />
            <polygon points="24,40 50,52 50,68 24,56" fill="#D97706" />
            <polygon points="76,40 50,52 50,68 76,56" fill="#B45309" />
            <rect x="42" y="32" width="16" height="10" transform="rotate(-15 50 37)" fill="#3B82F6" rx="1" />
          </svg>
        );

      // 6. Gương Mẫu Tự Giác
      case 'self_discipline':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="g_self" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#6D28D9" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="44" fill="url(#g_self)" stroke="#DDD6FE" strokeWidth="3" />
            {/* Medallion with Inner Star */}
            <circle cx="50" cy="50" r="32" fill="#4C1D95" stroke="#C4B5FD" strokeWidth="2" />
            <polygon points="50,22 58,40 78,40 62,52 68,72 50,60 32,72 38,52 22,40 42,40" fill="#FDE047" stroke="#D97706" strokeWidth="1.5" />
          </svg>
        );

      // 7. Văn Minh Học Đường
      case 'school_etiquette':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="g_etiq" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EC4899" />
                <stop offset="100%" stopColor="#BE185D" />
              </linearGradient>
            </defs>
            <path d="M50,10 C70,10 90,26 90,52 C90,75 68,90 50,96 C32,90 10,75 10,52 C10,26 30,10 50,10 Z" fill="url(#g_etiq)" stroke="#FCE7F3" strokeWidth="3" />
            {/* Heart & Handshake motif */}
            <path d="M50,30 C56,20 70,22 74,32 C78,44 64,58 50,70 C36,58 22,44 26,32 C30,22 44,20 50,30 Z" fill="#FFFFFF" />
            <circle cx="50" cy="46" r="6" fill="#F43F5E" />
          </svg>
        );

      // 8. Chuyên Cần Hoàn Hảo
      case 'perfect_attendance':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="g_attend" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#14B8A6" />
                <stop offset="100%" stopColor="#0F766E" />
              </linearGradient>
            </defs>
            <rect x="12" y="14" width="76" height="72" rx="16" fill="url(#g_attend)" stroke="#CCFBF1" strokeWidth="3" />
            {/* Calendar top */}
            <rect x="12" y="14" width="76" height="22" rx="12" fill="#0D9488" />
            <circle cx="30" cy="22" r="4" fill="#FFFFFF" />
            <circle cx="70" cy="22" r="4" fill="#FFFFFF" />
            {/* Big Golden Checkmark */}
            <path d="M32,54 L44,68 L68,40" stroke="#FDE047" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        );

      // 9. Học Bá Toàn Năng
      case 'all_rounder':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="g_gold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FBBF24" />
                <stop offset="100%" stopColor="#B45309" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="44" fill="#1E1B4B" stroke="url(#g_gold)" strokeWidth="4" />
            <polygon points="50,14 62,34 84,34 66,48 72,70 50,56 28,70 34,48 16,34 38,34" fill="url(#g_gold)" stroke="#FEF3C7" strokeWidth="1" />
            <path d="M30,66 C40,74 60,74 70,66" stroke="#FDE047" strokeWidth="3" strokeLinecap="round" fill="none" />
            <circle cx="50" cy="46" r="6" fill="#67E8F9" />
          </svg>
        );

      // 10. Vua Vượt Khó
      case 'resilient_climber':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="g_climb" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#4338CA" />
              </linearGradient>
            </defs>
            <polygon points="50,6 94,86 6,86" fill="url(#g_climb)" stroke="#E0E7FF" strokeWidth="3" />
            {/* Mountain peak */}
            <polygon points="50,6 66,40 54,34 50,42 46,34 34,40" fill="#FFFFFF" />
            <circle cx="50" cy="22" r="4" fill="#F59E0B" />
            {/* Ascent arrow */}
            <path d="M50,80 L50,48 M42,56 L50,48 L58,56" stroke="#FDE047" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );

      // 11. Ngôi Sao Điểm 10
      case 'perfect_ten':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="g_ten" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="44" fill="url(#g_ten)" stroke="#FFFBEB" strokeWidth="3.5" />
            <circle cx="50" cy="50" r="35" fill="#78350F" />
            {/* Number "10" */}
            <text x="50" y="60" textAnchor="middle" fill="#FDE047" fontSize="32" fontWeight="900" fontFamily="sans-serif">
              10
            </text>
            <polygon points="50,18 53,24 60,25 55,30 56,36 50,33 44,36 45,30 40,25 47,24" fill="#FFFFFF" />
          </svg>
        );

      // 12. Bút Vàng Chăm Chỉ
      case 'diligent_quill':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="g_quill" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0284C7" />
                <stop offset="100%" stopColor="#0369A1" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="44" fill="url(#g_quill)" stroke="#BAE6FD" strokeWidth="3" />
            {/* Scroll book background */}
            <rect x="22" y="36" width="56" height="42" rx="4" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="2" />
            <line x1="28" y1="46" x2="52" y2="46" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
            <line x1="28" y1="56" x2="68" y2="56" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
            <line x1="28" y1="66" x2="60" y2="66" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
            {/* Golden Fountain Pen */}
            <polygon points="76,14 62,28 66,32 80,18" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />
            <polygon points="62,28 46,62 50,64 66,32" fill="#FDE047" stroke="#D97706" strokeWidth="1" />
            <polygon points="46,62 42,70 48,67" fill="#1E293B" />
          </svg>
        );

      // 13. Thần Đồng Sáng Tạo
      case 'creative_genius':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="g_creat" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#A855F7" />
                <stop offset="100%" stopColor="#7E22CE" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="44" fill="url(#g_creat)" stroke="#F3E8FF" strokeWidth="3" />
            {/* Glowing Bulb */}
            <path d="M50,22 C38,22 32,32 32,42 C32,50 38,56 42,62 L58,62 C62,56 68,50 68,42 C68,32 62,22 50,22 Z" fill="#FDE047" stroke="#CA8A04" strokeWidth="2" />
            <rect x="44" y="64" width="12" height="4" fill="#CBD5E1" rx="1" />
            <rect x="46" y="69" width="8" height="3" fill="#94A3B8" rx="1" />
            {/* Radiating Sparkles */}
            <line x1="50" y1="12" x2="50" y2="17" stroke="#FEF08A" strokeWidth="3" strokeLinecap="round" />
            <line x1="26" y1="26" x2="30" y2="30" stroke="#FEF08A" strokeWidth="3" strokeLinecap="round" />
            <line x1="74" y1="26" x2="70" y2="30" stroke="#FEF08A" strokeWidth="3" strokeLinecap="round" />
          </svg>
        );

      // 14. Đôi Bạn Cùng Tiến
      case 'study_buddies':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="g_bud" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#0284C7" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="44" fill="url(#g_bud)" stroke="#E0F2FE" strokeWidth="3" />
            {/* Two interlocking silhouettes & heart */}
            <circle cx="36" cy="38" r="10" fill="#FFFFFF" />
            <circle cx="64" cy="38" r="10" fill="#FFFFFF" />
            <path d="M22,68 C22,54 34,50 38,54 C42,58 48,58 50,56 C52,58 58,58 62,54 C66,50 78,54 78,68 Z" fill="#FFFFFF" />
            <path d="M50,30 C53,24 61,24 63,30 C65,37 50,46 50,46 C50,46 35,37 37,30 C39,24 47,24 50,30 Z" fill="#EF4444" />
          </svg>
        );

      // 15. Thủ Lĩnh Thuyết Trình
      case 'master_presenter':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="g_pres" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F97316" />
                <stop offset="100%" stopColor="#C2410C" />
              </linearGradient>
            </defs>
            <polygon points="50,6 92,28 92,72 50,94 8,72 8,28" fill="url(#g_pres)" stroke="#FFEDD5" strokeWidth="3" />
            {/* Microphone */}
            <rect x="42" y="24" width="16" height="26" rx="8" fill="#F8FAFC" stroke="#475569" strokeWidth="2" />
            <line x1="42" y1="34" x2="58" y2="34" stroke="#94A3B8" strokeWidth="1.5" />
            <path d="M34,42 C34,54 42,60 50,60 C58,60 66,54 66,42" stroke="#FDE047" strokeWidth="3" fill="none" strokeLinecap="round" />
            <line x1="50" y1="60" x2="50" y2="74" stroke="#FDE047" strokeWidth="4" />
            <line x1="38" y1="74" x2="62" y2="74" stroke="#FDE047" strokeWidth="4" strokeLinecap="round" />
          </svg>
        );

      // 16. Chinh Phục Thử Thách
      case 'challenge_conqueror':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="g_chal" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06B6D4" />
                <stop offset="100%" stopColor="#0891B2" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="44" fill="url(#g_chal)" stroke="#CFFAFE" strokeWidth="3" />
            {/* Diamond Cut Gem */}
            <polygon points="50,18 78,38 68,76 32,76 22,38" fill="#E0F2FE" stroke="#0284C7" strokeWidth="2" />
            <polygon points="50,18 64,38 50,76 36,38" fill="#38BDF8" />
            <polygon points="50,18 22,38 36,38" fill="#7DD3FC" />
            <polygon points="50,18 78,38 64,38" fill="#BAE6FD" />
          </svg>
        );

      // 17. Ngọn Đuốc Đoàn Viên
      case 'union_torch':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="g_torch" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="100%" stopColor="#991B1B" />
              </linearGradient>
            </defs>
            <polygon points="50,5 92,20 80,75 50,95 20,75 8,20" fill="url(#g_torch)" stroke="#FEE2E2" strokeWidth="3" />
            {/* Flaming Torch */}
            <path d="M50,16 C58,26 64,32 58,44 C54,50 46,50 42,44 C36,34 44,24 50,16 Z" fill="#FDE047" />
            <path d="M50,22 C54,28 58,34 54,40 C52,44 48,44 46,40 C42,34 46,26 50,22 Z" fill="#F97316" />
            <polygon points="42,50 58,50 54,74 46,74" fill="#F8FAFC" stroke="#475569" strokeWidth="1.5" />
            <rect x="40" y="48" width="20" height="4" fill="#D97706" rx="1" />
          </svg>
        );

      // 18. Đại Sứ Văn Nghệ
      case 'arts_ambassador':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="g_arts" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EC4899" />
                <stop offset="100%" stopColor="#9D174D" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="44" fill="url(#g_arts)" stroke="#FCE7F3" strokeWidth="3" />
            {/* Lyre / Harp with Musical Note */}
            <path d="M32,24 C32,60 40,72 50,72 C60,72 68,60 68,24" stroke="#FDE047" strokeWidth="5" fill="none" strokeLinecap="round" />
            <line x1="28" y1="28" x2="72" y2="28" stroke="#FDE047" strokeWidth="5" strokeLinecap="round" />
            <line x1="44" y1="28" x2="44" y2="68" stroke="#F8FAFC" strokeWidth="2" />
            <line x1="56" y1="28" x2="56" y2="68" stroke="#F8FAFC" strokeWidth="2" />
            <circle cx="50" cy="48" r="6" fill="#FDE047" />
          </svg>
        );

      // 19. Cầu Thủ Xuất Sắc
      case 'sports_mvp':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="g_sport" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="44" fill="url(#g_sport)" stroke="#D1FAE5" strokeWidth="3" />
            {/* Sport Ball & Laurel */}
            <circle cx="50" cy="50" r="26" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2.5" />
            <polygon points="50,42 58,48 55,57 45,57 42,48" fill="#1E293B" />
            <line x1="50" y1="42" x2="50" y2="26" stroke="#1E293B" strokeWidth="2" />
            <line x1="58" y1="48" x2="73" y2="44" stroke="#1E293B" strokeWidth="2" />
            <line x1="55" y1="57" x2="65" y2="70" stroke="#1E293B" strokeWidth="2" />
            <line x1="45" y1="57" x2="35" y2="70" stroke="#1E293B" strokeWidth="2" />
            <line x1="42" y1="48" x2="27" y2="44" stroke="#1E293B" strokeWidth="2" />
          </svg>
        );

      // 20. Năng Lượng Tích Cực
      case 'positive_energy':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="g_sun" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FBBF24" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="44" fill="url(#g_sun)" stroke="#FEF3C7" strokeWidth="3" />
            {/* Radiant Sun Smiling face */}
            <circle cx="50" cy="50" r="26" fill="#FFFBEB" stroke="#B45309" strokeWidth="2" />
            <circle cx="42" cy="44" r="3.5" fill="#B45309" />
            <circle cx="58" cy="44" r="3.5" fill="#B45309" />
            <path d="M40,54 Q50,66 60,54" stroke="#B45309" strokeWidth="3" strokeLinecap="round" fill="none" />
            {/* Sunbeams */}
            <circle cx="50" cy="14" r="3" fill="#FFFFFF" />
            <circle cx="86" cy="50" r="3" fill="#FFFFFF" />
            <circle cx="50" cy="86" r="3" fill="#FFFFFF" />
            <circle cx="14" cy="50" r="3" fill="#FFFFFF" />
          </svg>
        );

      // 21. Tình Nguyện Nhiệt Thành
      case 'heart_volunteer':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="g_vol" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F43F5E" />
                <stop offset="100%" stopColor="#9F1239" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="44" fill="url(#g_vol)" stroke="#FFE4E6" strokeWidth="3" />
            {/* Heart with Helping Hand */}
            <path d="M50,30 C56,18 74,20 78,34 C82,48 64,64 50,76 C36,64 18,48 22,34 C26,20 44,18 50,30 Z" fill="#FFFFFF" stroke="#BE123C" strokeWidth="1.5" />
            <path d="M38,50 L48,58 L62,42" stroke="#E11D48" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        );

      // 22. Chiến Binh Hội Khỏe
      case 'fitness_warrior':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="g_fit" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#3730A3" />
              </linearGradient>
            </defs>
            <polygon points="50,6 88,28 88,72 50,94 12,72 12,28" fill="url(#g_fit)" stroke="#E0E7FF" strokeWidth="3" />
            {/* Dumbbell & Wings */}
            <rect x="24" y="46" width="52" height="8" rx="4" fill="#FFFFFF" stroke="#312E81" strokeWidth="1.5" />
            <rect x="20" y="38" width="10" height="24" rx="4" fill="#F59E0B" stroke="#B45309" strokeWidth="1.5" />
            <rect x="70" y="38" width="10" height="24" rx="4" fill="#F59E0B" stroke="#B45309" strokeWidth="1.5" />
            <polygon points="50,22 53,28 60,29 55,34 56,40 50,37 44,40 45,34 40,29 47,28" fill="#FDE047" />
          </svg>
        );

      // 23. Sao Sáng Tháng Ba (26/3)
      case 'march_youth':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="g_youth" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="100%" stopColor="#B91C1C" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="44" fill="url(#g_youth)" stroke="#FEF08A" strokeWidth="3" />
            {/* Youth Star with 26/3 text */}
            <polygon points="50,14 62,38 88,38 67,54 75,78 50,62 25,78 33,54 12,38 38,38" fill="#FDE047" stroke="#D97706" strokeWidth="1.5" />
            <text x="50" y="55" textAnchor="middle" fill="#B91C1C" fontSize="13" fontWeight="900" fontFamily="sans-serif">
              26/3
            </text>
          </svg>
        );

      // 24. Cán Sự Bản Lĩnh
      case 'cadre_leader':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="g_lead" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#78350F" />
              </linearGradient>
            </defs>
            <polygon points="50,4 94,22 84,78 50,96 16,78 6,22" fill="url(#g_lead)" stroke="#FEF3C7" strokeWidth="3" />
            {/* Leadership Crown */}
            <polygon points="30,62 30,42 42,50 50,34 58,50 70,42 70,62" fill="#FFFFFF" stroke="#92400E" strokeWidth="2" />
            <circle cx="30" cy="42" r="3" fill="#EF4444" />
            <circle cx="50" cy="34" r="3.5" fill="#3B82F6" />
            <circle cx="70" cy="42" r="3" fill="#10B981" />
            <circle cx="50" cy="56" r="4" fill="#F59E0B" />
          </svg>
        );

      // 25. Người Cầm Lái Yêu Thương
      case 'loving_guide':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="g_helm" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0EA5E9" />
                <stop offset="100%" stopColor="#0369A1" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="44" fill="url(#g_helm)" stroke="#BAE6FD" strokeWidth="3" />
            {/* Ship Helm */}
            <circle cx="50" cy="50" r="28" fill="none" stroke="#FDE047" strokeWidth="5" />
            <circle cx="50" cy="50" r="12" fill="#0C4A6E" stroke="#FDE047" strokeWidth="3" />
            {/* Spokes */}
            <line x1="50" y1="12" x2="50" y2="88" stroke="#FDE047" strokeWidth="4" />
            <line x1="12" y1="50" x2="88" y2="50" stroke="#FDE047" strokeWidth="4" />
            <line x1="23" y1="23" x2="77" y2="77" stroke="#FDE047" strokeWidth="4" />
            <line x1="77" y1="23" x2="23" y2="77" stroke="#FDE047" strokeWidth="4" />
          </svg>
        );

      // 26. Bàn Tay Vàng Trực Nhật
      case 'golden_hands':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="g_clean" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#14B8A6" />
                <stop offset="100%" stopColor="#0D9488" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="44" fill="url(#g_clean)" stroke="#CCFBF1" strokeWidth="3" />
            {/* Sparkle and Broom */}
            <path d="M30,76 L66,32 M66,32 L74,40 M66,32 L60,24" stroke="#FDE047" strokeWidth="5" strokeLinecap="round" />
            <polygon points="24,80 34,70 42,78 30,86" fill="#F59E0B" />
            {/* Sparkles */}
            <polygon points="70,18 73,24 80,26 74,30 75,37 70,33 64,37 65,30 60,26 67,24" fill="#FFFFFF" />
            <polygon points="30,30 32,34 37,35 33,38 34,42 30,40 26,42 27,38 23,35 28,34" fill="#FFFFFF" />
          </svg>
        );

      // 27. Hiệp Sĩ Cứu Hộ
      case 'rescue_knight':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="g_res" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#5B21B6" />
              </linearGradient>
            </defs>
            <polygon points="50,6 90,24 82,78 50,96 18,78 10,24" fill="url(#g_res)" stroke="#EDE9FE" strokeWidth="3" />
            {/* Medical Shield Cross */}
            <rect x="42" y="30" width="16" height="40" fill="#FFFFFF" rx="3" />
            <rect x="30" y="42" width="40" height="16" fill="#FFFFFF" rx="3" />
            <circle cx="50" cy="50" r="5" fill="#EF4444" />
          </svg>
        );

      // 28. Tinh Thần Đồng Đội
      case 'team_spirit':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="g_team" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#EA580C" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="44" fill="url(#g_team)" stroke="#FEF3C7" strokeWidth="3" />
            {/* 3 Interlocking Circles */}
            <circle cx="50" cy="36" r="16" fill="none" stroke="#FFFFFF" strokeWidth="4" />
            <circle cx="36" cy="60" r="16" fill="none" stroke="#FDE047" strokeWidth="4" />
            <circle cx="64" cy="60" r="16" fill="none" stroke="#38BDF8" strokeWidth="4" />
          </svg>
        );

      // 29. Trái Tim 10A5
      case 'class_heart':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="g_heart" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E11D48" />
                <stop offset="100%" stopColor="#881337" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="44" fill="url(#g_heart)" stroke="#FECDD3" strokeWidth="3" />
            {/* Heart with 10A5 banner */}
            <path d="M50,28 C56,16 76,18 80,34 C84,52 64,68 50,80 C36,68 16,52 20,34 C24,18 44,16 50,28 Z" fill="#FFFFFF" />
            <rect x="24" y="44" width="52" height="18" rx="4" fill="#BE123C" />
            <text x="50" y="58" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="900" fontFamily="sans-serif">
              10A5 ❤️
            </text>
          </svg>
        );

      // 31. Phó Bí Thư Chi Đoàn (deputy_union_sec)
      case 'deputy_union_sec':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="g_pbt" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F43F5E" />
                <stop offset="55%" stopColor="#E11D48" />
                <stop offset="100%" stopColor="#9F1239" />
              </linearGradient>
              <linearGradient id="g_pbt_flame" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#F97316" />
                <stop offset="60%" stopColor="#FACC15" />
                <stop offset="100%" stopColor="#FEF08A" />
              </linearGradient>
            </defs>
            {/* Shield Crest */}
            <path
              d="M50,6 L86,20 L86,52 C86,74 68,89 50,95 C32,89 14,74 14,52 L14,20 Z"
              fill="url(#g_pbt)"
              stroke="#FFE4E6"
              strokeWidth="3"
            />
            {/* Inner Gold Ring */}
            <circle cx="50" cy="48" r="25" fill="#881337" stroke="#FDE047" strokeWidth="2.2" />
            {/* Youth Union Flame */}
            <path
              d="M50,24 C56,34 65,39 62,51 C60,60 54,66 50,67 C46,66 40,60 38,51 C35,39 44,34 50,24 Z"
              fill="url(#g_pbt_flame)"
            />
            {/* Bright Yellow Star at center of Flame */}
            <polygon
              points="50,36 53,44 61,44 55,49 57,57 50,52 43,57 45,49 39,44 47,44"
              fill="#FFFFFF"
            />
            {/* Bottom Ribbon PBT */}
            <rect x="28" y="72" width="44" height="14" rx="4" fill="#FDE047" stroke="#881337" strokeWidth="1.5" />
            <text x="50" y="82" textAnchor="middle" fill="#881337" fontSize="9.5" fontWeight="900" fontFamily="sans-serif">
              PHÓ BÍ THƯ
            </text>
          </svg>
        );

      // 32. Lớp Phó Văn Thể (arts_sports_deputy)
      case 'arts_sports_deputy':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="g_lpvt" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D946EF" />
                <stop offset="50%" stopColor="#A21CAF" />
                <stop offset="100%" stopColor="#6B21A8" />
              </linearGradient>
            </defs>
            {/* Octagonal Star Medal */}
            <polygon
              points="50,5 64,15 82,15 86,33 95,50 86,67 82,85 64,85 50,95 36,85 18,85 14,67 5,50 14,33 18,15 36,15"
              fill="url(#g_lpvt)"
              stroke="#FAE8FF"
              strokeWidth="2.8"
            />
            <circle cx="50" cy="48" r="26" fill="#4A044E" stroke="#FDE047" strokeWidth="2.2" />
            {/* Musical Note & Star */}
            <path
              d="M46,56 L46,31 L64,27 L64,51"
              fill="none"
              stroke="#FDE047"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="41" cy="57" r="6" fill="#FDE047" />
            <circle cx="59" cy="52" r="6" fill="#38BDF8" />
            <polygon
              points="35,29 37,34 42,34 38,37 39,42 35,39 31,42 32,37 28,34 33,34"
              fill="#F472B6"
            />
            {/* Bottom Ribbon VĂN THỂ */}
            <rect x="24" y="72" width="52" height="14" rx="4" fill="#FDE047" stroke="#4A044E" strokeWidth="1.5" />
            <text x="50" y="82" textAnchor="middle" fill="#4A044E" fontSize="9.5" fontWeight="900" fontFamily="sans-serif">
              LP VĂN THỂ
            </text>
          </svg>
        );

      // 33. Cờ Đỏ Nề Nếp (red_flag_warden)
      case 'red_flag_warden':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="g_cd" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="55%" stopColor="#DC2626" />
                <stop offset="100%" stopColor="#991B1B" />
              </linearGradient>
            </defs>
            {/* Golden Rim Badge */}
            <circle cx="50" cy="50" r="45" fill="url(#g_cd)" stroke="#FDE047" strokeWidth="3.5" />
            <circle cx="50" cy="50" r="38" fill="none" stroke="#FCA5A5" strokeWidth="1.5" strokeDasharray="4 3" />
            {/* Flagpole */}
            <line x1="32" y1="22" x2="32" y2="74" stroke="#FDE047" strokeWidth="3.8" strokeLinecap="round" />
            <circle cx="32" cy="20" r="3.5" fill="#FEF08A" />
            {/* Waving Red Flag with Golden Border */}
            <path
              d="M34,24 C46,20 58,29 72,24 L70,50 C56,55 46,46 34,50 Z"
              fill="#B91C1C"
              stroke="#FDE047"
              strokeWidth="2.2"
            />
            {/* Golden Star on Flag */}
            <polygon
              points="52,30 54,35 60,35 55,39 57,44 52,41 47,44 49,39 44,35 50,35"
              fill="#FDE047"
            />
            {/* Bottom Ribbon CỜ ĐỎ */}
            <rect x="28" y="70" width="44" height="14" rx="4" fill="#FDE047" stroke="#7F1D1D" strokeWidth="1.5" />
            <text x="50" y="80" textAnchor="middle" fill="#7F1D1D" fontSize="10" fontWeight="900" fontFamily="sans-serif">
              CỜ ĐỎ 10A5
            </text>
          </svg>
        );

      // 30. Ngôi Sao Danh Dự 10A5 (Grandmaster)
      case 'star_10a5':
      default:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
            <defs>
              <linearGradient id="g_star" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDE047" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#B45309" />
              </linearGradient>
            </defs>
            {/* Grand 8-point faceted star */}
            <polygon points="50,2 62,26 88,14 76,40 100,50 76,60 88,86 62,74 50,98 38,74 12,86 24,60 0,50 24,40 12,14 38,26" fill="url(#g_star)" stroke="#FFFBEB" strokeWidth="2.5" />
            <circle cx="50" cy="50" r="22" fill="#1E1B4B" stroke="#FDE047" strokeWidth="2.5" />
            <polygon points="50,34 54,44 65,45 56,52 59,62 50,56 41,62 44,52 35,45 46,44" fill="#FDE047" />
          </svg>
        );
    }
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${sizeClass} ${filterClass} ${className}`}
      title={type}
    >
      {renderEmblem()}
    </div>
  );
};
