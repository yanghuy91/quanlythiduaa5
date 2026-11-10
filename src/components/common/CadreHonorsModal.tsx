import React from 'react';
import { X, ShieldCheck, Sparkles, MapPin, Check, KeyRound } from 'lucide-react';
import { Student, CadreDelegatedPermission } from '../../types';
import { CADRE_ROLES_INFO } from '../../data/badgeData';
import { getCadreBanner } from '../../data/cadreBanners';

export const CADRE_DELEGATED_PERMISSION_LIST: Array<{
  id: CadreDelegatedPermission;
  label: string;
  shortDesc: string;
}> = [
  {
    id: 'CHAM_CA_LOP',
    label: 'Chấm thi đua cả 4 tổ',
    shortDesc: 'Mở khóa ghi nhận vi phạm & điểm cộng cho toàn bộ học sinh 4 tổ',
  },
  {
    id: 'DUYET_GIAI_TRINH',
    label: 'Duyệt giải trình',
    shortDesc: 'Chấp nhận hoặc từ chối đơn giải trình của học sinh thay GVCN',
  },
  {
    id: 'HUY_MOI_GHI_NHAN',
    label: 'Hủy ghi nhận bất kỳ',
    shortDesc: 'Được phép hủy bản ghi vi phạm nhầm lẫn của bất kỳ thành viên nào',
  },
  {
    id: 'QUAN_LY_TUAN',
    label: 'Quản lý tuần & tuần nghỉ',
    shortDesc: 'Đổi tuần hiện tại và đánh dấu tuần không có dữ liệu',
  },
  {
    id: 'QUAN_LY_VINH_DANH',
    label: 'Trao huy hiệu & Cờ đỏ',
    shortDesc: 'Chọn Học sinh xuất sắc / Cờ đỏ tuần để vinh danh trên bảng lớp',
  },
  {
    id: 'GOI_TEN_TRO_CHOI',
    label: '10 Trò chơi gọi tên',
    shortDesc: 'Mở bộ 10 trò chơi tương tác gọi tên ngẫu nhiên trên lớp',
  },
];

interface CadreHonorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  isTeacher?: boolean;
  delegatedPermissions?: Record<string, CadreDelegatedPermission[]>;
  onTogglePermission?: (studentId: string, perm: CadreDelegatedPermission) => void;
}

export const CadreHonorsModal: React.FC<CadreHonorsModalProps> = ({
  isOpen,
  onClose,
  students,
  isTeacher = false,
  delegatedPermissions = {},
  onTogglePermission,
}) => {
  if (!isOpen) return null;

  // Find all cadres
  const cadres = students.filter(s => s.vaiTro.some(r => r !== 'HS'));

  // Sort by cadre hierarchy: LT -> BT -> LP_HT -> LP_LD -> TT 1..4
  const rolePriority: Record<string, number> = {
    LT: 1,
    BT: 2,
    LP_HT: 3,
    LP_LD: 4,
    TT: 5,
  };

  const sortedCadres = [...cadres].sort((a, b) => {
    const aPrio = Math.min(...a.vaiTro.map(r => rolePriority[r] || 99));
    const bPrio = Math.min(...b.vaiTro.map(r => rolePriority[r] || 99));
    if (aPrio !== bPrio) return aPrio - bPrio;
    return (a.toTruongTo || 0) - (b.toTruongTo || 0);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="w-full max-w-3xl bg-surface border border-token rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with Leadership Crest Visual */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-r from-amber-500/15 via-blue-500/10 to-purple-500/15 border-b border-token flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-md shrink-0 bg-surface">
              <img
                src="/src/assets/images/cadre_leadership_crest_1794145976007.jpg"
                alt="Huy hiệu Ban Cán Sự 10A5"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {isTeacher
                    ? 'VINH DANH & PHÂN QUYỀN BAN CÁN SỰ LỚP (DÀNH CHO GVCN)'
                    : 'VINH DANH BAN CÁN SỰ LỚP (DO GVCN TRAO)'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-main leading-tight mt-0.5">
                Đội Ngũ Đầu Tàu Thi Đua ⭐
              </h3>
              <p className="text-xs text-muted mt-0.5">
                {isTeacher
                  ? 'GVCN có thể ủy quyền từng chức năng quản lý của mình cho bất kỳ thành viên Ban cán sự nào bên dưới'
                  : 'Danh hiệu danh dự do Giáo viên chủ nhiệm trao tặng · THPT Số 2 Đức Phổ · Năm học 2026-2027'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted hover:text-main hover:bg-surface-2 transition-colors cursor-pointer shrink-0"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cadre List */}
        <div className="p-4 sm:p-6 overflow-y-auto divide-y divide-token/60 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {sortedCadres.map(student => {
              const primaryRole = student.vaiTro.find(r => r !== 'HS') || 'HS';
              const info = CADRE_ROLES_INFO[primaryRole] || CADRE_ROLES_INFO.HS;
              const banner = getCadreBanner(primaryRole, student.toTruongTo || student.to);
              const displayTitle = primaryRole === 'TT' && student.toTruongTo
                ? `Tổ trưởng Tổ ${student.toTruongTo}`
                : info.title;
              const grantedPerms = delegatedPermissions[student.maHS] || [];

              return (
                <div
                  key={student.maHS}
                  className={`rounded-2xl border ${info.borderTone} bg-surface overflow-hidden transition-all hover:shadow-lg flex flex-col justify-between`}
                >
                  {/* Mini Role Banner Header */}
                  <div className="relative h-20 w-full overflow-hidden shrink-0">
                    {banner.imageSrc ? (
                      <img
                        src={banner.imageSrc}
                        alt={displayTitle}
                        className="w-full h-full object-cover object-center"
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-r ${banner.gradientFallback}`} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                    
                    <div className="absolute top-2 left-2.5 right-2.5 flex items-center justify-between">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border backdrop-blur-md ${banner.accentBadge}`}>
                        {displayTitle}
                      </span>
                      <span className="text-[10px] text-white/90 font-bold drop-shadow-sm">
                        {info.badgeLevel}
                      </span>
                    </div>

                    <div className="absolute bottom-1.5 left-2.5 right-2.5 text-[10px] text-white/90 italic drop-shadow-sm truncate">
                      "{banner.tagline}"
                    </div>
                  </div>

                  <div className="p-3.5 flex-1 flex flex-col justify-between gap-2.5">
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 shadow-inner"
                        style={{ 
                          backgroundColor: `${info.accentColor}25`, 
                          border: `1.5px solid ${info.accentColor}40` 
                        }}
                      >
                        {info.emoji}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-main mt-0.5 truncate">
                          {student.hoTen}
                        </h4>

                        <div className="text-[11px] text-muted flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-3 h-3 text-accent" />
                            <span>Tổ {student.to}</span>
                          </span>
                          {grantedPerms.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 font-bold text-[10px]">
                              <ShieldCheck className="w-3 h-3" />
                              +{grantedPerms.length} quyền GVCN
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-surface-2/60 border border-token text-[11px] text-muted space-y-1">
                      <div className="italic font-medium text-main text-[11px]">
                        "{info.motto}"
                      </div>
                      <div className="text-[10px] text-muted line-clamp-2">
                        <strong className="text-main">Trách nhiệm:</strong> {info.duty}
                      </div>
                    </div>

                    {/* Delegated Permissions Section */}
                    {(isTeacher || grantedPerms.length > 0) && (
                      <div className="pt-2 border-t border-token/70 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-muted">
                          <span className="flex items-center gap-1 text-main">
                            <KeyRound className="w-3 h-3 text-amber-500" />
                            {isTeacher ? 'Phân quyền đặc biệt của GVCN:' : 'Quyền được GVCN ủy nhiệm:'}
                          </span>
                          {isTeacher && (
                            <span className="text-[9px] font-semibold text-accent">Bấm để bật/tắt</span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {CADRE_DELEGATED_PERMISSION_LIST.map(perm => {
                            const isGranted = grantedPerms.includes(perm.id);
                            if (!isTeacher && !isGranted) return null;

                            return (
                              <button
                                key={perm.id}
                                type="button"
                                disabled={!isTeacher || !onTogglePermission}
                                onClick={() => onTogglePermission && onTogglePermission(student.maHS, perm.id)}
                                title={perm.shortDesc}
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                                  isTeacher ? 'cursor-pointer active:scale-95' : 'cursor-default'
                                } ${
                                  isGranted
                                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-800 shadow-2xs'
                                    : 'bg-surface-2 border-token text-muted hover:text-main hover:border-accent/40'
                                }`}
                              >
                                {isGranted && <Check className="w-3 h-3 text-emerald-600 shrink-0" />}
                                <span>{perm.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 text-center">
            <p className="text-xs text-muted max-w-md mx-auto italic">
              "Ban cán sự lớp là những bạn tiên phong rèn luyện bản thân, giữ gìn kỷ luật công bằng, khách quan và cùng nhau đưa tập thể 10A5 dẫn đầu phong trào thi đua toàn trường!"
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-surface-2 border-t border-token flex items-center justify-between">
          <div className="text-xs font-semibold text-muted">
            10A5 - THPT Số 2 Đức Phổ
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
