import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Award,
  Edit3,
  Check,
  RotateCcw,
  Sparkles,
  Users,
  Save,
  CheckCircle2,
  Calendar,
  Sliders,
  Zap,
  RefreshCw,
  Trash2,
  ShieldAlert,
} from 'lucide-react';
import {
  Student,
  DisciplineRecord,
  StudentAcademicRecord,
  TeacherSettings,
  RoleCode,
} from '../../types';
import { BadgeEmblem } from '../common/BadgeEmblem';
import { INITIAL_SETTINGS } from '../../data/mockData';
import {
  AchievementBadge,
  BadgeCategory,
  BadgeAutoConditionType,
  BadgeAutoRule,
  BADGE_CONDITION_TYPE_LABELS,
  describeBadgeAutoRule,
  getBadgeCatalog,
  saveBadgeCatalog,
  resetBadgeCatalog,
  getStudentBadgesMap,
  awardBadgeToStudent,
  revokeBadgeFromStudent,
  revokeAllStudentBadges,
  isBadgeReservedForCadre,
  isStudentCadre,
  evaluateAndAutoAwardBadges,
} from '../../data/badgeCatalog';
import { getStudentAvatarInitial } from '../../utils/vietnamese';

interface BadgeManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  records?: DisciplineRecord[];
  academicRecords?: StudentAcademicRecord[];
  settings?: TeacherSettings;
  currentWeek?: number;
  onUpdateSettings?: (newSettings: Partial<TeacherSettings>) => void;
}

export const BadgeManagementModal: React.FC<BadgeManagementModalProps> = ({
  isOpen,
  onClose,
  students,
  records = [],
  academicRecords = [],
  settings,
  currentWeek = 3,
  onUpdateSettings,
}) => {
  const [catalog, setCatalog] = useState<AchievementBadge[]>([]);
  const [studentBadgesMap, setStudentBadgesMap] = useState<Record<string, string[]>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | BadgeCategory>('all');

  // Panel đóng/mở cấu hình tự động & điều kiện theo nhóm (mặc định thu gọn để ưu tiên danh sách huy hiệu trên điện thoại)
  const [showAutoConfigPanel, setShowAutoConfigPanel] = useState(false);

  // Thiết lập nhanh điều kiện cho cả Nhóm loại huy hiệu
  const [batchCategory, setBatchCategory] = useState<BadgeCategory>('discipline');
  const [batchConditionType, setBatchConditionType] = useState<BadgeAutoConditionType>('min_week_score');
  const [batchMinScore, setBatchMinScore] = useState<number>(98);
  const [batchMinWeeks, setBatchMinWeeks] = useState<number>(2);
  const [batchMinGpa, setBatchMinGpa] = useState<number>(8.0);
  const [batchMinBonus, setBatchMinBonus] = useState<number>(5);
  const [batchMaxRank, setBatchMaxRank] = useState<number>(5);

  // Editing state for a single badge
  const [editingBadge, setEditingBadge] = useState<AchievementBadge | null>(null);
  const [editName, setEditName] = useState('');
  const [editCriteria, setEditCriteria] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAutoRule, setEditAutoRule] = useState<BadgeAutoRule>({
    enabled: true,
    conditionType: 'min_week_score',
    minScore: 100,
    minWeeks: 1,
  });

  // Awarding badge to students modal/drawer
  const [awardingBadge, setAwardingBadge] = useState<AchievementBadge | null>(null);
  const [studentSearch, setStudentSearch] = useState('');

  // Revoke all badges & recalculate options for GVCN
  const [showRevokeAllConfirm, setShowRevokeAllConfirm] = useState(false);
  const [autoRevokeBeforeRecalc, setAutoRevokeBeforeRecalc] = useState(true);

  // Toast notice
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load catalog on open and listen for external/cloud badge updates
  useEffect(() => {
    if (!isOpen) return;
    setCatalog(getBadgeCatalog());
    setStudentBadgesMap(getStudentBadgesMap());
    setShowRevokeAllConfirm(false);

    const handleBadgeSync = () => {
      setCatalog(getBadgeCatalog());
      setStudentBadgesMap(getStudentBadgesMap());
    };
    window.addEventListener('lop10a5:badge_change', handleBadgeSync);
    window.addEventListener('storage', handleBadgeSync);
    return () => {
      window.removeEventListener('lop10a5:badge_change', handleBadgeSync);
      window.removeEventListener('storage', handleBadgeSync);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Filtered badges
  const filteredBadges = catalog.filter(b => {
    const matchCategory = selectedCategory === 'all' || b.category === selectedCategory;
    const matchQuery =
      searchQuery === '' ||
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.criteria.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchQuery;
  });

  // Thu hồi tất cả huy hiệu của toàn bộ học sinh
  const handleConfirmRevokeAll = () => {
    revokeAllStudentBadges();
    setStudentBadgesMap({});
    setShowRevokeAllConfirm(false);
    // Tắt tạm tự động trao nền để giữ trạng thái sạch cho đến khi GV bấm Tính lại
    onUpdateSettings?.({ tuDongTraoHuyHieu: false });
    showToast('Đã thu hồi sạch toàn bộ huy hiệu của tất cả học sinh trong lớp!');
  };

  // Chạy xét và trao huy hiệu tự động
  const handleRunAutoAward = (isRecalculate = false) => {
    const shouldClearFirst = isRecalculate && autoRevokeBeforeRecalc;
    if (shouldClearFirst) {
      revokeAllStudentBadges();
    }
    const effectiveSettings: TeacherSettings = settings || INITIAL_SETTINGS;
    const res = evaluateAndAutoAwardBadges({
      students,
      records,
      academicRecords,
      settings: effectiveSettings,
      currentWeek,
      catalog,
      replaceExisting: shouldClearFirst || isRecalculate,
    });
    setStudentBadgesMap(res.updatedMap);
    if (isRecalculate) {
      showToast(
        `${shouldClearFirst ? 'Đã thu hồi sạch huy hiệu cũ & ' : 'Đã '}tính lại thành công: Trao ${res.totalAwardedCount} lượt huy hiệu (Tuần ${
          effectiveSettings.tuanBatDauXetHuyHieu || effectiveSettings.tuanBatDauTinhDiem || 1
        } → Tuần ${currentWeek})!`
      );
    } else {
      showToast(
        `Đã quét tự động: Trao mới +${res.newlyAwardedCount} huy hiệu (Tổng: ${res.totalAwardedCount} lượt sở hữu)!`
      );
    }
  };

  // Áp dụng điều kiện hàng loạt cho 1 Loại/Nhóm huy hiệu
  const handleApplyBatchCategoryCondition = () => {
    const updated = catalog.map(b => {
      if (b.category !== batchCategory) return b;
      const newRule: BadgeAutoRule = {
        ...(b.autoRule || { enabled: true, conditionType: batchConditionType }),
        enabled: batchConditionType !== 'manual_only',
        conditionType: batchConditionType,
        minScore: batchMinScore,
        minWeeks: batchMinWeeks,
        minGpa: batchMinGpa,
        minBonusPoints: batchMinBonus,
        maxRank: batchMaxRank,
      };
      return {
        ...b,
        autoRule: newRule,
        criteria: describeBadgeAutoRule(newRule),
      };
    });

    setCatalog(updated);
    saveBadgeCatalog(updated);

    const catLabel =
      batchCategory === 'discipline' ? 'Kỷ luật & Chuyên cần' :
      batchCategory === 'academic' ? 'Học tập & Tri thức' :
      batchCategory === 'movement' ? 'Phong trào & Đoàn hội' : 'Tập thể & Cán sự';

    if (settings && settings.tuDongTraoHuyHieu !== false) {
      const res = evaluateAndAutoAwardBadges({
        students,
        records,
        academicRecords,
        settings,
        currentWeek,
        catalog: updated,
        replaceExisting: true,
      });
      setStudentBadgesMap(res.updatedMap);
    }

    showToast(`Đã áp dụng điều kiện mới cho toàn bộ nhóm "${catLabel}"!`);
  };

  // Handle save single badge edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBadge || !editName.trim()) return;

    const finalCriteria = editCriteria.trim() || describeBadgeAutoRule(editAutoRule);

    const updated = catalog.map(b => {
      if (b.id === editingBadge.id) {
        return {
          ...b,
          name: editName.trim(),
          criteria: finalCriteria,
          description: editDescription.trim(),
          autoRule: editAutoRule,
        };
      }
      return b;
    });

    setCatalog(updated);
    saveBadgeCatalog(updated);

    if (settings && settings.tuDongTraoHuyHieu !== false) {
      const res = evaluateAndAutoAwardBadges({
        students,
        records,
        academicRecords,
        settings,
        currentWeek,
        catalog: updated,
        replaceExisting: false,
      });
      setStudentBadgesMap(res.updatedMap);
    }

    showToast(`Đã lưu điều kiện trao cho huy hiệu "${editName}"!`);
    setEditingBadge(null);
  };

  // Handle Reset to defaults
  const handleResetCatalog = () => {
    const reset = resetBadgeCatalog();
    setCatalog(reset);
    showToast('Đã khôi phục danh mục huy hiệu về cấu hình gốc!');
  };

  // Toggle award badge for student (có kiểm tra huy hiệu dành riêng cho Ban cán sự)
  const handleToggleAward = (studentId: string, badgeId: string) => {
    const currentList = studentBadgesMap[studentId] || [];
    const hasBadge = currentList.includes(badgeId);

    if (hasBadge) {
      revokeBadgeFromStudent(studentId, badgeId);
    } else {
      const targetBadge = catalog.find(b => b.id === badgeId);
      const targetStudent = students.find(s => s.maHS === studentId);
      if (isBadgeReservedForCadre(targetBadge) && !isStudentCadre(targetStudent)) {
        showToast('Huy hiệu này chỉ dành riêng cho thành viên Ban cán sự lớp!');
        return;
      }
      awardBadgeToStudent(studentId, badgeId);
    }
    setStudentBadgesMap(getStudentBadgesMap());
  };

  const startWeekVal = settings?.tuanBatDauXetHuyHieu || settings?.tuanBatDauTinhDiem || 1;
  const startDateVal = settings?.ngayBatDauXetHuyHieu || settings?.ngayBatDauTinhDiem || '';
  const autoEnabled = settings?.tuDongTraoHuyHieu !== false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[94vh] flex flex-col rounded-3xl bg-surface border border-token shadow-2xl overflow-hidden">
        {/* Top Header (Compact on mobile) */}
        <div className="px-3 sm:px-5 py-2.5 sm:py-3.5 border-b border-token flex items-center justify-between bg-surface-2/60 shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center shadow-xs shrink-0">
              <Award className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-xs sm:text-base font-extrabold text-main truncate">
                  Huy Hiệu Thi Đua ({catalog.length})
                </h2>
              </div>
              <p className="text-[10.5px] text-muted truncate hidden sm:block">
                Thiết lập điều kiện trao tự động hoặc trao trực tiếp cho học sinh ({students.length} HS)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowRevokeAllConfirm(true)}
              title="Thu hồi toàn bộ huy hiệu đang có của học sinh cả lớp"
              className="px-2 sm:px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span className="hidden xs:inline">Thu hồi</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAutoConfigPanel(!showAutoConfigPanel)}
              className={`px-2 sm:px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                showAutoConfigPanel
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-surface border-token text-main hover:bg-surface-2'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 shrink-0" />
              <span>Cấu hình</span>
            </button>

            <button
              type="button"
              onClick={handleResetCatalog}
              title="Khôi phục thiết lập gốc"
              className="p-1.5 sm:p-2 rounded-xl text-muted hover:text-rose-600 hover:bg-rose-500/10 transition-all cursor-pointer text-xs font-bold flex items-center gap-1"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden md:inline">Khôi phục gốc</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-muted hover:text-main hover:bg-surface-2 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Thanh xác nhận Thu hồi tất cả huy hiệu */}
        {showRevokeAllConfirm && (
          <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2 text-xs text-rose-900 font-bold">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                Xác nhận thu hồi sạch toàn bộ huy hiệu hiện có của {students.length} học sinh trong lớp (để bắt đầu tính lại từ đầu)?
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleConfirmRevokeAll}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold cursor-pointer shadow-xs active:scale-95 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xác nhận thu hồi sạch</span>
              </button>
              <button
                type="button"
                onClick={() => setShowRevokeAllConfirm(false)}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </div>
        )}

        {/* Toast Alert */}
        {toastMessage && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-in slide-in-from-top-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Main Scrollable Content Area (ensures smooth scrolling on mobile phones even when AutoConfig is open) */}
        <div className="flex-1 overflow-y-auto flex flex-col">
        {/* BẢNG CẤU HÌNH MỐC THỜI GIAN BẮT ĐẦU TÍNH ĐIỂM & ĐIỀU KIỆN TRAO TỰ ĐỘNG */}
        {showAutoConfigPanel && (
          <div className="p-3 sm:p-4 bg-indigo-50/70 border-b border-indigo-200/80 space-y-3 shrink-0">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              {/* Cột 1: Mốc thời gian bắt đầu tính điểm & Chế độ tự động (7 cột) */}
              <div className="lg:col-span-7 p-3 rounded-2xl bg-white border border-indigo-200 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-extrabold text-slate-900 uppercase tracking-tight">
                      1. Mốc Thời Gian Bắt Đầu Tính Điểm &amp; Xét Huy Hiệu Tự Động
                    </span>
                  </div>

                  {onUpdateSettings && (
                    <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-300 cursor-pointer text-[11px] font-bold text-emerald-900">
                      <input
                        type="checkbox"
                        checked={autoEnabled}
                        onChange={e =>
                          onUpdateSettings({ tuDongTraoHuyHieu: e.target.checked })
                        }
                        className="w-3.5 h-3.5 accent-emerald-600 rounded cursor-pointer"
                      />
                      <span>{autoEnabled ? '🟢 Đang BẬT tự động trao' : '⚪ Đang TẮT tự động'}</span>
                    </label>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Bắt đầu tính điểm &amp; xét từ Tuần:
                    </label>
                    <select
                      value={startWeekVal}
                      onChange={e => {
                        const w = Number(e.target.value);
                        onUpdateSettings?.({
                          tuanBatDauTinhDiem: w,
                          tuanBatDauXetHuyHieu: w,
                        });
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {Array.from({ length: 35 }, (_, i) => i + 1).map(w => (
                        <option key={w} value={w}>
                          Tuần {w} {w === currentWeek ? '(Tuần hiện tại)' : w === 1 ? '(Đầu năm học)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Mốc ngày bắt đầu tính (Tùy chọn):
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="date"
                        value={startDateVal}
                        onChange={e => {
                          const d = e.target.value;
                          onUpdateSettings?.({
                            ngayBatDauTinhDiem: d,
                            ngayBatDauXetHuyHieu: d,
                          });
                        }}
                        className="flex-1 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      {startDateVal && (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateSettings?.({
                              ngayBatDauTinhDiem: '',
                              ngayBatDauXetHuyHieu: '',
                            })
                          }
                          title="Xóa lọc mốc ngày"
                          className="px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-300 text-[10px] font-bold cursor-pointer"
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-1.5 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[11px] text-slate-600">
                      Đang xét từ <b>Tuần {startWeekVal}</b> → <b>Tuần {currentWeek}</b>
                      {startDateVal ? ` (từ ngày ${startDateVal})` : ''}.
                    </span>

                    <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-900 bg-amber-50/80 px-2.5 py-1 rounded-lg border border-amber-200 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={autoRevokeBeforeRecalc}
                        onChange={e => setAutoRevokeBeforeRecalc(e.target.checked)}
                        className="w-3.5 h-3.5 accent-amber-600 rounded cursor-pointer"
                      />
                      <span>Tự động thu hồi sạch trước khi bấm Tính lại</span>
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setShowRevokeAllConfirm(true)}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-bold flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Thu hồi tất cả huy hiệu</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRunAutoAward(false)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                      <span>Xét &amp; Trao thêm tự động</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRunAutoAward(true)}
                      title="Thu hồi các huy hiệu cũ và tính lại chuẩn theo mốc thời gian mới"
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Tính lại huy hiệu</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Cột 2: Chọn điều kiện trao nhanh cho từng Loại/Nhóm huy hiệu (5 cột) */}
              <div className="lg:col-span-5 p-3 rounded-2xl bg-white border border-amber-200 shadow-2xs space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-extrabold text-slate-900 uppercase tracking-tight">
                    2. Chọn Điều Kiện Chung Cho Từng Loại Huy Hiệu
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                      Loại huy hiệu:
                    </label>
                    <select
                      value={batchCategory}
                      onChange={e => {
                        const cat = e.target.value as BadgeCategory;
                        setBatchCategory(cat);
                        if (cat === 'discipline') setBatchConditionType('min_week_score');
                        else if (cat === 'academic') setBatchConditionType('min_gpa');
                        else if (cat === 'movement') setBatchConditionType('min_bonus_points');
                        else setBatchConditionType('is_cadre_role');
                      }}
                      className="w-full px-2 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900"
                    >
                      <option value="discipline">🛡️ Nhóm Kỷ luật &amp; Chuyên cần</option>
                      <option value="academic">📚 Nhóm Học tập &amp; Tri thức</option>
                      <option value="movement">🚩 Nhóm Phong trào &amp; Đoàn hội</option>
                      <option value="cadre">⭐ Nhóm Tập thể &amp; Cán sự</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                      Nguyên tắc xét trao:
                    </label>
                    <select
                      value={batchConditionType}
                      onChange={e => setBatchConditionType(e.target.value as BadgeAutoConditionType)}
                      className="w-full px-2 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900"
                    >
                      {Object.entries(BADGE_CONDITION_TYPE_LABELS).map(([k, label]) => (
                        <option key={k} value={k}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Các tham số ngưỡng cho nhóm */}
                <div className="flex items-center justify-between gap-2 pt-0.5 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    {(batchConditionType === 'min_week_score' ||
                      batchConditionType === 'min_avg_score' ||
                      batchConditionType === 'is_cadre_role' ||
                      batchConditionType === 'top_rank') && (
                      <label className="inline-flex items-center gap-1 font-bold text-slate-700">
                        <span>Điểm &gt;=</span>
                        <input
                          type="number"
                          min={50}
                          max={120}
                          value={batchMinScore}
                          onChange={e => setBatchMinScore(Number(e.target.value))}
                          className="w-14 px-1.5 py-1 rounded-lg bg-slate-50 border border-slate-300 text-center font-extrabold text-slate-900"
                        />
                      </label>
                    )}

                    {(batchConditionType === 'min_week_score' ||
                      batchConditionType === 'zero_violations_weeks' ||
                      batchConditionType === 'no_group_violation') && (
                      <label className="inline-flex items-center gap-1 font-bold text-slate-700">
                        <span>Số tuần &gt;=</span>
                        <input
                          type="number"
                          min={1}
                          max={35}
                          value={batchMinWeeks}
                          onChange={e => setBatchMinWeeks(Number(e.target.value))}
                          className="w-12 px-1.5 py-1 rounded-lg bg-slate-50 border border-slate-300 text-center font-extrabold text-slate-900"
                        />
                      </label>
                    )}

                    {batchConditionType === 'min_gpa' && (
                      <label className="inline-flex items-center gap-1 font-bold text-slate-700">
                        <span>ĐTB môn &gt;=</span>
                        <input
                          type="number"
                          step="0.1"
                          min={5}
                          max={10}
                          value={batchMinGpa}
                          onChange={e => setBatchMinGpa(Number(e.target.value))}
                          className="w-14 px-1.5 py-1 rounded-lg bg-slate-50 border border-slate-300 text-center font-extrabold text-slate-900"
                        />
                      </label>
                    )}

                    {batchConditionType === 'min_bonus_points' && (
                      <label className="inline-flex items-center gap-1 font-bold text-slate-700">
                        <span>Điểm cộng &gt;=</span>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={batchMinBonus}
                          onChange={e => setBatchMinBonus(Number(e.target.value))}
                          className="w-14 px-1.5 py-1 rounded-lg bg-slate-50 border border-slate-300 text-center font-extrabold text-slate-900"
                        />
                      </label>
                    )}

                    {batchConditionType === 'top_rank' && (
                      <label className="inline-flex items-center gap-1 font-bold text-slate-700">
                        <span>Top &lt;=</span>
                        <input
                          type="number"
                          min={1}
                          max={48}
                          value={batchMaxRank}
                          onChange={e => setBatchMaxRank(Number(e.target.value))}
                          className="w-12 px-1.5 py-1 rounded-lg bg-slate-50 border border-slate-300 text-center font-extrabold text-slate-900"
                        />
                      </label>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyBatchCategoryCondition}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold cursor-pointer shadow-xs active:scale-95 ml-auto"
                  >
                    Áp dụng cho nhóm này
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Bar & Search */}
        <div className="px-4 py-3 border-b border-token bg-surface flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 p-1 bg-surface-2 rounded-2xl border border-token text-xs overflow-x-auto w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-surface text-main shadow-xs'
                  : 'text-muted hover:text-main'
              }`}
            >
              Tất cả ({catalog.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('discipline')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === 'discipline'
                  ? 'bg-surface text-main shadow-xs'
                  : 'text-muted hover:text-main'
              }`}
            >
              🛡️ Kỷ luật ({catalog.filter(b => b.category === 'discipline').length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('academic')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === 'academic'
                  ? 'bg-surface text-main shadow-xs'
                  : 'text-muted hover:text-main'
              }`}
            >
              📚 Học tập ({catalog.filter(b => b.category === 'academic').length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('movement')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === 'movement'
                  ? 'bg-surface text-main shadow-xs'
                  : 'text-muted hover:text-main'
              }`}
            >
              🚩 Phong trào ({catalog.filter(b => b.category === 'movement').length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('cadre')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === 'cadre'
                  ? 'bg-surface text-main shadow-xs'
                  : 'text-muted hover:text-main'
              }`}
            >
              ⭐ Cán sự &amp; Lớp ({catalog.filter(b => b.category === 'cadre').length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm tên huy hiệu, điều kiện trao..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-2 border border-token text-xs text-main placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        {/* Badges Grid View */}
        <div className="p-3 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredBadges.map(badge => {
              const awardedCount = Object.values(studentBadgesMap).filter(list =>
                list.includes(badge.id)
              ).length;
              const isAuto =
                badge.autoRule &&
                badge.autoRule.enabled &&
                badge.autoRule.conditionType !== 'manual_only';

              return (
                <div
                  key={badge.id}
                  className={`p-3.5 rounded-2xl border border-token bg-gradient-to-br ${badge.gradientBg} bg-surface hover:shadow-md transition-all flex flex-col justify-between gap-3`}
                >
                  <div className="flex items-start gap-3">
                    {/* Badge Emblem Vector Icon */}
                    <div className="shrink-0 p-1 rounded-2xl bg-surface/80 border border-token shadow-xs">
                      <BadgeEmblem type={badge.iconType} size="lg" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h3 className="text-sm font-extrabold text-main truncate">
                          {badge.name}
                        </h3>
                        <div className="flex items-center gap-1 shrink-0 flex-wrap">
                          {isBadgeReservedForCadre(badge) && (
                            <span className="text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                              👑 Chỉ Ban cán sự
                            </span>
                          )}
                          <span
                            className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-full border ${
                              isAuto
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-slate-100 text-slate-600 border-slate-300'
                            }`}
                          >
                            {isAuto ? '⚡ Tự động' : '✋ Thủ công'}
                          </span>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-surface border border-token text-muted">
                            {badge.rarity}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-muted mt-0.5 line-clamp-1">
                        {badge.description}
                      </p>

                      <div className="mt-2 p-2 rounded-xl bg-surface/80 border border-token/70 text-[11px] text-main">
                        <span className="font-bold text-accent mr-1">Điều kiện trao:</span>
                        <span className="text-slate-700 font-medium leading-relaxed">{badge.criteria}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Award Count */}
                  <div className="pt-2 border-t border-token/60 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-muted font-bold text-[11px]">
                      <Users className="w-3.5 h-3.5 text-accent" />
                      <span>{awardedCount} học sinh sở hữu</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingBadge(badge);
                          setEditName(badge.name);
                          setEditCriteria(badge.criteria);
                          setEditDescription(badge.description);
                          setEditAutoRule(
                            badge.autoRule || {
                              enabled: true,
                              conditionType: 'min_week_score',
                              minScore: 100,
                              minWeeks: 1,
                            }
                          );
                        }}
                        className="px-2.5 py-1 rounded-xl bg-surface hover:bg-surface-2 border border-token text-main text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                      >
                        <Edit3 className="w-3 h-3 text-amber-500" />
                        <span>Chọn điều kiện</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAwardingBadge(badge)}
                        className="px-2.5 py-1 rounded-xl bg-accent text-on-accent text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs hover:opacity-95 active:scale-95"
                      >
                        <Award className="w-3 h-3" />
                        <span>Trao tay</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </div>

        {/* Modal/Drawer 1: Edit Badge Details & Structured Condition */}
        {editingBadge && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
            <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-surface border border-token shadow-2xl p-5 sm:p-6 flex flex-col gap-4 animate-in zoom-in-95">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <BadgeEmblem type={editingBadge.iconType} size="md" />
                  <div>
                    <h3 className="text-base font-extrabold text-main">
                      Thiết Lập Điều Kiện Trao Huy Hiệu
                    </h3>
                    <p className="text-xs text-muted">{editingBadge.categoryLabel}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingBadge(null)}
                  className="p-1.5 rounded-xl text-muted hover:text-main cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-main mb-1">
                      Tên huy hiệu:
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-token text-xs text-main font-bold focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-main mb-1">
                      Mô tả ý nghĩa:
                    </label>
                    <input
                      type="text"
                      value={editDescription}
                      onChange={e => setEditDescription(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-token text-xs text-main focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>

                {/* Cấu hình điều kiện tự động */}
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-indigo-600" />
                      <span>Chọn Điều Kiện Xét Trao Tự Động:</span>
                    </span>
                    <label className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editAutoRule.enabled}
                        onChange={e => {
                          const next = { ...editAutoRule, enabled: e.target.checked };
                          setEditAutoRule(next);
                          setEditCriteria(describeBadgeAutoRule(next));
                        }}
                        className="w-4 h-4 accent-indigo-600 rounded"
                      />
                      <span>Bật tự động xét</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Loại điều kiện:
                    </label>
                    <select
                      value={editAutoRule.conditionType}
                      onChange={e => {
                        const ct = e.target.value as BadgeAutoConditionType;
                        const next: BadgeAutoRule = {
                          ...editAutoRule,
                          enabled: ct !== 'manual_only',
                          conditionType: ct,
                        };
                        setEditAutoRule(next);
                        setEditCriteria(describeBadgeAutoRule(next));
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-indigo-200 text-xs font-bold text-slate-900"
                    >
                      {Object.entries(BADGE_CONDITION_TYPE_LABELS).map(([k, label]) => (
                        <option key={k} value={k}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tham số chi tiết theo từng loại điều kiện */}
                  {editAutoRule.conditionType !== 'manual_only' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {(editAutoRule.conditionType === 'min_week_score' ||
                        editAutoRule.conditionType === 'min_avg_score' ||
                        editAutoRule.conditionType === 'top_rank' ||
                        editAutoRule.conditionType === 'is_cadre_role') && (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Mức điểm nề nếp chuẩn (&gt;=):
                          </label>
                          <input
                            type="number"
                            min={50}
                            max={120}
                            value={editAutoRule.minScore ?? 95}
                            onChange={e => {
                              const next = { ...editAutoRule, minScore: Number(e.target.value) };
                              setEditAutoRule(next);
                              setEditCriteria(describeBadgeAutoRule(next));
                            }}
                            className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900"
                          />
                        </div>
                      )}

                      {(editAutoRule.conditionType === 'min_week_score' ||
                        editAutoRule.conditionType === 'zero_violations_weeks' ||
                        editAutoRule.conditionType === 'no_group_violation') && (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Số tuần tối thiểu cần đạt (từ mốc tính điểm):
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={35}
                            value={editAutoRule.minWeeks ?? 1}
                            onChange={e => {
                              const next = { ...editAutoRule, minWeeks: Number(e.target.value) };
                              setEditAutoRule(next);
                              setEditCriteria(describeBadgeAutoRule(next));
                            }}
                            className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900"
                          />
                        </div>
                      )}

                      {editAutoRule.conditionType === 'no_group_violation' && (
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Nhóm / Từ khóa lỗi không được vi phạm:
                          </label>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {['muộn', 'đồng phục', 'vệ sinh', 'trật tự', 'nghỉ', 'bài', 'thể dục'].map(kw => (
                              <button
                                key={kw}
                                type="button"
                                onClick={() => {
                                  const next = { ...editAutoRule, violationKeyword: kw };
                                  setEditAutoRule(next);
                                  setEditCriteria(describeBadgeAutoRule(next));
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                                  editAutoRule.violationKeyword === kw
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-white text-slate-700 border-slate-300'
                                }`}
                              >
                                {kw}
                              </button>
                            ))}
                            <input
                              type="text"
                              value={editAutoRule.violationKeyword || ''}
                              onChange={e => {
                                const next = { ...editAutoRule, violationKeyword: e.target.value };
                                setEditAutoRule(next);
                                setEditCriteria(describeBadgeAutoRule(next));
                              }}
                              placeholder="Hoặc nhập từ khóa..."
                              className="flex-1 min-w-[120px] px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-900"
                            />
                          </div>
                        </div>
                      )}

                      {editAutoRule.conditionType === 'top_rank' && (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Đạt Thứ hạng Top BXH (&lt;=):
                          </label>
                          <select
                            value={editAutoRule.maxRank ?? 5}
                            onChange={e => {
                              const next = { ...editAutoRule, maxRank: Number(e.target.value) };
                              setEditAutoRule(next);
                              setEditCriteria(describeBadgeAutoRule(next));
                            }}
                            className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900"
                          >
                            <option value={1}>Top 1 (Hạng Nhất lớp)</option>
                            <option value={3}>Top 3 dẫn đầu</option>
                            <option value={5}>Top 5 xuất sắc</option>
                            <option value={10}>Top 10 tiêu biểu</option>
                          </select>
                        </div>
                      )}

                      {editAutoRule.conditionType === 'min_bonus_points' && (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Tổng điểm cộng tối thiểu (&gt;=):
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={editAutoRule.minBonusPoints ?? 5}
                            onChange={e => {
                              const next = { ...editAutoRule, minBonusPoints: Number(e.target.value) };
                              setEditAutoRule(next);
                              setEditCriteria(describeBadgeAutoRule(next));
                            }}
                            className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900"
                          />
                        </div>
                      )}

                      {editAutoRule.conditionType === 'min_gpa' && (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Điểm trung bình các môn ĐTB (&gt;=):
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min={5.0}
                            max={10.0}
                            value={editAutoRule.minGpa ?? 8.0}
                            onChange={e => {
                              const next = { ...editAutoRule, minGpa: Number(e.target.value) };
                              setEditAutoRule(next);
                              setEditCriteria(describeBadgeAutoRule(next));
                            }}
                            className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900"
                          />
                        </div>
                      )}

                      {editAutoRule.conditionType === 'min_subject_score' && (
                        <>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Điểm TB môn học đạt từ (&gt;=):
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min={5.0}
                              max={10.0}
                              value={editAutoRule.minSubjectScore ?? 9.0}
                              onChange={e => {
                                const next = { ...editAutoRule, minSubjectScore: Number(e.target.value) };
                                setEditAutoRule(next);
                                setEditCriteria(describeBadgeAutoRule(next));
                              }}
                              className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Số lượng môn cần đạt (&gt;=):
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={12}
                              value={editAutoRule.minSubjectCount ?? 1}
                              onChange={e => {
                                const next = { ...editAutoRule, minSubjectCount: Number(e.target.value) };
                                setEditAutoRule(next);
                                setEditCriteria(describeBadgeAutoRule(next));
                              }}
                              className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900"
                            />
                          </div>
                        </>
                      )}

                      {editAutoRule.conditionType === 'is_cadre_role' && (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Chức vụ yêu cầu:
                          </label>
                          <select
                            value={editAutoRule.requiredRole || 'ANY_CADRE'}
                            onChange={e => {
                              const next = {
                                ...editAutoRule,
                                requiredRole: e.target.value as RoleCode | 'ANY_CADRE',
                              };
                              setEditAutoRule(next);
                              setEditCriteria(describeBadgeAutoRule(next));
                            }}
                            className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900"
                          >
                            <option value="ANY_CADRE">Mọi Ban cán sự / Cờ đỏ / Tổ trưởng</option>
                            <option value="LT">⭐ Lớp trưởng (LT)</option>
                            <option value="BT">🚩 Bí thư Chi đoàn (BT)</option>
                            <option value="PBT">🔥 Phó Bí thư (PBT)</option>
                            <option value="LP_HT">📖 Lớp phó Học tập (LP_HT)</option>
                            <option value="LP_LD">⚡ Lớp phó Lao động (LP_LD)</option>
                            <option value="LP_VT">🎭 Lớp phó Văn thể (LP_VT)</option>
                            <option value="CD">🏵️ Cờ đỏ nề nếp (CD)</option>
                            <option value="TT">🛡️ Tổ trưởng (TT)</option>
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-main mb-1">
                    Nội dung hiển thị điều kiện trao (GV có thể tùy chỉnh thêm):
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={editCriteria}
                    onChange={e => setEditCriteria(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-token text-xs text-main focus:outline-none focus:ring-2 focus:ring-accent resize-none leading-relaxed"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingBadge(null)}
                    className="px-4 py-2 rounded-xl bg-surface-2 hover:bg-surface border border-token text-xs font-bold text-muted hover:text-main cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-accent text-on-accent text-xs font-bold cursor-pointer shadow-md flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu điều kiện</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal/Drawer 2: Award Badge to Students */}
        {awardingBadge && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
            <div className="w-full max-w-xl max-h-[85vh] rounded-3xl bg-surface border border-token shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
              {/* Award Header */}
              <div className="p-4 border-b border-token bg-surface-2 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <BadgeEmblem type={awardingBadge.iconType} size="md" />
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-main">
                      Trao Huy Hiệu: {awardingBadge.name}
                    </h3>
                    <p className="text-xs text-muted truncate max-w-sm">
                      {awardingBadge.criteria}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAwardingBadge(null)}
                  className="p-1.5 rounded-xl text-muted hover:text-main cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Student Search */}
              <div className="p-3 border-b border-token bg-surface shrink-0">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                    placeholder="Tìm theo tên học sinh, số thứ tự, tổ..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-2 border border-token text-xs text-main placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              {/* Students Checklist */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                {students
                  .filter(s => {
                    const q = studentSearch.toLowerCase();
                    return (
                      s.hoTen.toLowerCase().includes(q) ||
                      s.maHS.toLowerCase().includes(q) ||
                      `tổ ${s.to}`.includes(q) ||
                      `#${s.viTriGhe}`.includes(q)
                    );
                  })
                  .map(st => {
                    const hasBadge = (studentBadgesMap[st.maHS] || []).includes(awardingBadge.id);
                    const isCadreOnlyBadge = isBadgeReservedForCadre(awardingBadge);
                    const studentIsCadre = isStudentCadre(st);
                    const isRestricted = isCadreOnlyBadge && !studentIsCadre && !hasBadge;

                    return (
                      <div
                        key={st.maHS}
                        onClick={() => {
                          if (isRestricted) {
                            showToast('Huy hiệu này chỉ dành riêng cho thành viên Ban cán sự lớp!');
                            return;
                          }
                          handleToggleAward(st.maHS, awardingBadge.id);
                        }}
                        className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isRestricted
                            ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                            : hasBadge
                            ? 'bg-amber-500/10 border-amber-500/40 shadow-xs cursor-pointer'
                            : 'bg-surface hover:bg-surface-2 border-token cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              st.gioiTinh === 'Nu' ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'
                            }`}
                          >
                            {getStudentAvatarInitial(st.hoTen)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-extrabold text-main truncate">
                                {st.hoTen}
                              </span>
                              <span className="text-[10px] text-muted">
                                #{st.viTriGhe} · Tổ {st.to}
                              </span>
                              {studentIsCadre && (
                                <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                                  Ban cán sự ({st.vaiTro.filter(r => r !== 'HS').join(', ')})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-1.5">
                          {hasBadge ? (
                            <span className="px-2.5 py-1 rounded-xl bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs">
                              <Check className="w-3 h-3 stroke-[3]" />
                              <span>Đã trao</span>
                            </span>
                          ) : isRestricted ? (
                            <span className="px-2 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-semibold">
                              Chỉ Ban cán sự
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-xl bg-surface-2 border border-token text-muted text-[11px] font-bold hover:text-main">
                              Chưa có
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Award Footer */}
              <div className="p-3 border-t border-token bg-surface-2 flex items-center justify-between text-xs shrink-0">
                <span className="text-muted">
                  Bấm vào học sinh để trao hoặc thu hồi huy hiệu ngay lập tức.
                </span>
                <button
                  type="button"
                  onClick={() => setAwardingBadge(null)}
                  className="px-4 py-1.5 rounded-xl bg-accent text-on-accent font-bold cursor-pointer shadow-xs"
                >
                  Xong
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
