import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Calendar, 
  PlusCircle, 
  ShieldCheck, 
  MessageSquare,
  Edit3,
  Check
} from 'lucide-react';
import { 
  Student, 
  DisciplineRecord, 
  StudentWeekSummary, 
  HierarchyPeriodFilter, 
  TeacherSettings, 
  RoleCode 
} from '../../types';
import { getStudentAvatarInitial } from '../../utils/vietnamese';
import { RecorderBadge } from '../common/RecorderBadge';
import { AvatarFrame } from '../common/AvatarFrame';
import { getFrameById } from '../../data/frameData';
import { resolveStudentAvatar } from '../../data/avatarPresets';
import { 
  isRecordMatchingStudent, 
  parseRecordPoints, 
  isWithinEditTimeLimit, 
  getRemainingEditTimeLabel 
} from '../../utils/emulation';
import { ALL_SCHOOL_WEEKS, getSemesterFromWeek } from '../../utils/hierarchy';

interface StudentInfractionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  records: DisciplineRecord[];
  summary?: StudentWeekSummary;
  selectedWeek?: number;
  currentWeek?: number;
  initialFilterPeriod?: HierarchyPeriodFilter;
  settings?: TeacherSettings;
  viewerRole?: RoleCode;
  onAddRecordForStudent?: (student: Student) => void;
  onResolveExplanation?: (recordId: string, result: 'ChapNhan' | 'TuChoi', reason: string) => void;
  onVoidRecord?: (recordId: string, reason: string) => void;
  onUpdateRecord?: (recordId: string, updates: Partial<DisciplineRecord>) => void;
}

export const StudentInfractionDetailModal: React.FC<StudentInfractionDetailModalProps> = ({
  isOpen,
  onClose,
  student,
  records,
  summary,
  selectedWeek,
  currentWeek = 3,
  initialFilterPeriod,
  settings,
  viewerRole = 'GV',
  onAddRecordForStudent,
  onResolveExplanation,
  onVoidRecord,
  onUpdateRecord,
}) => {
  const effectiveInitialWeek = selectedWeek ?? (
    initialFilterPeriod && initialFilterPeriod.tuanHoc !== 'all'
      ? Number(initialFilterPeriod.tuanHoc)
      : currentWeek
  );

  const [activeWeek, setActiveWeek] = useState<number>(effectiveInitialWeek);
  const [filterPeriod, setFilterPeriod] = useState<'selected_week' | 'all' | 'hk1' | 'hk2'>('selected_week');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending' | 'voided'>('all');
  const [voidConfirmId, setVoidConfirmId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState<string>('Giáo viên chủ nhiệm xem xét hủy ghi nhận');

  // Inline Edit State
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editTenHanhVi, setEditTenHanhVi] = useState<string>('');
  const [editLoaiDiem, setEditLoaiDiem] = useState<'Tru' | 'Cong'>('Tru');
  const [editDiemSo, setEditDiemSo] = useState<number>(2);
  const [editTuanHoc, setEditTuanHoc] = useState<number>(effectiveInitialWeek);
  const [editBuoi, setEditBuoi] = useState<'Sang' | 'Chieu'>('Sang');
  const [editGhiChu, setEditGhiChu] = useState<string>('');

  // Sync activeWeek & filterPeriod with the currently viewed week/period whenever modal opens
  useEffect(() => {
    if (isOpen) {
      const targetW = selectedWeek ?? (
        initialFilterPeriod && initialFilterPeriod.tuanHoc !== 'all'
          ? Number(initialFilterPeriod.tuanHoc)
          : currentWeek
      );
      setActiveWeek(targetW);

      if (initialFilterPeriod && initialFilterPeriod.tuanHoc === 'all') {
        if (initialFilterPeriod.hocKi === 1) setFilterPeriod('hk1');
        else if (initialFilterPeriod.hocKi === 2) setFilterPeriod('hk2');
        else setFilterPeriod('all');
      } else {
        setFilterPeriod('selected_week');
      }
      setFilterStatus('all');
      setVoidConfirmId(null);
      setEditingRecordId(null);
    }
  }, [isOpen, student?.maHS, selectedWeek, currentWeek, initialFilterPeriod]);

  // Filter records belonging to this student (by maHS or hoTen)
  const studentRecords = useMemo(() => {
    if (!student) return [];
    return records
      .filter(r => isRecordMatchingStudent(r, student.maHS, student.hoTen))
      .sort((a, b) => new Date(b.thoiGianMayChu || 0).getTime() - new Date(a.thoiGianMayChu || 0).getTime());
  }, [student, records]);

  // Count records in activeWeek
  const activeWeekRecordsCount = useMemo(() => {
    return studentRecords.filter(r => Number(r.tuanHoc) === Number(activeWeek) && r.trangThai !== 'DaHuy').length;
  }, [studentRecords, activeWeek]);

  // Apply sub-filters
  const displayedRecords = useMemo(() => {
    return studentRecords.filter(r => {
      // Period filter
      if (filterPeriod === 'selected_week' && Number(r.tuanHoc) !== Number(activeWeek)) return false;
      if (filterPeriod === 'hk1' && Number(r.hocKi || (Number(r.tuanHoc) <= 19 ? 1 : 2)) !== 1) return false;
      if (filterPeriod === 'hk2' && Number(r.hocKi || (Number(r.tuanHoc) <= 19 ? 1 : 2)) !== 2) return false;

      // Status filter
      if (filterStatus === 'active' && r.trangThai !== 'HieuLuc') return false;
      if (filterStatus === 'pending' && r.trangThai !== 'ChoDuyet') return false;
      if (filterStatus === 'voided' && r.trangThai !== 'DaHuy') return false;

      return true;
    });
  }, [studentRecords, filterPeriod, filterStatus, activeWeek]);

  if (!isOpen || !student) return null;

  const frameId = student.customFrameId || student.activeFrameId;
  const frameConfig = frameId ? getFrameById(frameId) : undefined;

  const effectiveDisplayed = displayedRecords.filter(
    r => r.trangThai !== 'DaHuy' && r.trangThai !== 'DaChapNhan'
  );
  let totalDeductions = 0;
  let totalBonuses = 0;
  const allowBonus = settings?.batDiemCong ?? false;

  effectiveDisplayed.forEach(r => {
    const { isBonus, points } = parseRecordPoints(r);
    if (!isBonus) totalDeductions += points;
    else if (allowBonus) totalBonuses += points;
  });

  const baseScore = settings?.diemKhoiDau ?? summary?.diemKhoiDau ?? 100;
  const noDataWeeks = (settings?.noDataWeeks || []).map(Number);
  const isSelectedWeekNoData = filterPeriod === 'selected_week' && noDataWeeks.includes(Number(activeWeek));
  const isSelectedWeekFuture = filterPeriod === 'selected_week' && Number(activeWeek) > Number(currentWeek);
  const isNoScoreWeek = isSelectedWeekNoData || isSelectedWeekFuture;

  const currentScore = isNoScoreWeek
    ? baseScore
    : Math.max(0, baseScore - totalDeductions + totalBonuses);

  // Edit time limit configuration based on viewer role (GV vs HS/BCS)
  const effectiveLimitMinutes =
    viewerRole === 'GV'
      ? (settings?.thoiHanSuaDuLieuGVPhut ?? 0)
      : (settings?.thoiHanSuaHuyPhut ?? 1440);

  const handleStartEdit = (rec: DisciplineRecord) => {
    setEditingRecordId(rec.maGhiNhan);
    setEditTenHanhVi(rec.tenHanhVi);
    setEditLoaiDiem(rec.loaiDiem || 'Tru');
    setEditDiemSo(Number(rec.diemSo) || 1);
    setEditTuanHoc(Number(rec.tuanHoc) || activeWeek);
    setEditBuoi(rec.buoi || 'Sang');
    setEditGhiChu(rec.ghiChu || '');
    setVoidConfirmId(null);
  };

  const handleSaveEdit = (recordId: string) => {
    if (!onUpdateRecord || !editTenHanhVi.trim()) return;
    onUpdateRecord(recordId, {
      tenHanhVi: editTenHanhVi.trim(),
      loaiDiem: editLoaiDiem,
      diemSo: Math.max(1, Math.abs(Number(editDiemSo) || 1)),
      tuanHoc: Number(editTuanHoc),
      hocKi: getSemesterFromWeek(Number(editTuanHoc)),
      buoi: editBuoi,
      ghiChu: editGhiChu.trim() || undefined,
    });
    setEditingRecordId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-500/15 via-amber-500/10 to-blue-500/15 border-b border-token flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-accent/40 shadow-xs shrink-0 flex items-center justify-center bg-surface-2">
              <AvatarFrame frame={frameConfig} size="md">
                {student.avatarUrl ? (
                  <img
                    src={resolveStudentAvatar(student.avatarUrl)}
                    alt={student.hoTen}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div
                    className={`w-full h-full rounded-full flex items-center justify-center font-black text-sm ${
                      student.gioiTinh === 'Nu'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-sky-100 text-sky-700'
                    }`}
                  >
                    {getStudentAvatarInitial(student.hoTen)}
                  </div>
                )}
              </AvatarFrame>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-main leading-tight truncate">
                  {student.hoTen}
                </h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-surface text-main border border-token shadow-2xs">
                  Tổ {student.to}
                </span>
                {isNoScoreWeek ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 border border-amber-500/30">
                    {isSelectedWeekNoData ? `⊘ Tuần ${activeWeek} không có dữ liệu` : `⏳ Tuần ${activeWeek} chưa học`}
                  </span>
                ) : (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    currentScore >= (settings?.nguongTot ?? 90) ? 'bg-[var(--st-ok)]/15 text-[var(--st-ok)]' :
                    currentScore >= (settings?.nguongKha ?? 75) ? 'bg-accent/15 text-accent' :
                    currentScore >= (settings?.nguongDat ?? 60) ? 'bg-[var(--st-warn)]/15 text-[var(--st-warn)]' :
                    'bg-[var(--st-bad)]/15 text-[var(--st-bad)]'
                  }`}>
                    {filterPeriod === 'selected_week' ? `Tuần ${activeWeek}: ` : ''}{currentScore}đ · {currentScore >= (settings?.nguongTot ?? 90) ? 'Tốt' : currentScore >= (settings?.nguongKha ?? 75) ? 'Khá' : currentScore >= (settings?.nguongDat ?? 60) ? 'Đạt' : 'Cần cố gắng'}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted mt-0.5">
                {filterPeriod === 'selected_week' ? `Chi tiết Tuần ${activeWeek}` : filterPeriod === 'hk1' ? 'Chi tiết Học kì 1' : filterPeriod === 'hk2' ? 'Chi tiết Học kì 2' : 'Toàn bộ năm học'} · Tổng điểm trừ: <strong className="text-[var(--st-bad)] font-bold">-{totalDeductions}đ</strong>
                {allowBonus && totalBonuses > 0 ? <strong className="text-[var(--st-ok)] font-bold ml-1.5">+{totalBonuses}đ</strong> : null} ({displayedRecords.length} lần ghi nhận)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted hover:text-main hover:bg-surface-2 transition-colors cursor-pointer shrink-0"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters Toolbar */}
        <div className="p-3 bg-surface-2/60 border-b border-token flex items-center justify-between gap-2 flex-wrap text-xs">
          {/* Period Filter with direct Week Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-wrap">
            <span className="text-[11px] font-semibold text-muted mr-0.5">Kỳ:</span>
            <button
              type="button"
              onClick={() => setFilterPeriod('selected_week')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                filterPeriod === 'selected_week'
                  ? 'bg-primary text-on-primary font-bold shadow-2xs'
                  : 'bg-surface border border-token text-muted hover:text-main'
              }`}
            >
              Tuần {activeWeek} ({activeWeekRecordsCount})
            </button>

            <select
              value={activeWeek}
              onChange={e => {
                setActiveWeek(Number(e.target.value));
                setFilterPeriod('selected_week');
              }}
              className="px-2 py-1 rounded-lg bg-surface border border-token text-xs font-bold text-main cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/40"
              title="Đổi nhanh tuần cần xem"
            >
              {ALL_SCHOOL_WEEKS.map(w => (
                <option key={w} value={w}>
                  Đổi: Tuần {w}{w === currentWeek ? ' (Hiện tại)' : ''}
                </option>
              ))}
            </select>

            {[
              { id: 'all', label: `Tất cả (${studentRecords.filter(r => r.trangThai !== 'DaHuy').length})` },
              { id: 'hk1', label: 'Học kì 1' },
              { id: 'hk2', label: 'Học kì 2' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterPeriod(tab.id as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  filterPeriod === tab.id
                    ? 'bg-primary text-on-primary font-bold shadow-2xs'
                    : 'bg-surface border border-token text-muted hover:text-main'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[11px] font-semibold text-muted mr-1">Trạng thái:</span>
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'active', label: 'Hiệu lực' },
              { id: 'pending', label: 'Chờ duyệt' },
              { id: 'voided', label: 'Đã hủy' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterStatus(tab.id as any)}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  filterStatus === tab.id
                    ? 'bg-accent text-on-accent font-bold shadow-2xs'
                    : 'bg-surface border border-token text-muted hover:text-main'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Infraction List Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {displayedRecords.length === 0 ? (
            <div className="py-10 px-4 text-center space-y-2.5 bg-surface-2/30 rounded-2xl border border-dashed border-token">
              <div className="w-12 h-12 rounded-full bg-[var(--st-ok)]/15 text-[var(--st-ok)] flex items-center justify-center mx-auto shadow-2xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-main">
                {filterPeriod === 'selected_week'
                  ? `Không có lỗi vi phạm nào trong Tuần ${activeWeek}!`
                  : 'Không có lỗi vi phạm nào trong bộ lọc này!'}
              </h4>
              <p className="text-xs text-muted max-w-sm mx-auto">
                Học sinh chấp hành tốt nội quy lớp học trong khoảng thời gian được chọn (Điểm: <strong>{currentScore}đ</strong>).
              </p>
              {filterPeriod === 'selected_week' && studentRecords.filter(r => r.trangThai !== 'DaHuy').length > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterPeriod('all')}
                  className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/15 hover:bg-accent/25 text-accent border border-accent/30 text-xs font-bold cursor-pointer transition-all"
                >
                  <span>Xem {studentRecords.filter(r => r.trangThai !== 'DaHuy').length} ghi nhận của học sinh ở các tuần khác →</span>
                </button>
              )}
            </div>
          ) : (
            displayedRecords.map(rec => {
              const isVoided = rec.trangThai === 'DaHuy';
              const isPending = rec.trangThai === 'ChoDuyet';
              const isEditingThis = editingRecordId === rec.maGhiNhan;
              const withinTimeLimit = isWithinEditTimeLimit(rec.thoiGianMayChu, effectiveLimitMinutes);
              const remainingTimeLabel = getRemainingEditTimeLabel(rec.thoiGianMayChu, effectiveLimitMinutes);
              const canEditOrVoid = !isVoided && withinTimeLimit && (Boolean(onVoidRecord) || Boolean(onUpdateRecord));

              return (
                <div
                  key={rec.maGhiNhan}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                    isVoided
                      ? 'bg-surface-2/40 border-token opacity-60'
                      : isPending
                      ? 'bg-amber-500/5 border-amber-500/40 shadow-xs'
                      : 'bg-surface border-token hover:border-accent/40 shadow-xs'
                  }`}
                >
                  {/* Top line: Time, Infraction name & Points */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold text-muted flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-accent" />
                          <span>{rec.ngayHoc}</span>
                        </span>
                        <span className="text-[11px] font-semibold text-muted">
                          (Buổi {rec.buoi === 'Sang' ? 'Sáng' : 'Chiều'} · Tuần {rec.tuanHoc})
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-surface-2 text-muted border border-token">
                          {rec.nhomHanhVi}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-main mt-1 leading-snug">
                        {rec.tenHanhVi}
                      </h4>
                    </div>

                    <div className="flex flex-col items-end shrink-0 gap-1">
                      <span className={`text-sm font-black tabular-nums ${
                        rec.loaiDiem === 'Tru' ? 'text-[var(--st-bad)]' : 'text-[var(--st-ok)]'
                      }`}>
                        {rec.loaiDiem === 'Tru' ? '-' : '+'}{rec.diemSo}đ
                      </span>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isVoided
                          ? 'bg-slate-200 dark:bg-slate-800 text-muted'
                          : isPending
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          : 'bg-[var(--st-bad)]/15 text-[var(--st-bad)]'
                      }`}>
                        {isVoided ? 'Đã hủy' : isPending ? 'Chờ duyệt giải trình' : 'Hiệu lực'}
                      </span>
                    </div>
                  </div>

                  {/* Inline Edit Form when editing this record */}
                  {isEditingThis && onUpdateRecord && (
                    <div className="mt-3 p-3 rounded-xl bg-surface-2 border border-accent/40 space-y-2.5 animate-fade-in text-xs">
                      <div className="font-bold text-main flex items-center justify-between">
                        <span>✏️ Chỉnh sửa dữ liệu ghi nhận</span>
                        <button
                          type="button"
                          onClick={() => setEditingRecordId(null)}
                          className="text-muted hover:text-main text-[11px] cursor-pointer"
                        >
                          Đóng
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-muted mb-0.5">Nội dung hành vi:</label>
                          <input
                            type="text"
                            value={editTenHanhVi}
                            onChange={e => setEditTenHanhVi(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-token text-xs font-semibold text-main"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-muted mb-0.5">Loại &amp; Điểm số:</label>
                          <div className="flex items-center gap-1">
                            <select
                              value={editLoaiDiem}
                              onChange={e => setEditLoaiDiem(e.target.value as 'Tru' | 'Cong')}
                              className="px-2 py-1.5 rounded-lg bg-surface border border-token text-xs font-bold text-main"
                            >
                              <option value="Tru">Trừ (-)</option>
                              <option value="Cong">Cộng (+)</option>
                            </select>
                            <input
                              type="number"
                              min={1}
                              max={50}
                              value={editDiemSo}
                              onChange={e => setEditDiemSo(Math.max(1, Number(e.target.value) || 1))}
                              className="w-16 px-2 py-1.5 rounded-lg bg-surface border border-token text-xs font-black text-center text-main"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-muted mb-0.5">Tuần học:</label>
                          <select
                            value={editTuanHoc}
                            onChange={e => setEditTuanHoc(Number(e.target.value))}
                            className="w-full px-2 py-1.5 rounded-lg bg-surface border border-token text-xs font-bold text-main"
                          >
                            {ALL_SCHOOL_WEEKS.map(w => (
                              <option key={w} value={w}>Tuần {w}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-muted mb-0.5">Buổi:</label>
                          <select
                            value={editBuoi}
                            onChange={e => setEditBuoi(e.target.value as 'Sang' | 'Chieu')}
                            className="w-full px-2 py-1.5 rounded-lg bg-surface border border-token text-xs font-bold text-main"
                          >
                            <option value="Sang">Buổi Sáng</option>
                            <option value="Chieu">Buổi Chiều</option>
                          </select>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-[10px] font-bold text-muted mb-0.5">Ghi chú:</label>
                          <input
                            type="text"
                            value={editGhiChu}
                            onChange={e => setEditGhiChu(e.target.value)}
                            placeholder="Ghi chú thêm..."
                            className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-token text-xs text-main"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingRecordId(null)}
                          className="px-2.5 py-1 rounded-lg border border-token text-[11px] font-semibold text-muted hover:text-main cursor-pointer"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(rec.maGhiNhan)}
                          className="px-3 py-1 rounded-lg bg-accent text-on-accent text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <Check className="w-3 h-3" />
                          <span>Lưu thay đổi</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Crucial Section: WHO RECORDED THIS VIOLATION + Edit/Void Actions */}
                  <div className="mt-2.5 pt-2.5 border-t border-token/60 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold text-muted">Người ghi nhận:</span>
                      <RecorderBadge
                        vaiTro={rec.vaiTroNguoiGhi}
                        nguoiGhi={rec.nguoiGhi}
                        size="sm"
                      />
                      {!isVoided && (onVoidRecord || onUpdateRecord) && (
                        <span className="text-[10px] text-muted inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded bg-surface-2 border border-token">
                          <Clock className="w-2.5 h-2.5 text-accent" />
                          <span>{remainingTimeLabel}</span>
                        </span>
                      )}
                    </div>

                    {/* Teacher / Authorized Action: Edit or Void this infraction */}
                    {!isVoided && (onVoidRecord || onUpdateRecord) && (
                      <div>
                        {!withinTimeLimit ? (
                          <span className="text-[10.5px] text-muted italic">
                            Đã hết thời gian sửa/hủy
                          </span>
                        ) : voidConfirmId === rec.maGhiNhan ? (
                          <div className="flex items-center gap-1.5 animate-fade-in flex-wrap">
                            <input
                              type="text"
                              value={voidReason}
                              onChange={e => setVoidReason(e.target.value)}
                              placeholder="Lý do hủy..."
                              className="px-2 py-1 text-[11px] bg-surface border border-token rounded-lg w-40"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                onVoidRecord?.(rec.maGhiNhan, voidReason);
                                setVoidConfirmId(null);
                              }}
                              className="px-2 py-1 rounded-lg bg-[var(--st-bad)] text-white text-[10px] font-bold cursor-pointer"
                            >
                              Xác nhận hủy
                            </button>
                            <button
                              type="button"
                              onClick={() => setVoidConfirmId(null)}
                              className="px-1.5 py-1 text-[10px] text-muted hover:text-main cursor-pointer"
                            >
                              Đóng
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2.5">
                            {onUpdateRecord && canEditOrVoid && (
                              <button
                                type="button"
                                onClick={() => handleStartEdit(rec)}
                                className="text-[11px] font-semibold text-accent hover:underline transition-colors flex items-center gap-1 cursor-pointer"
                                title="Sửa nội dung, điểm số hoặc tuần của ghi nhận này"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Sửa dữ liệu</span>
                              </button>
                            )}
                            {onVoidRecord && canEditOrVoid && (
                              <button
                                type="button"
                                onClick={() => {
                                  setVoidConfirmId(rec.maGhiNhan);
                                  setEditingRecordId(null);
                                }}
                                className="text-[11px] font-semibold text-muted hover:text-[var(--st-bad)] transition-colors flex items-center gap-1 cursor-pointer"
                                title="Hủy bỏ bản ghi vi phạm này"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Hủy lỗi này</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Extra Note from Recorder */}
                  {rec.ghiChu && (
                    <div className="mt-2 text-xs text-muted italic bg-surface-2/40 px-2.5 py-1.5 rounded-lg border border-token/40">
                      Ghi chú: "{rec.ghiChu}"
                    </div>
                  )}

                  {/* Student's Explanation if submitted */}
                  {rec.noiDungGiaiTrinh && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-main space-y-1.5">
                      <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold text-[11px]">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Học sinh giải trình:</span>
                      </div>
                      <p className="italic text-xs">"{rec.noiDungGiaiTrinh}"</p>

                      {isPending && onResolveExplanation && (
                        <div className="pt-1.5 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onResolveExplanation(rec.maGhiNhan, 'TuChoi', 'Lý do giải trình chưa thỏa đáng.')}
                            className="px-2.5 py-1 rounded-lg border border-[var(--st-bad)]/40 text-[var(--st-bad)] text-[11px] font-bold hover:bg-[var(--st-bad)]/10 cursor-pointer"
                          >
                            Từ chối
                          </button>
                          <button
                            type="button"
                            onClick={() => onResolveExplanation(rec.maGhiNhan, 'ChapNhan', 'GVCN chấp nhận giải trình hợp lý.')}
                            className="px-3 py-1 rounded-lg bg-[var(--st-ok)] text-white text-[11px] font-bold hover:opacity-90 cursor-pointer"
                          >
                            Chấp nhận (Hủy phạt)
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-surface-2 border-t border-token flex items-center justify-between gap-2 shrink-0">
          {onAddRecordForStudent ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onAddRecordForStudent(student);
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Ghi nhận vi phạm cho học sinh này (Tuần {activeWeek})</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-token text-xs font-bold text-muted hover:text-main hover:bg-surface transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
