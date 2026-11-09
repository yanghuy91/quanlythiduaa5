import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  Clock, 
  Star, 
  Check, 
  AlertCircle,
  Plus,
  Users,
  Layers,
  PenTool,
  ListFilter
} from 'lucide-react';
import { Student, RuleItem, RoleCode, DisciplineRecord } from '../../types';
import { getCurrentSession } from '../../utils/emulation';
import { removeVietnameseAccents } from '../../utils/vietnamese';
import { RecorderBadge } from '../common/RecorderBadge';
import { 
  SEMESTER_1_WEEKS, 
  SEMESTER_2_WEEKS, 
  getSemesterFromWeek,
  CURRENT_SCHOOL_YEAR
} from '../../utils/hierarchy';

export interface RecordSavePayload {
  students: Student[];
  rule: RuleItem;
  date: string;
  session: 'Sang' | 'Chieu';
  hocKi: 1 | 2;
  tuanHoc: number;
  note?: string;
}

interface RecordBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  rules: RuleItem[];
  allowBonus: boolean;
  fastSaveMode?: boolean; // 1-touch fast save
  initialWeek?: number;
  initialSemester?: 1 | 2;
  onSave: (payload: RecordSavePayload) => void;
  currentUserRole: RoleCode;
  existingRecords?: DisciplineRecord[];
}

export const RecordBottomSheet: React.FC<RecordBottomSheetProps> = ({
  isOpen,
  onClose,
  students,
  rules,
  allowBonus,
  fastSaveMode = false,
  initialWeek = 3,
  initialSemester,
  onSave,
  currentUserRole,
  existingRecords = [],
}) => {
  const [selectedRuleId, setSelectedRuleId] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [ruleSearch, setRuleSearch] = useState<string>('');
  const [showTimeCustomizer, setShowTimeCustomizer] = useState<boolean>(false);
  const [showHistoryAccordion, setShowHistoryAccordion] = useState<boolean>(false);

  // Entry mode: 'preset' (Chọn lỗi có sẵn) | 'custom' (Ban cán sự/GV tự ghi lỗi vào)
  const [entryMode, setEntryMode] = useState<'preset' | 'custom'>('preset');
  const [customRuleName, setCustomRuleName] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<string>('Nề nếp');
  const [customPointType, setCustomPointType] = useState<'Tru' | 'Cong'>('Tru');
  const [customPoints, setCustomPoints] = useState<number>(2);
  const [customSeverity, setCustomSeverity] = useState<'Nhe' | 'Vua' | 'Nang'>('Nhe');
  
  // Time Hierarchy State: Năm học -> Học kì -> Tuần -> Buổi (Bỏ qua tháng)
  const [hocKi, setHocKi] = useState<1 | 2>(() => {
    if (initialSemester) return initialSemester;
    return getSemesterFromWeek(initialWeek);
  });
  const [tuanHoc, setTuanHoc] = useState<number>(initialWeek);
  const [session, setSession] = useState<'Sang' | 'Chieu'>(getCurrentSession);
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');

  // Weeks available according to chosen semester (HK1: 1..19, HK2: 20..38)
  const availableWeeks = useMemo(() => {
    return hocKi === 1 ? SEMESTER_1_WEEKS : SEMESTER_2_WEEKS;
  }, [hocKi]);

  // Handle changing semester
  const handleChangeSemester = (newHocKi: 1 | 2) => {
    setHocKi(newHocKi);
    if (newHocKi === 1 && (tuanHoc < 1 || tuanHoc > 19)) {
      setTuanHoc(1);
    } else if (newHocKi === 2 && (tuanHoc < 20 || tuanHoc > 38)) {
      setTuanHoc(20);
    }
  };

  // Available categories
  const categories = useMemo(() => {
    const list = ['all', 'Chuyên cần', 'Học tập', 'Nề nếp', 'Phong trào', 'Lao động - Vệ sinh'];
    if (allowBonus) {
      list.push('Điểm cộng');
    }
    return list;
  }, [allowBonus]);

  // Pinned "Hay dùng" rules
  const frequentRules = useMemo(() => {
    return rules.filter(r => r.ghim && (allowBonus || r.loaiDiem !== 'Cong'));
  }, [rules, allowBonus]);

  // Filtered rules
  const filteredRules = useMemo(() => {
    return rules.filter(r => {
      // Hide bonus rules if disabled
      if (!allowBonus && r.loaiDiem === 'Cong') return false;

      // Category filter
      if (activeCategory !== 'all' && r.nhomHanhVi !== activeCategory) {
        return false;
      }

      // Search filter
      if (ruleSearch.trim()) {
        const cleanSearch = removeVietnameseAccents(ruleSearch);
        const cleanName = removeVietnameseAccents(r.tenHanhVi);
        const cleanGroup = removeVietnameseAccents(r.nhomHanhVi);
        return cleanName.includes(cleanSearch) || cleanGroup.includes(cleanSearch);
      }

      return true;
    });
  }, [rules, allowBonus, activeCategory, ruleSearch]);

  const selectedRule = useMemo(() => {
    return rules.find(r => r.maNoiQuy === selectedRuleId);
  }, [rules, selectedRuleId]);

  // Infractions previously recorded for selected students
  const studentPreviousRecords = useMemo(() => {
    if (!existingRecords || students.length === 0) return [];
    const studentIds = new Set(students.map(s => s.maHS));
    return existingRecords.filter(r => studentIds.has(r.maHS) && r.trangThai !== 'DaHuy');
  }, [existingRecords, students]);

  if (!isOpen || students.length === 0) return null;

  const handleSelectRule = (rule: RuleItem) => {
    setSelectedRuleId(rule.maNoiQuy);

    // Fast save 1-touch mode for proficient cadres
    if (fastSaveMode) {
      onSave({
        students,
        rule,
        date,
        session,
        hocKi,
        tuanHoc,
        note: note.trim() || undefined,
      });
      onClose();
    }
  };

  const handleManualSave = () => {
    if (!selectedRule) return;

    onSave({
      students,
      rule: selectedRule,
      date,
      session,
      hocKi,
      tuanHoc,
      note: note.trim() || undefined,
    });
    onClose();
  };

  const handleCustomSave = () => {
    if (!customRuleName.trim()) return;

    const customRule: RuleItem = {
      maNoiQuy: `NQ_CUSTOM_${Date.now()}`,
      nhomHanhVi: customCategory,
      tenHanhVi: customRuleName.trim(),
      loaiDiem: customPointType,
      diemSo: Math.max(1, customPoints),
      mucDo: customSeverity,
      ghim: false,
      thuTu: 999,
    };

    onSave({
      students,
      rule: customRule,
      date,
      session,
      hocKi,
      tuanHoc,
      note: note.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 backdrop-blur-xs transition-opacity">
      {/* Bottom Sheet Modal */}
      <div 
        className="w-full max-w-xl bg-surface rounded-t-2xl border-t border-token shadow-2xl flex flex-col max-h-[88vh] animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="w-full pt-2 pb-1 flex justify-center cursor-grab active:cursor-grabbing">
          <div className="w-10 h-1 rounded-full bg-token opacity-60" />
        </div>

        {/* Sheet Header */}
        <div className="px-4 py-2 border-b border-token flex items-center justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-main">
                {students.length === 1 ? students[0].hoTen : `Ghi ${students.length} học sinh`}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/20">
                HK{hocKi} · Tuần {tuanHoc} · {session === 'Sang' ? 'Buổi Sáng' : 'Buổi Chiều'}
              </span>
            </div>
            <p className="text-[11px] text-muted truncate mt-0.5">
              {students.length === 1 ? (
                `Tổ ${students[0].to}`
              ) : (
                students.map(s => s.tenRutGon).join(', ')
              )}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-main hover:bg-surface-2 transition-colors cursor-pointer"
            aria-label="Đóng bảng phê bình"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Previous infractions of this student if any */}
        {studentPreviousRecords.length > 0 && (
          <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/25 text-xs">
            <button
              type="button"
              onClick={() => setShowHistoryAccordion(!showHistoryAccordion)}
              className="w-full flex items-center justify-between text-left font-bold text-amber-700 dark:text-amber-400 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  Đã có <strong>{studentPreviousRecords.length} vi phạm</strong> trước đó ({students[0]?.hoTen || 'Học sinh'})
                </span>
              </span>
              <span className="text-[11px] underline">
                {showHistoryAccordion ? 'Thu gọn ▲' : 'Xem chi tiết ▼'}
              </span>
            </button>

            {showHistoryAccordion && (
              <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto pt-1 border-t border-amber-500/20">
                {studentPreviousRecords.map(rec => (
                  <div key={rec.maGhiNhan} className="p-2 rounded-xl bg-surface border border-token flex items-start justify-between gap-2 text-[11px]">
                    <div className="min-w-0">
                      <div className="font-bold text-main leading-tight truncate">
                        {rec.tenHanhVi}
                      </div>
                      <div className="text-[10px] text-muted flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span>{rec.ngayHoc} ({rec.buoi === 'Sang' ? 'Sáng' : 'Chiều'}) · Tuần {rec.tuanHoc}</span>
                        <span>·</span>
                        <RecorderBadge vaiTro={rec.vaiTroNguoiGhi} nguoiGhi={rec.nguoiGhi} size="xs" />
                      </div>
                    </div>
                    <span className="text-[11px] font-black text-[var(--st-bad)] shrink-0">
                      -{rec.diemSo}đ
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Time Hierarchy Selector Bar (Năm học -> Học kì -> Tuần -> Buổi, Bỏ qua tháng) */}
        <div className="px-4 py-2 bg-surface-2 border-b border-token flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Layers className="w-3.5 h-3.5 text-accent shrink-0" />
            <span className="text-[11px] font-bold text-main truncate">
              Học kì {hocKi} &gt; Tuần {tuanHoc} &gt; {session === 'Sang' ? 'Sáng' : 'Chiều'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowTimeCustomizer(!showTimeCustomizer)}
            className="text-[11px] font-bold text-accent hover:underline flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>{showTimeCustomizer ? 'Thu gọn' : 'Đổi tuần/buổi'}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showTimeCustomizer ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Time Customizer Panel (Hierarchical Week & Session Picker) */}
        {showTimeCustomizer && (
          <div className="px-4 py-3 bg-accent/5 border-b border-token space-y-2.5 animate-fadeIn text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* 1. Học kì */}
              <div>
                <label className="block text-[10px] font-bold text-muted mb-0.5 uppercase tracking-wide">
                  Học kì
                </label>
                <select
                  value={hocKi}
                  onChange={e => handleChangeSemester(Number(e.target.value) as 1 | 2)}
                  className="w-full px-2 py-1.5 bg-surface border border-token rounded-lg text-xs font-semibold text-main cursor-pointer"
                >
                  <option value={1}>Học kì 1 (T1-19)</option>
                  <option value={2}>Học kì 2 (T20-38)</option>
                </select>
              </div>

              {/* 2. Tuần học (List tuần tương ứng học kì đã chọn) */}
              <div>
                <label className="block text-[10px] font-bold text-muted mb-0.5 uppercase tracking-wide">
                  Tuần học ({hocKi === 1 ? '1-19' : '20-38'})
                </label>
                <select
                  value={tuanHoc}
                  onChange={e => setTuanHoc(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-surface border border-token rounded-lg text-xs font-semibold text-main cursor-pointer"
                >
                  {availableWeeks.map(w => (
                    <option key={w} value={w}>
                      Tuần {w}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Buổi học */}
              <div>
                <label className="block text-[10px] font-bold text-muted mb-0.5 uppercase tracking-wide">
                  Buổi học
                </label>
                <select
                  value={session}
                  onChange={e => setSession(e.target.value as 'Sang' | 'Chieu')}
                  className="w-full px-2 py-1.5 bg-surface border border-token rounded-lg text-xs font-semibold text-main cursor-pointer"
                >
                  <option value="Sang">Buổi Sáng</option>
                  <option value="Chieu">Buổi Chiều</option>
                </select>
              </div>

              {/* 4. Ngày học */}
              <div>
                <label className="block text-[10px] font-bold text-muted mb-0.5 uppercase tracking-wide">
                  Ngày phê bình
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-2 py-1 bg-surface border border-token rounded-lg text-xs font-semibold text-main"
                />
              </div>
            </div>

            {/* Note input */}
            <div>
              <label className="block text-[10px] font-bold text-muted mb-0.5 uppercase tracking-wide">
                Ghi chú thêm (tùy chọn)
              </label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="VD: Tiết 3, đã nhắc nhở lần 1..."
                className="w-full px-2.5 py-1 bg-surface border border-token rounded-lg text-xs text-main placeholder:text-muted"
              />
            </div>
          </div>
        )}

        {/* Entry Mode Switcher: Preset Rules vs Custom Infraction */}
        <div className="p-1 mx-4 mt-3 bg-surface-2 rounded-2xl border border-token flex items-center shadow-2xs text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => setEntryMode('preset')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              entryMode === 'preset'
                ? 'bg-surface text-main shadow-xs'
                : 'text-muted hover:text-main'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5 text-accent" />
            <span>Chọn từ nội quy lớp ({rules.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setEntryMode('custom')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              entryMode === 'custom'
                ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-xs'
                : 'text-muted hover:text-main'
            }`}
          >
            <PenTool className="w-3.5 h-3.5 text-amber-300" />
            <span>✍️ Tự ghi lỗi vi phạm</span>
          </button>
        </div>

        {/* Sheet Content (Scrollable) */}
        <div className="p-4 overflow-y-auto space-y-4">
          {entryMode === 'custom' ? (
            /* ======================================================== */
            /* CHẾ ĐỘ TỰ GHI LỖI VI PHẠM (DÀNH CHO BAN CÁN SỰ & GV) */
            /* ======================================================== */
            <div className="space-y-3.5 animate-fadeIn">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                <PenTool className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Tự ghi lỗi vi phạm mới:</strong> Nhập trực tiếp tên hành vi, nhóm nề nếp và số điểm cần trừ/cộng cho {students.length} học sinh đang chọn.
                </div>
              </div>

              {/* 1. Tên hành vi vi phạm tự ghi */}
              <div>
                <label className="block text-[11px] font-bold text-main mb-1 flex items-center gap-1">
                  <span>Hành vi vi phạm tự ghi:</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={customRuleName}
                  onChange={e => setCustomRuleName(e.target.value)}
                  placeholder="VD: Sử dụng điện thoại không đúng lúc, Quên khăn lau bảng, Nói chuyện riêng..."
                  className="w-full px-3 py-2.5 bg-surface-2 border border-token rounded-xl text-xs text-main placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent font-medium shadow-2xs"
                  autoFocus
                />
              </div>

              {/* 2. Nhóm hành vi & Mức độ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-muted mb-1">
                    Nhóm hành vi:
                  </label>
                  <select
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-2 border border-token rounded-xl text-xs font-semibold text-main cursor-pointer"
                  >
                    <option value="Nề nếp">Nề nếp</option>
                    <option value="Chuyên cần">Chuyên cần</option>
                    <option value="Học tập">Học tập</option>
                    <option value="Lao động - Vệ sinh">Lao động - Vệ sinh</option>
                    <option value="Phong trào">Phong trào</option>
                    {allowBonus && <option value="Điểm cộng">Điểm cộng</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-muted mb-1">
                    Mức độ đánh giá:
                  </label>
                  <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-xl border border-token text-xs">
                    {(['Nhe', 'Vua', 'Nang'] as const).map(sev => (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => setCustomSeverity(sev)}
                        className={`flex-1 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                          customSeverity === sev
                            ? sev === 'Nang' ? 'bg-rose-600 text-white shadow-xs' : sev === 'Vua' ? 'bg-amber-500 text-white shadow-xs' : 'bg-accent text-on-accent shadow-xs'
                            : 'text-muted hover:text-main'
                        }`}
                      >
                        {sev === 'Nhe' ? 'Nhẹ' : sev === 'Vua' ? 'Vừa' : 'Nặng'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Loại điểm & Số điểm */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-muted">
                    {customPointType === 'Tru' ? 'Điểm trừ áp dụng:' : 'Điểm cộng áp dụng:'}
                  </label>

                  {allowBonus && (
                    <div className="flex items-center gap-1 p-0.5 bg-surface-2 rounded-lg border border-token text-[11px]">
                      <button
                        type="button"
                        onClick={() => setCustomPointType('Tru')}
                        className={`px-2 py-0.5 rounded-md font-bold cursor-pointer ${
                          customPointType === 'Tru' ? 'bg-rose-500 text-white' : 'text-muted'
                        }`}
                      >
                        Trừ điểm (-)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomPointType('Cong')}
                        className={`px-2 py-0.5 rounded-md font-bold cursor-pointer ${
                          customPointType === 'Cong' ? 'bg-emerald-500 text-white' : 'text-muted'
                        }`}
                      >
                        Cộng điểm (+)
                      </button>
                    </div>
                  )}
                </div>

                {/* Chọn nhanh số điểm */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[1, 2, 3, 5, 10].map(pt => (
                    <button
                      key={pt}
                      type="button"
                      onClick={() => setCustomPoints(pt)}
                      className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                        customPoints === pt
                          ? customPointType === 'Tru'
                            ? 'bg-[var(--st-bad)] text-white shadow-xs scale-105'
                            : 'bg-[var(--st-ok)] text-white shadow-xs scale-105'
                          : 'bg-surface-2 hover:bg-surface border border-token text-main'
                      }`}
                    >
                      {customPointType === 'Tru' ? `-${pt}đ` : `+${pt}đ`}
                    </button>
                  ))}

                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className="text-[11px] font-semibold text-muted">Khác:</span>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={customPoints}
                      onChange={e => setCustomPoints(Math.max(1, Number(e.target.value)))}
                      className="w-16 px-2 py-1 bg-surface-2 border border-token rounded-xl text-center font-bold text-xs text-main"
                    />
                    <span className="text-xs font-bold text-muted">đ</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* CHẾ ĐỘ CHỌN NỘI QUY CÓ SẴN (PRESET RULES) */
            /* ======================================================== */
            <>
              {/* Section: Hay dùng (Fast thumb taps) */}
              {!ruleSearch && activeCategory === 'all' && frequentRules.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted mb-2">
                    <Star className="w-3.5 h-3.5 text-accent" />
                    <span>Hay dùng</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {frequentRules.map(rule => {
                      const isSelected = selectedRuleId === rule.maNoiQuy;
                      return (
                        <button
                          key={rule.maNoiQuy}
                          type="button"
                          onClick={() => handleSelectRule(rule)}
                          className={`min-h-[44px] p-2 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                            isSelected 
                              ? 'border-accent bg-accent/10 ring-2 ring-accent/30' 
                              : 'border-token bg-surface hover:bg-surface-2'
                          }`}
                        >
                          <span className="text-xs font-semibold text-main line-clamp-2 leading-tight">
                            {rule.tenHanhVi}
                          </span>
                          <div className="flex items-center justify-between mt-1 text-[11px]">
                            <span className="font-bold text-[var(--st-bad)]">
                              -{rule.diemSo}đ
                            </span>
                            {rule.mucDo === 'Nang' && (
                              <span className="text-[9px] font-bold px-1 rounded bg-[var(--st-bad)]/15 text-[var(--st-bad)]">
                                Nặng
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Search Rule */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                <input
                  type="text"
                  value={ruleSearch}
                  onChange={e => setRuleSearch(e.target.value)}
                  placeholder="Tìm hành vi vi phạm..."
                  className="w-full pl-9 pr-4 py-2 bg-surface border border-token rounded-lg text-xs text-main placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>

              {/* Prompt to write custom infraction if searching */}
              {ruleSearch.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomRuleName(ruleSearch.trim());
                    setEntryMode('custom');
                  }}
                  className="w-full p-2.5 rounded-xl border border-dashed border-rose-500/40 bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-between transition-all cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <PenTool className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                    <span className="truncate">Chưa có lỗi này? Bấm để tự ghi: <strong>"{ruleSearch}"</strong></span>
                  </div>
                  <span className="text-[11px] underline shrink-0 font-extrabold">Tự ghi ngay →</span>
                </button>
              )}

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      activeCategory === cat 
                        ? 'bg-primary text-on-primary font-bold' 
                        : 'bg-surface-2 border border-token text-muted hover:text-main'
                    }`}
                  >
                    {cat === 'all' ? 'Tất cả' : cat}
                  </button>
                ))}
              </div>

              {/* Rules List */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {filteredRules.map(rule => {
                  const isSelected = selectedRuleId === rule.maNoiQuy;
                  const isBonus = rule.loaiDiem === 'Cong';

                  return (
                    <button
                      key={rule.maNoiQuy}
                      type="button"
                      onClick={() => handleSelectRule(rule)}
                      className={`w-full min-h-[44px] px-3 py-2 rounded-xl border flex items-center justify-between text-left transition-colors cursor-pointer ${
                        isSelected 
                          ? 'border-accent bg-accent/10 ring-2 ring-accent/30' 
                          : 'border-token bg-surface hover:bg-surface-2'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-semibold text-main truncate">
                          {rule.tenHanhVi}
                        </div>
                        <div className="text-[10px] text-muted flex items-center gap-1.5 mt-0.5">
                          <span>{rule.nhomHanhVi}</span>
                          {rule.mucDo === 'Nang' && (
                            <span className="text-[9px] font-bold text-[var(--st-bad)]">· Mức Nặng</span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          isBonus 
                            ? 'bg-[var(--st-ok)]/15 text-[var(--st-ok)]' 
                            : 'bg-[var(--st-bad)]/15 text-[var(--st-bad)]'
                        }`}>
                          {isBonus ? `+${rule.diemSo}` : `-${rule.diemSo}`}đ
                        </span>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-accent text-on-accent flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Sheet Footer: Big Thumb Save Button */}
        <div className="p-4 border-t border-token bg-surface flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-token text-xs font-semibold text-muted hover:text-main hover:bg-surface-2 transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={entryMode === 'custom' ? !customRuleName.trim() : !selectedRule}
            onClick={entryMode === 'custom' ? handleCustomSave : handleManualSave}
            className={`flex-2 py-3 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
              (entryMode === 'custom' ? customRuleName.trim() : selectedRule)
                ? 'bg-primary text-on-primary hover:opacity-95 active:scale-98' 
                : 'bg-surface-2 text-muted border border-token cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>
              {entryMode === 'custom'
                ? (customRuleName.trim() 
                    ? `Lưu lỗi tự ghi: "${customRuleName.trim()}" (${customPointType === 'Cong' ? '+' : '-'}${customPoints}đ) [T${tuanHoc}]`
                    : 'Nhập tên hành vi vi phạm để Lưu')
                : (selectedRule 
                    ? `Lưu: ${selectedRule.tenHanhVi} (${selectedRule.loaiDiem === 'Cong' ? '+' : '-'}${selectedRule.diemSo}đ) [T${tuanHoc}]` 
                    : 'Chọn hành vi để Lưu')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
