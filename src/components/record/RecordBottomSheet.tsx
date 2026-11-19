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
import { Student, RuleItem, RoleCode, DisciplineRecord, SeverityLevel } from '../../types';
import { getCurrentSession, classifySeverityByPoints, STANDARD_RULE_CATEGORIES, normalizeRuleCategory, isRecordMatchingStudent } from '../../utils/emulation';
import { removeVietnameseAccents } from '../../utils/vietnamese';
import { RecorderBadge } from '../common/RecorderBadge';
import { 
  SEMESTER_1_WEEKS,
  SEMESTER_2_WEEKS,
  ALL_SCHOOL_WEEKS,
  getSemesterFromWeek,
} from '../../utils/hierarchy';
import {
  VIETNAM_WEEKDAYS,
  getVietnamDateInfo,
  getVietnamCurrentSession,
  getDateFromWeekAndDayIndex,
  getDayIndexFromDate,
  isTimeInFuture,
} from '../../utils/realtimeWeek';

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
  initialDayIndex?: number;
  initialSession?: 'Sang' | 'Chieu';
  currentRealtimeWeek?: number; // Tuần chuẩn thực tế hiện tại
  onSave: (payload: RecordSavePayload) => void;
  currentUserRole?: RoleCode;
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
  initialDayIndex,
  initialSession,
  currentRealtimeWeek,
  onSave,
  currentUserRole,
  existingRecords = [],
}) => {
  const [selectedRuleId, setSelectedRuleId] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('frequent');
  const [ruleSearch, setRuleSearch] = useState<string>('');
  const [showHistoryAccordion, setShowHistoryAccordion] = useState<boolean>(false);

  // Phân quyền: Giáo viên hay Ban cán sự
  const isTeacher = currentUserRole === 'GV';
  const crw = currentRealtimeWeek ?? initialWeek ?? 3;
  const realtimeTodayInfo = useMemo(() => getVietnamDateInfo(), []);
  const todayDayIndex = realtimeTodayInfo.dayOfWeek === 0 ? 6 : realtimeTodayInfo.dayOfWeek - 1;
  const realtimeCurrentSession = useMemo(() => getVietnamCurrentSession(), []);

  // Entry mode: 'preset' (Chọn lỗi có sẵn) | 'custom' (Ban cán sự/GV tự ghi lỗi vào)
  const [entryMode, setEntryMode] = useState<'preset' | 'custom'>('preset');
  const [customRuleName, setCustomRuleName] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<string>('Học tập');
  const [customPointType, setCustomPointType] = useState<'Tru' | 'Cong'>('Tru');
  const [customPoints, setCustomPoints] = useState<number>(2);

  const getRuleBorderClass = (loaiDiem: 'Tru' | 'Cong', mucDo: SeverityLevel) => {
    if (loaiDiem === 'Cong') return 'border-[1.5px] border-emerald-500';
    if (mucDo === 'Nang') return 'border-[1.5px] border-rose-600';
    if (mucDo === 'Vua') return 'border-[1.5px] border-amber-500';
    return 'border-[1.5px] border-slate-900 dark:border-slate-300';
  };
  
  // Cấu trúc 4 cấp độ thời gian: Học kì (1/2) - Tuần - Thứ (Thứ 2..CN) - Buổi (Sáng/Chiều)
  const [hocKi, setHocKi] = useState<1 | 2>(() => {
    if (initialSemester) return initialSemester;
    return getSemesterFromWeek(initialWeek || crw);
  });
  const [tuanHoc, setTuanHoc] = useState<number>(initialWeek || crw);
  const [dayIndex, setDayIndex] = useState<number>(() => initialDayIndex ?? todayDayIndex);
  const [session, setSession] = useState<'Sang' | 'Chieu'>(() => initialSession ?? realtimeCurrentSession);
  const [note, setNote] = useState<string>('');

  const studentKey = useMemo(() => students.map(s => `${s.maHS}:${s.hoTen}`).join('|'), [students]);

  React.useEffect(() => {
    if (isOpen) {
      setTuanHoc(initialWeek || crw);
      setHocKi(initialSemester ?? getSemesterFromWeek(initialWeek || crw));
      setDayIndex(initialDayIndex ?? todayDayIndex);
      setSession(initialSession ?? realtimeCurrentSession);
      setSelectedRuleId('');
      setRuleSearch('');
      setNote('');
      setCustomRuleName('');
      setShowHistoryAccordion(false);
    }
  }, [isOpen, initialWeek, initialSemester, initialDayIndex, initialSession, crw, todayDayIndex, realtimeCurrentSession, studentKey]);

  // Ngày vi phạm được tính toán tự động chính xác từ Tuần + Thứ dựa theo tuần mốc chuẩn
  const dateInfo = useMemo(() => {
    return getDateFromWeekAndDayIndex(tuanHoc, dayIndex, crw);
  }, [tuanHoc, dayIndex, crw]);

  const date = dateInfo.dateStr;

  // Danh sách tuần theo học kì đã chọn
  const availableWeeks = useMemo(() => {
    return hocKi === 1 ? SEMESTER_1_WEEKS : SEMESTER_2_WEEKS;
  }, [hocKi]);

  // Kiểm tra xem thời điểm đang chọn có phải là đánh dấu vi phạm bổ sung cho quá khứ không
  const isBackdatingRecord = useMemo(() => {
    if (tuanHoc < crw) return true;
    if (tuanHoc === crw && dayIndex < todayDayIndex) return true;
    return false;
  }, [tuanHoc, dayIndex, crw, todayDayIndex]);

  // Xử lý đổi Học kì
  const handleChangeSemester = (newHocKi: 1 | 2) => {
    if (!isTeacher && newHocKi === 2 && crw <= 19) {
      alert('Học kì 2 chưa tới. Ban cán sự chỉ có thể ghi nhận hoặc bổ sung cho Học kì 1!');
      return;
    }
    setHocKi(newHocKi);
    if (newHocKi === 1) {
      if (tuanHoc < 1 || tuanHoc > 19) {
        setTuanHoc(Math.min(19, Math.max(1, crw <= 19 ? crw : 1)));
      }
    } else {
      if (tuanHoc < 20 || tuanHoc > 38) {
        setTuanHoc(Math.min(38, Math.max(20, crw >= 20 ? crw : 20)));
      }
    }
  };

  // Xử lý đổi Tuần học (Ban cán sự được chọn tuần đã qua để ghi bổ sung, không được chọn tuần tương lai)
  const handleSelectWeek = (newWeek: number) => {
    if (!isTeacher && newWeek > crw) {
      alert(`Tuần ${newWeek} chưa tới! Ban cán sự không thể chọn thời gian trong tương lai.`);
      return;
    }
    setTuanHoc(newWeek);
    const sem = getSemesterFromWeek(newWeek);
    setHocKi(sem);
    // Nếu chuyển về tuần hiện tại mà dayIndex lớn hơn hôm nay thì reset về todayDayIndex
    if (!isTeacher && newWeek === crw && dayIndex > todayDayIndex) {
      setDayIndex(todayDayIndex);
    }
  };

  // Xử lý đổi Thứ (trong tuần hiện tại không được chọn thứ chưa tới)
  const handleSelectDay = (newDayIdx: number) => {
    if (!isTeacher && tuanHoc === crw && newDayIdx > todayDayIndex) {
      alert('Thứ này chưa tới trong tuần hiện tại! Ban cán sự không thể chọn thời gian tương lai.');
      return;
    }
    setDayIndex(newDayIdx);
    // Nếu hôm nay là buổi Sáng mà đang chọn buổi Chiều thì chuyển về Sáng
    if (!isTeacher && tuanHoc === crw && newDayIdx === todayDayIndex && realtimeCurrentSession === 'Sang' && session === 'Chieu') {
      setSession('Sang');
    }
  };

  // Xử lý đổi Buổi học (trong ngày hôm nay nếu mới buổi sáng thì không được chọn buổi chiều)
  const handleSelectSession = (newSession: 'Sang' | 'Chieu') => {
    if (!isTeacher && tuanHoc === crw && dayIndex === todayDayIndex && realtimeCurrentSession === 'Sang' && newSession === 'Chieu') {
      alert('Hiện tại mới đang là buổi Sáng! Buổi Chiều chưa diễn ra nên không thể ghi nhận vi phạm.');
      return;
    }
    setSession(newSession);
  };

  // Kiểm tra bảo vệ nghiêm ngặt: Tuyệt đối không cho Ban cán sự lưu thời gian trong tương lai
  const validateSaveAllowed = (): boolean => {
    if (!isTeacher && isTimeInFuture(tuanHoc, dayIndex, session, crw)) {
      alert('Không thể chọn thời gian chưa tới! Ban cán sự chỉ có thể ghi nhận cho thời gian hiện tại hoặc các tuần đã qua.');
      return false;
    }
    return true;
  };

  // Pinned "Hay dùng" rules (nếu chưa ghim mục nào thì lấy 8 mục đầu tiên)
  const frequentRules = useMemo(() => {
    const allowed = rules.filter(r => allowBonus || r.loaiDiem !== 'Cong');
    const pinned = allowed.filter(r => r.ghim);
    return pinned.length > 0 ? pinned : allowed.slice(0, 8);
  }, [rules, allowBonus]);

  // Danh mục phân loại vi phạm: Bỏ "Tất cả", thay bằng "Hay dùng" + 4 mục chuẩn: Học tập; Hoạt động/Lao động; Tác phong; Nề nếp/Đạo đức
  const categories = useMemo(() => {
    const base: string[] = ['frequent', ...STANDARD_RULE_CATEGORIES];
    if (allowBonus) {
      base.push('Điểm cộng');
    }
    return base;
  }, [allowBonus]);

  // Count rules per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { frequent: frequentRules.length };
    STANDARD_RULE_CATEGORIES.forEach(c => {
      counts[c] = 0;
    });
    if (allowBonus) {
      counts['Điểm cộng'] = 0;
    }
    rules.forEach(r => {
      if (!allowBonus && r.loaiDiem === 'Cong') return;
      const normCat = normalizeRuleCategory(r.nhomHanhVi, r.tenHanhVi, r.loaiDiem);
      counts[normCat] = (counts[normCat] || 0) + 1;
    });
    return counts;
  }, [rules, allowBonus, frequentRules.length]);

  // Filtered rules
  const filteredRules = useMemo(() => {
    const allowed = rules.filter(r => allowBonus || r.loaiDiem !== 'Cong');

    // Khi đang gõ tìm kiếm: tìm trên toàn bộ danh sách nội quy
    if (ruleSearch.trim()) {
      const cleanSearch = removeVietnameseAccents(ruleSearch);
      return allowed.filter(r => {
        const normCat = normalizeRuleCategory(r.nhomHanhVi, r.tenHanhVi, r.loaiDiem);
        const cleanName = removeVietnameseAccents(r.tenHanhVi);
        const cleanGroup = removeVietnameseAccents(normCat);
        return cleanName.includes(cleanSearch) || cleanGroup.includes(cleanSearch);
      });
    }

    // Khi chọn tab "Hay dùng"
    if (activeCategory === 'frequent') {
      return frequentRules;
    }

    // Khi chọn 1 trong 4 nhóm chuẩn (hoặc Điểm cộng)
    return allowed.filter(r => {
      const normCat = normalizeRuleCategory(r.nhomHanhVi, r.tenHanhVi, r.loaiDiem);
      return normCat === activeCategory || r.nhomHanhVi === activeCategory;
    });
  }, [rules, allowBonus, activeCategory, ruleSearch, frequentRules]);

  const selectedRule = useMemo(() => {
    return rules.find(r => r.maNoiQuy === selectedRuleId);
  }, [rules, selectedRuleId]);

  // Infractions previously recorded for selected students
  const studentPreviousRecords = useMemo(() => {
    if (!existingRecords || students.length === 0) return [];
    return existingRecords.filter(
      r => r.trangThai !== 'DaHuy' && students.some(s => isRecordMatchingStudent(r, s.maHS, s.hoTen))
    );
  }, [existingRecords, students]);

  if (!isOpen || students.length === 0) return null;

  const handleSelectRule = (rule: RuleItem) => {
    setSelectedRuleId(rule.maNoiQuy);

    // Fast save 1-touch mode for proficient cadres
    if (fastSaveMode) {
      if (!validateSaveAllowed()) return;
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
    if (!validateSaveAllowed()) return;

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
    if (!validateSaveAllowed()) return;
    const effectivePoints = Math.max(1, customPoints);
    const derivedSeverity = classifySeverityByPoints(effectivePoints, customPointType === 'Cong');

    const customRule: RuleItem = {
      maNoiQuy: `NQ_CUSTOM_${Date.now()}`,
      nhomHanhVi: customCategory,
      tenHanhVi: customRuleName.trim(),
      loaiDiem: customPointType,
      diemSo: effectivePoints,
      mucDo: derivedSeverity,
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
        className="w-full max-w-xl bg-surface rounded-t-2xl border-t border-token shadow-2xl flex flex-col max-h-[92vh] animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="w-full pt-1.5 pb-0.5 flex justify-center cursor-grab active:cursor-grabbing shrink-0">
          <div className="w-9 h-1 rounded-full bg-token opacity-60" />
        </div>

        {/* Sheet Header */}
        <div className="px-3.5 py-1.5 border-b border-token flex items-center justify-between shrink-0">
          <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-extrabold text-main truncate">
              {students.length === 1 ? students[0].hoTen : `Ghi ${students.length} học sinh`}
            </span>
            <span className="text-[10px] font-bold text-muted">
              ({students.length === 1 ? `Tổ ${students[0].to}` : students.map(s => s.tenRutGon).join(', ')})
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/20">
              Tuần {tuanHoc} · {session === 'Sang' ? 'Sáng' : 'Chiều'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted hover:text-main hover:bg-surface-2 transition-colors cursor-pointer shrink-0"
            aria-label="Đóng bảng ghi nhận"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Previous infractions of this student if any */}
        {studentPreviousRecords.length > 0 && (
          <div className="px-3.5 py-1.5 bg-amber-500/10 border-b border-amber-500/25 text-[11px] shrink-0">
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
              <span className="text-[10.5px] underline">
                {showHistoryAccordion ? 'Thu gọn ▲' : 'Chi tiết ▼'}
              </span>
            </button>

            {showHistoryAccordion && (
              <div className="mt-1.5 space-y-1 max-h-32 overflow-y-auto pt-1 border-t border-amber-500/20">
                {studentPreviousRecords.map(rec => (
                  <div key={rec.maGhiNhan} className="px-2 py-1.5 rounded-lg bg-surface border border-token flex items-start justify-between gap-2 text-[10.5px]">
                    <div className="min-w-0">
                      <div className="font-bold text-main leading-tight truncate">
                        {rec.tenHanhVi}
                      </div>
                      <div className="text-[9.5px] text-muted flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span>{rec.ngayHoc} ({rec.buoi === 'Sang' ? 'Sáng' : 'Chiều'}) · Tuần {rec.tuanHoc}</span>
                        <span>·</span>
                        <RecorderBadge vaiTro={rec.vaiTroNguoiGhi} nguoiGhi={rec.nguoiGhi} size="xs" />
                      </div>
                    </div>
                    <span className="text-[10.5px] font-black text-[var(--st-bad)] shrink-0">
                      -{rec.diemSo}đ
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Time Hierarchy Selector Bar: 4 List chọn Học kì - Tuần - Thứ - Buổi */}
        <div className="px-3.5 py-2 bg-surface-2 border-b border-token shrink-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <Layers className="w-3.5 h-3.5 text-accent shrink-0" />
              <span className="text-[11px] font-bold text-main truncate">
                Thời gian ghi nhận vi phạm:
              </span>
            </div>
            {isBackdatingRecord ? (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 shrink-0">
                📝 Bổ sung tuần đã qua
              </span>
            ) : (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                ⚡ Thời gian thực
              </span>
            )}
          </div>

          {/* 4 List chọn theo cấu trúc: Học kì (1/2) - Tuần - Thứ (Thứ 2..CN) - Buổi (Sáng/Chiều) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* 1. Học kì */}
            <div>
              <label className="block text-[10px] font-bold text-muted mb-0.5 uppercase tracking-wide">
                Học kì
              </label>
              <select
                value={hocKi}
                onChange={e => handleChangeSemester(Number(e.target.value) as 1 | 2)}
                className="w-full px-2 py-1 bg-surface border border-token rounded-lg text-xs font-bold text-main cursor-pointer"
              >
                <option value={1}>Học kì 1</option>
                <option value={2} disabled={!isTeacher && crw <= 19}>
                  Học kì 2 {!isTeacher && crw <= 19 ? '(Chưa tới)' : ''}
                </option>
              </select>
            </div>

            {/* 2. Tuần */}
            <div>
              <label className="block text-[10px] font-bold text-muted mb-0.5 uppercase tracking-wide">
                Tuần ({hocKi === 1 ? '1-19' : '20-38'})
              </label>
              <select
                value={tuanHoc}
                onChange={e => handleSelectWeek(Number(e.target.value))}
                className="w-full px-2 py-1 bg-surface border border-token rounded-lg text-xs font-bold text-main cursor-pointer"
              >
                {availableWeeks.map(w => {
                  const isFutureWeek = !isTeacher && w > crw;
                  return (
                    <option key={w} value={w} disabled={isFutureWeek}>
                      Tuần {w} {isFutureWeek ? '(Chưa tới)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 3. Thứ */}
            <div>
              <label className="block text-[10px] font-bold text-muted mb-0.5 uppercase tracking-wide">
                Thứ trong tuần
              </label>
              <select
                value={dayIndex}
                onChange={e => handleSelectDay(Number(e.target.value))}
                className="w-full px-2 py-1 bg-surface border border-token rounded-lg text-xs font-bold text-main cursor-pointer"
              >
                {VIETNAM_WEEKDAYS.map(d => {
                  const isFutureDay = !isTeacher && tuanHoc === crw && d.dayIndex > todayDayIndex;
                  return (
                    <option key={d.dayIndex} value={d.dayIndex} disabled={isFutureDay}>
                      {d.label} {isFutureDay ? '(Chưa tới)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 4. Buổi */}
            <div>
              <label className="block text-[10px] font-bold text-muted mb-0.5 uppercase tracking-wide">
                Buổi học
              </label>
              <select
                value={session}
                onChange={e => handleSelectSession(e.target.value as 'Sang' | 'Chieu')}
                className="w-full px-2 py-1 bg-surface border border-token rounded-lg text-xs font-bold text-main cursor-pointer"
              >
                <option value="Sang">Buổi Sáng</option>
                <option
                  value="Chieu"
                  disabled={!isTeacher && tuanHoc === crw && dayIndex === todayDayIndex && realtimeCurrentSession === 'Sang'}
                >
                  Buổi Chiều {!isTeacher && tuanHoc === crw && dayIndex === todayDayIndex && realtimeCurrentSession === 'Sang' ? '(Chưa tới)' : ''}
                </option>
              </select>
            </div>
          </div>

          {/* Dòng bên dưới ghi thời gian tương ứng & thời gian thực (ngày/tháng/năm) */}
          <div className="mt-1.5 pt-1 border-t border-token flex items-center justify-between gap-2 flex-wrap text-[10.5px]">
            <div className="flex items-center gap-1.5 text-main font-semibold">
              <Calendar className="w-3 h-3 text-accent shrink-0" />
              <span>
                Ngày vi phạm: <strong className="text-accent font-black">{dateInfo.weekdayLabel}, ngày {dateInfo.displayDateStr}</strong> ({session === 'Sang' ? 'Buổi Sáng' : 'Buổi Chiều'})
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-muted text-[10px]">
              <Clock className="w-3 h-3 text-emerald-500 shrink-0" />
              <span>Thời gian thực: {realtimeTodayInfo.weekdayLabel}, ngày {realtimeTodayInfo.displayDateStr}</span>
            </div>
          </div>

          {/* Note input */}
          <div className="mt-1.5">
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Ghi chú thêm (VD: Tiết 3, đã nhắc nhở lần 1...)"
              className="w-full px-2.5 py-1 bg-surface border border-token rounded-lg text-[11px] text-main placeholder:text-muted"
            />
          </div>
        </div>

        {/* Entry Mode Switcher: Preset Rules vs Custom Infraction */}
        <div className="p-0.5 mx-3.5 mt-2 bg-surface-2 rounded-xl border border-token flex items-center shadow-2xs text-[11px] font-bold shrink-0">
          <button
            type="button"
            onClick={() => setEntryMode('preset')}
            className={`flex-1 py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              entryMode === 'preset'
                ? 'bg-surface text-main shadow-xs'
                : 'text-muted hover:text-main'
            }`}
          >
            <ListFilter className="w-3 h-3 text-accent" />
            <span>Chọn từ nội quy ({rules.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setEntryMode('custom')}
            className={`flex-1 py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              entryMode === 'custom'
                ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-xs'
                : 'text-muted hover:text-main'
            }`}
          >
            <PenTool className="w-3 h-3 text-amber-300" />
            <span>✍️ Tự ghi lỗi vi phạm</span>
          </button>
        </div>

        {/* Sheet Content (Scrollable) */}
        <div className="p-3 overflow-y-auto space-y-2.5 flex-1 min-h-0">
          {entryMode === 'custom' ? (
            /* ======================================================== */
            /* CHẾ ĐỘ TỰ GHI LỖI VI PHẠM (DÀNH CHO BAN CÁN SỰ & GV) */
            /* ======================================================== */
            <div className="space-y-3 animate-fadeIn">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-800 dark:text-amber-200 flex items-start gap-2">
                <PenTool className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-snug">
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
                  className={`w-full px-3 py-2 bg-surface-2 rounded-xl text-xs text-main placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent font-medium shadow-2xs transition-colors ${getRuleBorderClass(
                    customPointType,
                    classifySeverityByPoints(customPoints, customPointType === 'Cong')
                  )}`}
                  autoFocus
                />
              </div>

              {/* 2. Nhóm hành vi (4 nhóm chuẩn xếp 2 hàng gọn gàng trên điện thoại) */}
              <div>
                <label className="block text-[11px] font-bold text-muted mb-1">
                  Nhóm hành vi:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[...STANDARD_RULE_CATEGORIES, ...(allowBonus ? ['Điểm cộng'] : [])].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCustomCategory(cat)}
                      className={`py-1.5 px-2 rounded-lg text-[10.5px] sm:text-xs font-bold text-center whitespace-nowrap transition-all cursor-pointer border ${
                        customCategory === cat
                          ? 'bg-primary text-on-primary border-primary shadow-xs'
                          : 'bg-surface-2 border-token text-muted hover:text-main'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Loại điểm & Số điểm */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-muted">
                    {customPointType === 'Tru' ? 'Điểm trừ áp dụng:' : 'Điểm cộng áp dụng:'}
                  </label>

                  {allowBonus && (
                    <div className="flex items-center gap-1 p-0.5 bg-surface-2 rounded-lg border border-token text-[10.5px]">
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
                      className={`px-2.5 py-1 rounded-lg font-black text-xs transition-all cursor-pointer ${
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
                      className="w-14 px-2 py-1 bg-surface-2 border border-token rounded-lg text-center font-bold text-xs text-main"
                    />
                    <span className="text-xs font-bold text-muted">đ</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* CHẾ ĐỘ CHỌN NỘI QUY CÓ SẴN (PRESET RULES - THU GỌN) */
            /* ======================================================== */
            <>
              {/* Search Rule & Category Filter Tabs */}
              <div className="space-y-1.5">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
                  <input
                    type="text"
                    value={ruleSearch}
                    onChange={e => setRuleSearch(e.target.value)}
                    placeholder="Tìm nhanh lỗi vi phạm..."
                    className="w-full pl-8 pr-3 py-1.5 bg-surface border border-token rounded-lg text-[11px] text-main placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
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
                    className="w-full px-2.5 py-1.5 rounded-lg border border-dashed border-rose-500/40 bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-bold flex items-center justify-between transition-all cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <PenTool className="w-3 h-3 shrink-0 text-rose-500" />
                      <span className="truncate">Chưa có lỗi này? Tự ghi: <strong>"{ruleSearch}"</strong></span>
                    </div>
                    <span className="text-[10.5px] underline shrink-0 font-extrabold">Tự ghi →</span>
                  </button>
                )}

                {/* Category Filter Tabs: Thay "Tất cả" bằng "Hay dùng", gồm: Hay dùng | Học tập | Hoạt động/Lao động | Tác phong | Nề nếp/Đạo đức */}
                <div className="flex flex-wrap gap-1">
                  {categories.map(cat => {
                    const cnt = categoryCounts[cat] ?? 0;
                    const label = cat === 'frequent' ? '★ Hay dùng' : cat;
                    const isSelectedTab = !ruleSearch.trim() && activeCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setRuleSearch('');
                          setActiveCategory(cat);
                        }}
                        className={`flex-auto py-1.5 px-2 rounded-lg text-[10.5px] sm:text-[11px] text-center whitespace-nowrap transition-all cursor-pointer border ${
                          isSelectedTab
                            ? 'bg-primary text-on-primary border-primary font-extrabold shadow-xs'
                            : 'bg-surface-2 border-token text-muted hover:text-main font-semibold'
                        }`}
                      >
                        {label} ({cnt})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rules List: Ghi nhỏ gọn để hiển thị được nhiều lỗi vi phạm cùng lúc */}
              <div className="space-y-1 max-h-[48vh] sm:max-h-80 overflow-y-auto pr-0.5">
                {filteredRules.map(rule => {
                  const isSelected = selectedRuleId === rule.maNoiQuy;
                  const isBonus = rule.loaiDiem === 'Cong';
                  const effectiveSeverity = rule.mucDo || classifySeverityByPoints(rule.diemSo, isBonus);
                  const borderCls = getRuleBorderClass(rule.loaiDiem, effectiveSeverity);
                  const displayCategory = normalizeRuleCategory(rule.nhomHanhVi, rule.tenHanhVi, rule.loaiDiem);

                  return (
                    <button
                      key={rule.maNoiQuy}
                      type="button"
                      onClick={() => handleSelectRule(rule)}
                      className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-left gap-1.5 transition-colors cursor-pointer ${borderCls} ${
                        isSelected 
                          ? 'bg-accent/10 ring-1 ring-accent' 
                          : 'bg-surface hover:bg-surface-2'
                      }`}
                    >
                      <div className="min-w-0 flex items-center gap-1.5 flex-1">
                        <span className="text-[11px] sm:text-xs font-semibold text-main leading-snug truncate">
                          {rule.tenHanhVi}
                        </span>
                        {(activeCategory === 'frequent' || Boolean(ruleSearch.trim())) && (
                          <span className="text-[9.5px] text-muted px-1 py-0.2 rounded bg-surface-2 shrink-0 hidden xs:inline">
                            {displayCategory}
                          </span>
                        )}
                      </div>

                      <div className="shrink-0 flex items-center gap-1">
                        <span className={`text-[10.5px] font-extrabold px-1.5 py-0.5 rounded-md ${
                          isBonus 
                            ? 'bg-[var(--st-ok)]/15 text-[var(--st-ok)]' 
                            : 'bg-[var(--st-bad)]/15 text-[var(--st-bad)]'
                        }`}>
                          {isBonus ? `+${rule.diemSo}` : `-${rule.diemSo}`}đ
                        </span>
                        {isSelected && (
                          <span className="w-3.5 h-3.5 rounded-full bg-accent text-on-accent flex items-center justify-center">
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

        {/* Sheet Footer: Compact Save Button */}
        <div className="px-3.5 py-2.5 border-t border-token bg-surface flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-token text-xs font-semibold text-muted hover:text-main hover:bg-surface-2 transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={entryMode === 'custom' ? !customRuleName.trim() : !selectedRule}
            onClick={entryMode === 'custom' ? handleCustomSave : handleManualSave}
            className={`flex-2 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer ${
              (entryMode === 'custom' ? customRuleName.trim() : selectedRule)
                ? 'bg-primary text-on-primary hover:opacity-95 active:scale-98' 
                : 'bg-surface-2 text-muted border border-token cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4 stroke-[2.5] shrink-0" />
            <span className="truncate">
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
