import React, { useState } from 'react';
import { 
  Check, 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle,
  Armchair,
  BookOpen,
  DoorOpen,
  UserCheck,
  Sparkles,
  Tag,
  LayoutGrid
} from 'lucide-react';
import { Student, SeatLayoutNode, StudentWeekSummary, RoleCode } from '../../types';
import { ROLE_CONFIG } from '../../data/mockData';
import { getSeatingMapDisplayName, getStudentAvatarInitial } from '../../utils/vietnamese';
import { getBadgeCatalog, getStudentActiveBadge, getStudentBadgesMap } from '../../data/badgeCatalog';
import { BadgeEmblem } from '../common/BadgeEmblem';

interface SeatGridProps {
  layout: SeatLayoutNode[];
  students: Student[];
  studentSummaries?: Record<string, StudentWeekSummary>;
  selectedStudentIds: string[];
  onSelectStudent: (student: Student) => void;
  viewerRole?: RoleCode;
  viewerTo?: number; // 1..4 if viewer is TT
  showStatusColors?: boolean; // false during login
  isMultiSelect?: boolean;
  initialDisplayMode?: 'compact' | 'avatar_badge';
  onInspectStudent?: (student: Student) => void;
}

export const SeatGrid: React.FC<SeatGridProps> = ({
  layout,
  students,
  studentSummaries = {},
  selectedStudentIds,
  onSelectStudent,
  viewerRole,
  viewerTo,
  showStatusColors = true,
  isMultiSelect = false,
  initialDisplayMode,
  onInspectStudent,
}) => {
  const [activeDãyTab, setActiveDãyTab] = useState<'all' | 'to-4' | 'to-3' | 'to-2' | 'to-1'>('all');
  
  // Seat Display Mode: 'avatar_badge' (rich visual with photo & honors badge) or 'compact' (name & seat number)
  const [userDisplayMode, setUserDisplayMode] = useState<'compact' | 'avatar_badge'>(() => {
    if (initialDisplayMode) return initialDisplayMode;
    try {
      const saved = localStorage.getItem('seating_display_mode');
      if (saved === 'compact' || saved === 'avatar_badge') return saved;
    } catch {}
    return 'avatar_badge'; // default to avatar & badge mode!
  });

  // Never show avatars before login (!showStatusColors)
  const displayMode = !showStatusColors ? 'compact' : userDisplayMode;

  const handleToggleDisplayMode = (mode: 'compact' | 'avatar_badge') => {
    setUserDisplayMode(mode);
    try {
      localStorage.setItem('seating_display_mode', mode);
    } catch {}
  };

  // Badge Catalog Map
  const badgeCatalog = React.useMemo(() => getBadgeCatalog(), []);
  const badgeCatalogMap = React.useMemo(() => {
    const map = new Map<string, typeof badgeCatalog[0]>();
    badgeCatalog.forEach(b => map.set(b.id, b));
    return map;
  }, [badgeCatalog]);

  // Student Badges Map
  const studentBadgesMap = React.useMemo(() => getStudentBadgesMap(), []);

  // Map student by ID
  const studentMap = React.useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach(s => map.set(s.maHS, s));
    return map;
  }, [students]);

  // Determine if a seat is locked for this viewer
  // Tổ trưởng: only members of their group are clickable
  const isSeatLockedForViewer = (student?: Student): boolean => {
    if (!student) return false;
    if (viewerRole === 'TT' && viewerTo !== undefined) {
      return student.to !== viewerTo;
    }
    return false;
  };

  // Group nodes by row
  const rows = React.useMemo(() => {
    const grouped: Record<number, SeatLayoutNode[]> = {};
    layout.forEach(node => {
      if (!grouped[node.hang]) {
        grouped[node.hang] = [];
      }
      grouped[node.hang].push(node);
    });

    Object.keys(grouped).forEach(r => {
      grouped[Number(r)].sort((a, b) => a.cot - b.cot);
    });

    return grouped;
  }, [layout]);

  // Filter columns based on mobile tab if not 'all'
  const shouldRenderCol = (cot: number): boolean => {
    if (activeDãyTab === 'all') return true;
    if (activeDãyTab === 'to-4') return cot === 0 || cot === 1;
    if (activeDãyTab === 'to-3') return cot === 3 || cot === 4;
    if (activeDãyTab === 'to-2') return cot === 6 || cot === 7;
    if (activeDãyTab === 'to-1') return cot === 9 || cot === 10;
    return true;
  };

  // Extract given name (last word) or short name for high legibility
  const getDisplayName = (student: Student): { main: string; sub: string } => {
    const parts = student.hoTen.trim().split(/\s+/);
    const lastName = parts[parts.length - 1] || student.hoTen;
    const prefix = parts.slice(0, -1).map(p => p[0]).join('.') + '.';
    return {
      main: student.hoTen,
      sub: `${prefix} ${lastName}`,
    };
  };

  return (
    <div className="w-full flex flex-col gap-2.5">
      {/* View Mode & Quick Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        {/* View Mode Switcher Toggle (Only after login) */}
        {showStatusColors && (
          <div className="inline-flex items-center p-0.5 bg-surface-2 rounded-xl border border-token text-xs shadow-xs">
            <button
              type="button"
              onClick={() => handleToggleDisplayMode('avatar_badge')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                displayMode === 'avatar_badge'
                  ? 'bg-accent text-on-accent shadow-xs'
                  : 'text-muted hover:text-main'
              }`}
              title="Hiển thị ảnh đại diện và huy hiệu thi đua của học sinh"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Avatar & Huy hiệu</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleDisplayMode('compact')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                displayMode === 'compact'
                  ? 'bg-accent text-on-accent shadow-xs'
                  : 'text-muted hover:text-main'
              }`}
              title="Hiển thị chế độ gọn với số thứ tự và tên"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Gọn (Tên & STT)</span>
            </button>
          </div>
        )}

        {/* Quick Gender and Seat Counter */}
        <div className="flex items-center gap-2 text-[11px] font-semibold text-muted">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 border-2 border-sky-400 dark:border-sky-500 shadow-2xs font-bold">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            <span>Nam: 25</span>
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 border-2 border-rose-400 dark:border-rose-500 shadow-2xs font-bold">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Nữ: 17</span>
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted">
            Tổng: <strong className="text-main">42</strong> ghế
          </span>
        </div>
      </div>

      {/* Mobile Tổ / Dãy Selector Tabs */}
      <div className="flex sm:hidden items-center justify-between gap-1 p-1 bg-surface-2 rounded-xl border border-token text-[11px]">
        <button
          type="button"
          onClick={() => setActiveDãyTab('all')}
          className={`flex-1 py-1 rounded-lg font-bold transition-all cursor-pointer ${
            activeDãyTab === 'all' 
              ? 'bg-surface text-main shadow-xs' 
              : 'text-muted hover:text-main'
          }`}
        >
          Cả lớp (4 Tổ)
        </button>
        <button
          type="button"
          onClick={() => setActiveDãyTab('to-4')}
          className={`flex-1 py-1 rounded-lg font-bold transition-all cursor-pointer ${
            activeDãyTab === 'to-4' 
              ? 'bg-surface text-main shadow-xs' 
              : 'text-muted hover:text-main'
          }`}
        >
          Tổ 4
        </button>
        <button
          type="button"
          onClick={() => setActiveDãyTab('to-3')}
          className={`flex-1 py-1 rounded-lg font-bold transition-all cursor-pointer ${
            activeDãyTab === 'to-3' 
              ? 'bg-surface text-main shadow-xs' 
              : 'text-muted hover:text-main'
          }`}
        >
          Tổ 3
        </button>
        <button
          type="button"
          onClick={() => setActiveDãyTab('to-2')}
          className={`flex-1 py-1 rounded-lg font-bold transition-all cursor-pointer ${
            activeDãyTab === 'to-2' 
              ? 'bg-surface text-main shadow-xs' 
              : 'text-muted hover:text-main'
          }`}
        >
          Tổ 2
        </button>
        <button
          type="button"
          onClick={() => setActiveDãyTab('to-1')}
          className={`flex-1 py-1 rounded-lg font-bold transition-all cursor-pointer ${
            activeDãyTab === 'to-1' 
              ? 'bg-surface text-main shadow-xs' 
              : 'text-muted hover:text-main'
          }`}
        >
          Tổ 1
        </button>
      </div>

      {/* Classroom Orientation Notice */}
      <div className="w-full flex items-center justify-between px-3 py-1.5 bg-surface-2/60 rounded-xl border border-token/60 text-xs">
        <span className="flex items-center gap-1.5 font-bold text-[var(--role-gv-fg)]">
          <Armchair className="w-4 h-4 shrink-0" />
          <span>Bàn GV</span>
        </span>
        <span className="font-extrabold tracking-widest text-[11px] uppercase text-main opacity-85">
          — BẢNG —
        </span>
        <span className="flex items-center gap-1.5 font-bold text-muted">
          <DoorOpen className="w-4 h-4 shrink-0" />
          <span>Cửa chính</span>
        </span>
      </div>

      {/* Group / Dãy Column Titles (Desktop) */}
      {activeDãyTab === 'all' && (
        <div 
          className="hidden sm:grid gap-1 sm:gap-1.5 text-center text-[11px] font-extrabold text-muted uppercase tracking-wider px-0.5"
          style={{
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr)) 8px repeat(2, minmax(0, 1fr)) 16px repeat(2, minmax(0, 1fr)) 8px repeat(2, minmax(0, 1fr))',
          }}
        >
          <div className="col-span-2 bg-blue-50/50 dark:bg-blue-950/20 py-1 rounded-lg border border-blue-200/50 dark:border-blue-900/30 text-blue-600 dark:text-blue-400">
            Tổ 4
          </div>
          <div className="col-span-1 flex items-center justify-center opacity-30 select-none">·</div>
          <div className="col-span-2 bg-purple-50/50 dark:bg-purple-950/20 py-1 rounded-lg border border-purple-200/50 dark:border-purple-900/30 text-purple-600 dark:text-purple-400">
            Tổ 3
          </div>
          <div className="col-span-1 flex items-center justify-center text-[9px] font-bold text-muted opacity-60 select-none">
            Lối đi
          </div>
          <div className="col-span-2 bg-emerald-50/50 dark:bg-emerald-950/20 py-1 rounded-lg border border-emerald-200/50 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400">
            Tổ 2
          </div>
          <div className="col-span-1 flex items-center justify-center opacity-30 select-none">·</div>
          <div className="col-span-2 bg-amber-50/50 dark:bg-amber-950/20 py-1 rounded-lg border border-amber-200/50 dark:border-amber-900/30 text-amber-600 dark:text-amber-400">
            Tổ 1
          </div>
        </div>
      )}

      {/* Seating Container */}
      <div className="w-full overflow-x-auto no-scrollbar pb-2 pt-0.5">
        <div className={`min-w-[450px] sm:min-w-[500px] max-w-full mx-auto flex flex-col ${displayMode === 'avatar_badge' ? 'gap-3 sm:gap-4' : 'gap-2'}`}>
          {Object.entries(rows).map(([rowKey, nodes]) => {
            const rowIndex = Number(rowKey);

            // Skip row 0 as we rendered top orientation bar above
            if (rowIndex === 0) return null;

            // Row 7 / End of class
            if (rowIndex === 7) {
              return (
                <div 
                  key={rowKey}
                  className="w-full flex items-center justify-center py-2 text-[11px] font-extrabold text-muted opacity-60 tracking-widest border-t border-dashed border-token/60 mt-1 uppercase select-none"
                >
                  — CUỐI LỚP —
                </div>
              );
            }

            const rowGridStyle = activeDãyTab === 'all' ? {
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr)) 8px repeat(2, minmax(0, 1fr)) 16px repeat(2, minmax(0, 1fr)) 8px repeat(2, minmax(0, 1fr))',
            } : undefined;

            return (
              <div 
                key={rowKey}
                className={activeDãyTab === 'all' 
                  ? "gap-1 sm:gap-1.5 items-start" 
                  : "grid grid-cols-2 gap-2.5 items-start max-w-xs mx-auto"
                }
                style={rowGridStyle}
              >
                {nodes.map(node => {
                  if (!shouldRenderCol(node.cot)) {
                    return null;
                  }

                  // Non-seat special nodes
                  if (node.loaiO === 'loidi') {
                    return (
                      <div 
                        key={`${node.hang}-${node.cot}`} 
                        className="flex items-center justify-center text-[9px] text-muted opacity-30 select-none self-center h-full min-h-[30px]"
                      >
                        {node.cot === 5 ? '·' : ''}
                      </div>
                    );
                  }

                  if (node.loaiO === 'cua' || node.loaiO === 'banGV' || node.loaiO === 'buc') {
                    return null;
                  }

                  if (node.loaiO === 'trong') {
                    return (
                      <div 
                        key={`${node.hang}-${node.cot}`}
                        className={`w-full flex flex-col items-center select-none ${
                          displayMode === 'avatar_badge' ? '' : 'h-12 sm:h-13'
                        }`}
                        title={node.ghiChu || 'Chỗ trống'}
                      >
                        {displayMode === 'avatar_badge' ? (
                          <>
                            <div className="w-full aspect-square rounded-xl sm:rounded-2xl border-2 border-dashed border-token/60 bg-surface-2/30 flex items-center justify-center text-[10px] font-semibold text-muted/60">
                              Trống
                            </div>
                            <span className="text-[10px] font-medium text-muted/40 mt-1">Trống</span>
                          </>
                        ) : (
                          <div className="w-full h-full rounded-xl border border-dashed border-token bg-transparent flex items-center justify-center text-[10px] font-medium text-muted opacity-40">
                            Trống
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Student Seat
                  const student = node.maHS ? studentMap.get(node.maHS) : undefined;
                  if (!student) {
                    return (
                      <div 
                        key={`${node.hang}-${node.cot}`}
                        className={`w-full flex flex-col items-center select-none ${
                          displayMode === 'avatar_badge' ? '' : 'h-12 sm:h-13'
                        }`}
                      >
                        {displayMode === 'avatar_badge' ? (
                          <div className="w-full aspect-square rounded-xl sm:rounded-2xl border border-dashed border-token bg-surface-2 opacity-50" />
                        ) : (
                          <div className="w-full h-full rounded-xl border border-dashed border-token bg-surface-2 opacity-50" />
                        )}
                      </div>
                    );
                  }

                  const isSelected = selectedStudentIds.includes(student.maHS);
                  const isLocked = isSeatLockedForViewer(student);
                  const summary = studentSummaries[student.maHS];

                  // Active Badge resolution
                  const activeBadgeId = getStudentActiveBadge(student.maHS) || (studentBadgesMap[student.maHS]?.[0] ?? null);
                  const badgeDef = activeBadgeId ? badgeCatalogMap.get(activeBadgeId) : undefined;

                  // Gender color tint: Nam (border sky blue) vs Nữ (border rose pink)
                  const isNu = student.gioiTinh 
                    ? student.gioiTinh === 'Nu' 
                    : /Thị|Duyên|Trang|Hằng|Uyên|Linh|My|Tiên|Quỳnh|Huyền|Ánh/i.test(student.hoTen);
                  
                  // Compact mode: pure white/dark background, gender distinguished ONLY by border!
                  const compactBorderClass = isNu
                    ? 'border-2 border-rose-400 dark:border-rose-500 hover:border-rose-500'
                    : 'border-2 border-sky-400 dark:border-sky-500 hover:border-sky-500';
                  const compactBgClass = isSelected
                    ? 'bg-accent/10 dark:bg-accent/20 border-accent ring-2 ring-accent/40'
                    : 'bg-white dark:bg-slate-900';

                  // Determine status border
                  let statusBorderColor: string | undefined = undefined;
                  let statusIcon: React.ReactNode = null;

                  if (showStatusColors && summary) {
                    if (summary.mucMau === 'bad') {
                      statusBorderColor = 'var(--st-bad)';
                      statusIcon = <AlertCircle className="w-3 h-3 text-[var(--st-bad)]" />;
                    } else if (summary.mucMau === 'warn') {
                      statusBorderColor = 'var(--st-warn)';
                      statusIcon = <AlertTriangle className="w-3 h-3 text-[var(--st-warn)]" />;
                    } else if (summary.mucMau === 'ok') {
                      statusBorderColor = 'var(--st-ok)';
                      statusIcon = <CheckCircle className="w-3 h-3 text-[var(--st-ok)]" />;
                    }
                  }

                  // Top priority role badge
                  const topRole = student.vaiTro[0] || 'HS';
                  const roleConfig = ROLE_CONFIG[topRole];
                  const roleIcon = topRole === 'LT' ? '👑' :
                                   topRole === 'BT' ? '🚩' :
                                   topRole === 'LP_HT' ? '📖' :
                                   topRole === 'LP_LD' ? '⚡' : '🛡️';

                  return (
                    <button
                      key={`${node.hang}-${node.cot}`}
                      type="button"
                      disabled={isLocked}
                      onClick={() => onSelectStudent(student)}
                      className={`
                        group relative w-full flex flex-col items-center transition-all cursor-pointer select-none
                        ${displayMode === 'avatar_badge' ? '' : `p-1 sm:p-1.5 rounded-xl justify-between text-left shadow-xs min-h-[50px] sm:min-h-[54px] ${compactBgClass} ${compactBorderClass}`}
                        ${displayMode === 'compact' && isSelected ? 'scale-[1.02] shadow-md z-10' : ''}
                        ${isLocked ? 'opacity-30 cursor-not-allowed' : 'active:scale-95'}
                      `}
                      style={
                        displayMode === 'compact' && statusBorderColor
                          ? { borderColor: isSelected ? 'var(--accent)' : statusBorderColor }
                          : undefined
                      }
                      title={`${student.hoTen} · Tổ ${student.to} · STT #${student.viTriGhe}${badgeDef ? ` · Huy hiệu: ${badgeDef.name}` : ''}`}
                    >
                      {displayMode === 'avatar_badge' ? (
                        /* ======================================================== */
                        /* CHẾ ĐỘ AVATAR: KHUNG VUÔNG LỚN, KHÔNG STT, KHÔNG KHUNG NGOÀI */
                        /* ======================================================== */
                        <>
                          {/* Khung ảnh vuông tràn viền rộng, viền mảnh theo giới tính/trạng thái */}
                          <div 
                            className={`
                              relative w-full aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-surface transition-all
                              ${isSelected 
                                ? 'ring-3 ring-accent shadow-lg scale-[1.03] z-10' 
                                : isNu 
                                  ? 'border-2 border-rose-300 dark:border-rose-500/70 shadow-xs group-hover:border-rose-400 group-hover:shadow-md' 
                                  : 'border-2 border-sky-300 dark:border-sky-500/70 shadow-xs group-hover:border-sky-400 group-hover:shadow-md'
                              }
                            `}
                            style={
                              showStatusColors && summary && summary.mucMau !== 'ok' && statusBorderColor
                                ? { borderColor: statusBorderColor, borderWidth: '2.5px' }
                                : undefined
                            }
                          >
                            {/* Ảnh Avatar 3D chất lượng cao hiển thị to bản */}
                            {student.avatarUrl ? (
                              <img
                                src={student.avatarUrl}
                                alt={student.hoTen}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                loading="lazy"
                              />
                            ) : (
                              <div className={`w-full h-full flex items-center justify-center font-black text-sm sm:text-base ${
                                isNu ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' : 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
                              }`}>
                                {getStudentAvatarInitial(student.hoTen)}
                              </div>
                            )}

                            {/* Góc trên phải: Biểu tượng trạng thái nề nếp hoặc Check chọn */}
                            <div className="absolute top-1 right-1 flex items-center gap-0.5 z-10">
                              {statusIcon && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    if (onInspectStudent) {
                                      e.stopPropagation();
                                      onInspectStudent(student);
                                    }
                                  }}
                                  className={`p-0.5 rounded-full bg-surface/90 shadow-xs backdrop-blur-xs transition-transform ${
                                    onInspectStudent ? 'cursor-pointer hover:scale-125' : 'pointer-events-none'
                                  }`}
                                  title={onInspectStudent ? 'Xem chi tiết vi phạm & người ghi' : undefined}
                                >
                                  {statusIcon}
                                </button>
                              )}
                              {isSelected && (
                                <span className="w-4 h-4 rounded-full bg-accent text-on-accent flex items-center justify-center shadow-md pointer-events-none">
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                </span>
                              )}
                            </div>

                            {/* Góc dưới trái: Phù hiệu Ban cán sự lớp */}
                            {topRole !== 'HS' && (
                              <div 
                                className="absolute bottom-1 left-1 px-1 py-0.5 rounded-md text-[9px] font-black shadow-md z-10 flex items-center gap-0.5 border border-white/60 dark:border-black/40 backdrop-blur-xs leading-none"
                                style={{ 
                                  backgroundColor: roleConfig.bg, 
                                  color: roleConfig.fg 
                                }}
                                title={roleConfig.label}
                              >
                                <span>{roleIcon}</span>
                                <span className="hidden sm:inline">{topRole === 'TT' && student.toTruongTo ? `T${student.toTruongTo}` : roleConfig.short}</span>
                              </div>
                            )}

                            {/* Góc dưới phải: Huy hiệu thi đua cá nhân */}
                            {badgeDef && (
                              <div 
                                className="absolute bottom-0.5 right-0.5 drop-shadow-md z-10 transition-transform group-hover:scale-115"
                                title={`Huy hiệu: ${badgeDef.name} (${badgeDef.categoryLabel})`}
                              >
                                <BadgeEmblem type={badgeDef.iconType} size="xs" />
                              </div>
                            )}
                          </div>

                          {/* Tên học sinh đặt ngay phía dưới ảnh avatar (không khung bao quanh) */}
                          <div className="w-full mt-1 sm:mt-1.5 px-0.5 min-w-0 text-center">
                            <span className={`text-[10px] sm:text-xs font-extrabold tracking-tight truncate block leading-tight ${
                              isSelected ? 'text-accent' : 'text-main'
                            }`}>
                              {getSeatingMapDisplayName(student, students)}
                            </span>
                            {badgeDef ? (
                              <span 
                                className="text-[9px] font-bold text-amber-700 dark:text-amber-300 truncate block leading-none opacity-90 mt-0.5"
                                title={badgeDef.name}
                              >
                                {badgeDef.name}
                              </span>
                            ) : topRole !== 'HS' ? (
                              <span 
                                className="text-[9px] font-bold truncate block leading-none mt-0.5"
                                style={{ color: roleConfig.fg }}
                              >
                                {topRole === 'TT' && student.toTruongTo ? `Tổ trưởng ${student.toTruongTo}` : roleConfig.short}
                              </span>
                            ) : (
                              <span className="text-[9px] font-medium text-muted truncate block leading-none opacity-70 mt-0.5">
                                Tổ {student.to}
                              </span>
                            )}
                          </div>
                        </>
                      ) : (
                        /* ======================================================== */
                        /* CHẾ ĐỘ GỌN (TÊN & STT TRONG CARD) */
                        /* ======================================================== */
                        <>
                          {/* Top bar: STT on left, Status + Role badge + Multi-check on right */}
                          <div className="flex items-center justify-between w-full leading-none">
                            <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 dark:text-slate-500 tabular-nums">
                              #{student.viTriGhe}
                            </span>

                            <div className="flex items-center gap-0.5">
                              {statusIcon}
                              {topRole !== 'HS' && (
                                <span 
                                  className="text-[9px] font-bold px-1 py-0.2 rounded flex items-center gap-0.5"
                                  style={{ 
                                    color: roleConfig.fg, 
                                    backgroundColor: roleConfig.bg 
                                  }}
                                  title={roleConfig.label}
                                >
                                  <span>{roleIcon}</span>
                                  <span>{topRole === 'TT' && student.toTruongTo ? `T${student.toTruongTo}` : roleConfig.short}</span>
                                </span>
                              )}

                              {isSelected && (
                                <span className="w-3.5 h-3.5 rounded bg-accent text-on-accent flex items-center justify-center shadow-xs">
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Bottom line: Given Name - optimized for readability, no truncation clipping */}
                          <div className="w-full text-center min-w-0 flex items-center justify-center flex-1 py-0.5">
                            <span className="text-[10px] sm:text-[11px] font-black text-slate-900 dark:text-slate-100 tracking-tight leading-[1.15] block break-words text-center px-0.5 max-h-[28px] overflow-hidden">
                              {getSeatingMapDisplayName(student, students)}
                            </span>
                          </div>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

          </div>
  );
};