import React, { useState, useMemo, useEffect } from 'react';
import { 
  ClipboardList, 
  UserCheck, 
  Clock, 
  Edit3, 
  Trash2, 
  Sliders, 
  AlertCircle,
  PlusCircle,
  CheckCircle2,
  X,
  Sparkles,
  Award,
  BookOpen,
  Camera,
  KeyRound,
  LogOut
} from 'lucide-react';
import { 
  Student, 
  SeatLayoutNode, 
  DisciplineRecord, 
  RuleItem, 
  StudentWeekSummary, 
  RoleCode, 
  TeacherSettings,
  HierarchyPeriodFilter,
  StudentAcademicRecord
} from '../../types';
import { StudentPicker } from '../student-picker/StudentPicker';
import { RecordBottomSheet } from '../record/RecordBottomSheet';
import { DuplicateWarningModal } from '../record/DuplicateWarningModal';
import { StudentView } from '../student/StudentView';
import { CadreBadge } from '../common/CadreBadge';
import { CadreHonorsModal } from '../common/CadreHonorsModal';
import { PeriodHierarchyFilter as PeriodFilterComponent } from '../common/PeriodHierarchyFilter';
import { checkDuplicateRecord } from '../../utils/emulation';
import { filterRecordsByHierarchy, CURRENT_SCHOOL_YEAR } from '../../utils/hierarchy';
import { CADRE_ROLES_INFO, STUDENT_ACHIEVEMENTS } from '../../data/badgeData';
import { AvatarFrame } from '../common/AvatarFrame';
import { AvatarUploadModal } from '../common/AvatarUploadModal';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';
import { getStudentAvatarInitial } from '../../utils/vietnamese';
import { getCadreBanner } from '../../data/cadreBanners';
import { getBadgeCatalog, getStudentActiveBadge } from '../../data/badgeCatalog';
import { BadgeEmblem } from '../common/BadgeEmblem';

interface CadreViewProps {
  currentCadre: Student;
  cadreRole: RoleCode;
  allStudents: Student[];
  layout: SeatLayoutNode[];
  rules: RuleItem[];
  records: DisciplineRecord[];
  studentSummaries: Record<string, StudentWeekSummary>;
  currentWeek: number;
  settings: TeacherSettings;
  academicRecords?: StudentAcademicRecord[];
  onAddRecord: (record: Omit<DisciplineRecord, 'maGhiNhan' | 'thoiGianMayChu' | 'thoiGianMay'>) => void;
  onVoidRecord: (recordId: string, reason: string) => void;
  onSubmitExplanation: (recordId: string, explanation: string) => void;
  onUpdateStudentAvatar?: (studentId: string, avatarUrl: string) => void;
  onLogout?: () => void;
}

export const CadreView: React.FC<CadreViewProps> = ({
  currentCadre,
  cadreRole,
  allStudents,
  layout,
  rules,
  records,
  studentSummaries,
  currentWeek,
  settings,
  academicRecords,
  onAddRecord,
  onVoidRecord,
  onSubmitExplanation,
  onUpdateStudentAvatar,
  onLogout,
}) => {
  const [activeMode, setActiveMode] = useState<'record' | 'my_log' | 'personal'>('record');
  const [fastSaveEnabled, setFastSaveEnabled] = useState(false);
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [showCadreModal, setShowCadreModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Active displayed achievement badge
  const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(`student_active_badge_${currentCadre.maHS}`) || 'badge_iron_discipline';
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      const saved = getStudentActiveBadge(currentCadre.maHS) || localStorage.getItem(`student_active_badge_${currentCadre.maHS}`);
      setSelectedBadgeId(saved || 'b_cadre_leader');
    } catch {
      setSelectedBadgeId('b_cadre_leader');
    }
  }, [currentCadre.maHS]);

  const activeDisplayedBadge = useMemo(() => {
    if (!selectedBadgeId) return null;
    const catalog = getBadgeCatalog();
    return catalog.find(b => b.id === selectedBadgeId) || null;
  }, [selectedBadgeId]);

  // Time hierarchy filter for "Sổ của tôi"
  const [logPeriodFilter, setLogPeriodFilter] = useState<HierarchyPeriodFilter>({
    namHoc: CURRENT_SCHOOL_YEAR,
    hocKi: 1,
    thang: 'all',
    tuanHoc: currentWeek,
    ngayHoc: 'all',
    buoi: 'all',
  });

  // Void modal state
  const [voidModalRecord, setVoidModalRecord] = useState<DisciplineRecord | null>(null);
  const [voidReason, setVoidReason] = useState('');

  // Duplicate Warning Modal state
  const [duplicateWarningData, setDuplicateWarningData] = useState<{
    pendingRule: RuleItem;
    duplicateStudents: { student: Student; existingRecords: DisciplineRecord[] }[];
    safeStudentIds: string[];
  } | null>(null);

  const cadreInfo = CADRE_ROLES_INFO[cadreRole] || CADRE_ROLES_INFO.HS;
  const viewerTo = cadreRole === 'TT' ? currentCadre.toTruongTo : undefined;

  // Selected students list
  const selectedStudents = useMemo(() => {
    return allStudents.filter(s => selectedStudentIds.includes(s.maHS));
  }, [allStudents, selectedStudentIds]);

  // Single selected student (for single select flow)
  const singleSelectedStudent = selectedStudents.length > 0 ? selectedStudents[0] : null;

  // Records filtered for "Sổ của tôi"
  const filteredMyRecords = useMemo(() => {
    const list = filterRecordsByHierarchy(records, logPeriodFilter);
    return list.filter(r => r.nguoiGhi === currentCadre.hoTen);
  }, [records, logPeriodFilter, currentCadre.hoTen]);

  // Handle student selection from grid or list
  const handleSelectStudent = (student: Student) => {
    if (isMultiSelect) {
      setSelectedStudentIds(prev => {
        if (prev.includes(student.maHS)) {
          return prev.filter(id => id !== student.maHS);
        } else {
          return [...prev, student.maHS];
        }
      });
    } else {
      setSelectedStudentIds([student.maHS]);
      setIsBottomSheetOpen(true);
    }
  };

  // Attempt to submit a rule violation
  const handleAttemptSubmitRule = (
    rule: RuleItem, 
    extraNote?: string, 
    date?: string, 
    buoi?: 'Sang' | 'Chieu',
    hocKi: 1 | 2 = 1,
    tuanHoc: number = currentWeek
  ) => {
    const targetStudents = isMultiSelect ? selectedStudents : (singleSelectedStudent ? [singleSelectedStudent] : []);
    if (targetStudents.length === 0) return;

    const duplicates: { student: Student; existingRecords: DisciplineRecord[] }[] = [];
    const safeIds: string[] = [];
    const targetDate = date || new Date().toISOString().split('T')[0];
    const targetBuoi = buoi || (new Date().getHours() < 12 ? 'Sang' : 'Chieu');

    targetStudents.forEach(st => {
      const dupCheck = checkDuplicateRecord(
        records,
        st.maHS,
        targetDate,
        targetBuoi,
        rule.maNoiQuy
      );

      if (dupCheck.isDuplicate) {
        duplicates.push({ student: st, existingRecords: dupCheck.existingRecords });
      } else {
        safeIds.push(st.maHS);
      }
    });

    if (duplicates.length > 0) {
      setDuplicateWarningData({
        pendingRule: rule,
        duplicateStudents: duplicates,
        safeStudentIds: safeIds,
      });
      return;
    }

    // No duplicates: proceed to commit
    commitRecords(targetStudents, rule, extraNote, date, buoi, false, hocKi, tuanHoc);
  };

  // Actually commit records to state
  const commitRecords = (
    targets: Student[],
    rule: RuleItem,
    extraNote?: string,
    date?: string,
    buoi?: 'Sang' | 'Chieu',
    confirmedDuplicate = false,
    hocKi: 1 | 2 = 1,
    tuanHoc: number = currentWeek
  ) => {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const targetBuoi = buoi || (new Date().getHours() < 12 ? 'Sang' : 'Chieu');

    targets.forEach(student => {
      onAddRecord({
        namHoc: CURRENT_SCHOOL_YEAR,
        hocKi: hocKi,
        thang: new Date(targetDate).getMonth() + 1,
        tuanHoc: tuanHoc,
        ngayHoc: targetDate,
        buoi: targetBuoi,
        doiTuong: 'HocSinh',
        maHS: student.maHS,
        hoTen: student.hoTen,
        to: student.to,
        maNoiQuy: rule.maNoiQuy,
        nhomHanhVi: rule.nhomHanhVi,
        tenHanhVi: rule.tenHanhVi,
        mucDo: rule.mucDo,
        diemSo: rule.diemSo,
        loaiDiem: rule.loaiDiem,
        ghiChu: extraNote,
        nguoiGhi: currentCadre.hoTen,
        vaiTroNguoiGhi: cadreRole,
        nguonGhi: 'TrucTiep',
        lanThuTrongBuoi: 1,
        daXacNhanTrung: confirmedDuplicate,
        trangThai: 'HieuLuc',
      });
    });

    // Reset selection & close sheet
    setSelectedStudentIds([]);
    setIsBottomSheetOpen(false);
    setDuplicateWarningData(null);
  };

  // Handle Void record submit
  const handleConfirmVoid = () => {
    if (!voidModalRecord || !voidReason.trim()) return;
    onVoidRecord(voidModalRecord.maGhiNhan, voidReason.trim());
    setVoidModalRecord(null);
    setVoidReason('');
  };

  // 24-hour remaining countdown helper
  const getRemainingHours = (isoTime: string) => {
    const recordTime = new Date(isoTime).getTime();
    const now = new Date().getTime();
    const limitMs = settings.thoiHanSuaHuyPhut * 60 * 1000;
    const diff = (recordTime + limitMs) - now;
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
  };

  const roleBanner = getCadreBanner(cadreRole, currentCadre.toTruongTo || currentCadre.to);

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Cadre Illustrated Role Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-token shadow-xs bg-surface">
        <div className="relative h-28 sm:h-36 w-full overflow-hidden">
          {roleBanner.imageSrc ? (
            <img
              src={roleBanner.imageSrc}
              alt={roleBanner.roleName}
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-r ${roleBanner.gradientFallback}`} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />
          
          <div className="absolute top-3 left-4 right-4 flex items-center justify-between">
            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border backdrop-blur-md ${roleBanner.accentBadge}`}>
              {roleBanner.roleName}
            </span>
            <span className="text-[11px] font-bold text-white/90 drop-shadow-sm">
              {roleBanner.subtitle}
            </span>
          </div>
          
          <div className="absolute bottom-2.5 left-4 right-4 text-xs font-semibold text-white/90 italic drop-shadow-sm">
            "{roleBanner.tagline}"
          </div>
        </div>
      </div>

      {/* Cadre Top Header Card */}
      <div className="relative overflow-hidden p-4 sm:p-5 rounded-3xl bg-surface border border-token shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 w-full sm:w-auto">
          {/* Avatar with Cadre Frame & Camera Upload */}
          <div className="relative shrink-0">
            <AvatarFrame
              cadreRole={
                cadreRole === 'TT' ? `TT_${currentCadre.toTruongTo || currentCadre.to}` : cadreRole
              }
              size="lg"
            >
              {currentCadre.avatarUrl ? (
                <img
                  src={currentCadre.avatarUrl}
                  alt={currentCadre.hoTen}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div
                  className={`w-full h-full rounded-full flex items-center justify-center font-black text-lg ${
                    currentCadre.gioiTinh === 'Nu'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-sky-100 text-sky-700'
                  }`}
                >
                  {getStudentAvatarInitial(currentCadre.hoTen)}
                </div>
              )}
            </AvatarFrame>

            {/* Camera upload button */}
            <button
              type="button"
              onClick={() => setShowAvatarModal(true)}
              title="Đổi ảnh đại diện của bạn"
              className="absolute -top-1 -right-1 z-20 p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white shadow-md transition-all cursor-pointer hover:scale-110 active:scale-95"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-extrabold text-main leading-tight truncate">
                {currentCadre.hoTen}
              </h2>
              <CadreBadge 
                role={cadreRole} 
                toTruongTo={currentCadre.toTruongTo} 
                size="sm" 
                onClick={() => setShowCadreModal(true)}
              />
              {activeDisplayedBadge && (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-xs"
                  style={{
                    backgroundColor: `${activeDisplayedBadge.accentColor}18`,
                    borderColor: `${activeDisplayedBadge.accentColor}50`,
                    color: activeDisplayedBadge.accentColor,
                  }}
                  title={`Huy hiệu: ${activeDisplayedBadge.name} - ${activeDisplayedBadge.description}`}
                >
                  <BadgeEmblem type={activeDisplayedBadge.iconType} size="xs" />
                  <span>{activeDisplayedBadge.name}</span>
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-muted mt-0.5">
              Tổ {currentCadre.to}
            </p>
            <div className="flex items-center gap-2.5 mt-1 flex-wrap">
              <button
                type="button"
                onClick={() => setShowAvatarModal(true)}
                className="text-[11px] font-bold text-accent hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Camera className="w-3 h-3" />
                <span>Đổi ảnh</span>
              </button>
              <span className="text-muted opacity-40">·</span>
              <button
                type="button"
                onClick={() => setShowPasswordModal(true)}
                className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <KeyRound className="w-3 h-3" />
                <span>Đổi mật khẩu</span>
              </button>
              {onLogout && (
                <>
                  <span className="text-muted opacity-40">·</span>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                    title="Đăng xuất khỏi tài khoản"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Đăng xuất</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-token">
          <button
            onClick={() => setShowCadreModal(true)}
            className="px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 hover:bg-amber-500/25 transition-all cursor-pointer shadow-2xs"
          >
            <span>👑 Bảng Vinh Danh</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center justify-center p-1 bg-surface-2 rounded-2xl border border-token max-w-md mx-auto w-full">
        <button
          onClick={() => setActiveMode('record')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            activeMode === 'record' 
              ? 'bg-surface text-main shadow-xs' 
              : 'text-muted hover:text-main'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5 text-accent" />
          <span>Ghi nhận vi phạm</span>
        </button>

        <button
          onClick={() => setActiveMode('my_log')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            activeMode === 'my_log' 
              ? 'bg-surface text-main shadow-xs' 
              : 'text-muted hover:text-main'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-accent" />
          <span>Sổ của tôi ({filteredMyRecords.length})</span>
        </button>

        <button
          onClick={() => setActiveMode('personal')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            activeMode === 'personal' 
              ? 'bg-surface text-main shadow-xs' 
              : 'text-muted hover:text-main'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5 text-accent" />
          <span>Cá nhân</span>
        </button>
      </div>

      {/* Sub-mode "Quay lại" (Back) button when in Sổ của tôi or Cá nhân */}
      {activeMode !== 'record' && (
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => setActiveMode('record')}
            className="px-3.5 py-1.5 rounded-xl bg-surface hover:bg-surface-2 border border-token text-main text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 hover:border-accent"
          >
            <span>← Quay lại Bàn ghi nhận</span>
          </button>
          <span className="text-xs font-bold text-muted">
            {activeMode === 'my_log' ? 'Sổ nhật ký của tôi' : 'Hồ sơ thi đua cá nhân'}
          </span>
        </div>
      )}

      {/* MODE 1: GHI NHẬN (Student Picker & Bottom Sheet) */}
      {activeMode === 'record' && (
        <div className="space-y-3">
          {/* Fast Save Toggle */}
          <div className="flex items-center justify-end px-1">
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-muted hover:text-main select-none">
              <span>Lưu nhanh 1 chạm:</span>
              <input
                type="checkbox"
                checked={fastSaveEnabled}
                onChange={e => setFastSaveEnabled(e.target.checked)}
                className="w-4 h-4 accent-accent rounded"
              />
            </label>
          </div>

          {/* Student Picker */}
          <StudentPicker
            students={allStudents}
            layout={layout}
            studentSummaries={studentSummaries}
            selectedStudentIds={selectedStudentIds}
            onSelectStudent={handleSelectStudent}
            viewerRole={cadreRole}
            viewerTo={viewerTo}
            showStatusColors={true}
            isMultiSelect={isMultiSelect}
            onToggleMultiSelect={() => {
              setIsMultiSelect(!isMultiSelect);
              if (isMultiSelect) setSelectedStudentIds([]);
            }}
          />

          {/* Floating Action Bar when selecting multiple students */}
          {isMultiSelect && selectedStudentIds.length > 0 && (
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 w-11/12 max-w-md bg-primary text-on-primary rounded-2xl shadow-2xl p-3 border border-token flex items-center justify-between animate-slide-up">
              <div className="text-xs font-semibold">
                Đã chọn <strong className="text-accent underline">{selectedStudentIds.length}</strong> học sinh
              </div>
              <button
                type="button"
                onClick={() => setIsBottomSheetOpen(true)}
                className="px-4 py-2 rounded-xl bg-accent text-on-accent text-xs font-bold shadow-xs hover:opacity-95 transition-opacity cursor-pointer flex items-center gap-1.5"
              >
                <span>Tiếp tục chọn lỗi</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODE 2: SỔ CỦA TÔI (My created records & 24h edit/void with Period Filter) */}
      {activeMode === 'my_log' && (
        <div className="space-y-3">
          {/* Period Filter for Sổ của tôi */}
          <PeriodFilterComponent
            filter={logPeriodFilter}
            onChangeFilter={setLogPeriodFilter}
            compact={true}
          />

          <div className="bg-surface rounded-3xl border border-token overflow-hidden shadow-xs">
            <div className="px-4 py-3.5 border-b border-token flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-main uppercase tracking-wider">
                  Sổ ghi nhận nề nếp của bạn
                </h3>
                <p className="text-[11px] text-muted mt-0.5">
                  Có thể sửa hoặc hủy trong thời hạn 24 giờ kể từ thời điểm ghi
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-surface-2 text-muted">
                {filteredMyRecords.length} lượt
              </span>
            </div>

            <div className="divide-y divide-token">
              {filteredMyRecords.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-[var(--st-ok)] mx-auto" />
                  <p>Không có lượt ghi nhận nào trong khoảng thời gian đã chọn.</p>
                </div>
              ) : (
                filteredMyRecords.map(rec => {
                  const isVoided = rec.trangThai === 'DaHuy';
                  const remainingHours = getRemainingHours(rec.thoiGianMayChu);
                  const canModify = !isVoided && remainingHours > 0;

                  return (
                    <div key={rec.maGhiNhan} className="p-3.5 space-y-2 hover:bg-surface-2/40 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-main">
                              {rec.hoTen}
                            </span>
                            <span className="text-[11px] text-muted">
                              (Tổ {rec.to})
                            </span>
                            <span className="text-xs font-bold text-[var(--st-bad)]">
                              -{rec.diemSo}đ
                            </span>
                          </div>
                          <div className="text-xs font-medium text-main mt-0.5">
                            {rec.tenHanhVi}
                          </div>
                          <div className="text-[11px] text-muted flex items-center gap-2 mt-0.5">
                            <span>{rec.ngayHoc} ({rec.buoi === 'Sang' ? 'Sáng' : 'Chiều'})</span>
                            <span>·</span>
                            <span>Lần {rec.lanThuTrongBuoi} trong buổi</span>
                          </div>
                        </div>

                        {/* Right actions: Void / Countdown */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {isVoided ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-2 text-muted">
                              Đã hủy
                            </span>
                          ) : canModify ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-muted flex items-center gap-1">
                                <Clock className="w-3 h-3 text-accent" />
                                <span>Còn {remainingHours}h</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => setVoidModalRecord(rec)}
                                className="p-1.5 rounded-lg text-[var(--st-bad)] hover:bg-[var(--st-bad)]/10 transition-colors cursor-pointer"
                                title="Hủy bản ghi này"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted">
                              Đã hết hạn 24h
                            </span>
                          )}
                        </div>
                      </div>

                      {rec.lyDoHuy && (
                        <div className="text-[10px] text-[var(--st-bad)] italic bg-[var(--st-bad)]/5 p-2 rounded-xl border border-[var(--st-bad)]/20">
                          <strong>Lý do hủy:</strong> {rec.lyDoHuy}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: CÁ NHÂN (Cadre's own student view) */}
      {activeMode === 'personal' && (
        <StudentView
          currentStudent={currentCadre}
          allStudents={allStudents}
          layout={layout}
          records={records}
          studentSummaries={studentSummaries}
          currentWeek={currentWeek}
          settings={settings}
          academicRecords={academicRecords}
          onSubmitExplanation={onSubmitExplanation}
        />
      )}

      {/* Cadre Honors Modal */}
      <CadreHonorsModal
        isOpen={showCadreModal}
        onClose={() => setShowCadreModal(false)}
        students={allStudents}
      />

      {/* Record Bottom Sheet (2-touch) */}
      <RecordBottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => {
          setIsBottomSheetOpen(false);
          if (!isMultiSelect) setSelectedStudentIds([]);
        }}
        students={isMultiSelect ? selectedStudents : (singleSelectedStudent ? [singleSelectedStudent] : [])}
        rules={rules}
        allowBonus={settings.batDiemCong}
        initialWeek={currentWeek}
        onSave={(payload) => {
          handleAttemptSubmitRule(
            payload.rule, 
            payload.note, 
            payload.date, 
            payload.session, 
            payload.hocKi, 
            payload.tuanHoc
          );
        }}
        currentUserRole={cadreRole}
        existingRecords={records}
      />

      {/* Duplicate Warning Modal */}
      {duplicateWarningData && (
        <DuplicateWarningModal
          isOpen={true}
          onClose={() => setDuplicateWarningData(null)}
          onConfirm={(confirmedStudents) => {
            commitRecords(
              confirmedStudents,
              duplicateWarningData.pendingRule,
              undefined,
              undefined,
              undefined,
              true
            );
          }}
          selectedStudents={isMultiSelect ? selectedStudents : (singleSelectedStudent ? [singleSelectedStudent] : [])}
          selectedRule={duplicateWarningData.pendingRule}
          existingRecordsByStudent={
            duplicateWarningData.duplicateStudents.reduce((acc, item) => {
              acc[item.student.maHS] = item.existingRecords;
              return acc;
            }, {} as Record<string, DisciplineRecord[]>)
          }
        />
      )}

      {/* Void Record Confirmation Modal */}
      {voidModalRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-surface border border-token rounded-3xl shadow-2xl p-4 sm:p-5 space-y-3.5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-token pb-2.5">
              <h4 className="text-sm font-bold text-main">
                Hủy bản ghi vi phạm 🗑️
              </h4>
              <button
                onClick={() => setVoidModalRecord(null)}
                className="p-1 rounded-md text-muted hover:text-main"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted">
              Bạn đang hủy ghi nhận lỗi của <strong>{voidModalRecord.hoTen}</strong> ({voidModalRecord.tenHanhVi}).
            </p>

            <div>
              <label className="block text-xs font-semibold text-main mb-1">
                Lý do hủy (bắt buộc):
              </label>
              <textarea
                value={voidReason}
                onChange={e => setVoidReason(e.target.value)}
                rows={2}
                placeholder="Ghi nhầm tên học sinh, bạn đã giải thích đúng..."
                className="w-full p-2.5 bg-surface-2 border border-token rounded-xl text-xs text-main placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-token">
              <button
                type="button"
                onClick={() => setVoidModalRecord(null)}
                className="px-3 py-1.5 rounded-xl border border-token text-xs text-muted hover:text-main"
              >
                Quay lại
              </button>
              <button
                type="button"
                disabled={!voidReason.trim()}
                onClick={handleConfirmVoid}
                className="px-4 py-1.5 rounded-xl bg-[var(--st-bad)] text-white text-xs font-bold hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cadre Avatar Upload Modal */}
      <AvatarUploadModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        student={currentCadre}
        allStudents={allStudents}
        settings={settings}
        onSaveAvatar={(studentId, newAvatarUrl) => {
          if (onUpdateStudentAvatar) {
            onUpdateStudentAvatar(studentId || currentCadre.maHS, newAvatarUrl);
          }
        }}
      />

      {/* Cadre Change Password Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        student={currentCadre}
      />
    </div>
  );
};
