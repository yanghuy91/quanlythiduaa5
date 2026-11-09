import React, { useState, useMemo } from 'react';
import { 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Calendar, 
  PlusCircle, 
  ShieldCheck, 
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { Student, DisciplineRecord, StudentWeekSummary } from '../../types';
import { getStudentAvatarInitial } from '../../utils/vietnamese';
import { RecorderBadge } from '../common/RecorderBadge';
import { AvatarFrame } from '../common/AvatarFrame';
import { getFrameById } from '../../data/frameData';

interface StudentInfractionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  records: DisciplineRecord[];
  summary?: StudentWeekSummary;
  currentWeek?: number;
  onAddRecordForStudent?: (student: Student) => void;
  onResolveExplanation?: (recordId: string, result: 'ChapNhan' | 'TuChoi', reason: string) => void;
  onVoidRecord?: (recordId: string, reason: string) => void;
}

export const StudentInfractionDetailModal: React.FC<StudentInfractionDetailModalProps> = ({
  isOpen,
  onClose,
  student,
  records,
  summary,
  currentWeek = 11,
  onAddRecordForStudent,
  onResolveExplanation,
  onVoidRecord,
}) => {
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'this_week' | 'hk1' | 'hk2'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending' | 'voided'>('all');
  const [voidConfirmId, setVoidConfirmId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState<string>('Giáo viên chủ nhiệm xem xét hủy ghi nhận');

  // Filter records belonging to this student
  const studentRecords = useMemo(() => {
    if (!student) return [];
    return records.filter(r => r.maHS === student.maHS);
  }, [student, records]);

  // Apply sub-filters
  const displayedRecords = useMemo(() => {
    return studentRecords.filter(r => {
      // Period filter
      if (filterPeriod === 'this_week' && r.tuanHoc !== currentWeek) return false;
      if (filterPeriod === 'hk1' && r.hocKi !== 1) return false;
      if (filterPeriod === 'hk2' && r.hocKi !== 2) return false;

      // Status filter
      if (filterStatus === 'active' && r.trangThai !== 'HieuLuc') return false;
      if (filterStatus === 'pending' && r.trangThai !== 'ChoDuyet') return false;
      if (filterStatus === 'voided' && r.trangThai !== 'DaHuy') return false;

      return true;
    });
  }, [studentRecords, filterPeriod, filterStatus, currentWeek]);

  if (!isOpen || !student) return null;

  const frameConfig = student.activeFrameId ? getFrameById(student.activeFrameId) : undefined;
  const currentScore = summary ? summary.diemHienTai : 100;
  const totalDeductions = studentRecords
    .filter(r => r.trangThai === 'HieuLuc' && r.loaiDiem === 'Tru')
    .reduce((sum, r) => sum + r.diemSo, 0);

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
                    src={student.avatarUrl}
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
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  currentScore >= 90 ? 'bg-[var(--st-ok)]/15 text-[var(--st-ok)]' :
                  currentScore >= 75 ? 'bg-accent/15 text-accent' :
                  currentScore >= 60 ? 'bg-[var(--st-warn)]/15 text-[var(--st-warn)]' :
                  'bg-[var(--st-bad)]/15 text-[var(--st-bad)]'
                }`}>
                  {currentScore}đ · {currentScore >= 90 ? 'Tốt' : currentScore >= 75 ? 'Khá' : currentScore >= 60 ? 'Đạt' : 'Cần cố gắng'}
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                Sổ chi tiết vi phạm nề nếp · Tổng điểm bị trừ: <strong className="text-[var(--st-bad)] font-bold">-{totalDeductions}đ</strong> ({studentRecords.length} lần ghi nhận)
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
          {/* Period Filter */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[11px] font-semibold text-muted mr-1">Kỳ:</span>
            {[
              { id: 'all', label: `Tất cả (${studentRecords.length})` },
              { id: 'this_week', label: `Tuần ${currentWeek}` },
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
            <div className="py-12 px-4 text-center space-y-2 bg-surface-2/30 rounded-2xl border border-dashed border-token">
              <div className="w-12 h-12 rounded-full bg-[var(--st-ok)]/15 text-[var(--st-ok)] flex items-center justify-center mx-auto shadow-2xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-main">
                Không có lỗi vi phạm nào trong bộ lọc này!
              </h4>
              <p className="text-xs text-muted max-w-sm mx-auto">
                Học sinh chấp hành tốt nội quy lớp học trong khoảng thời gian được chọn.
              </p>
            </div>
          ) : (
            displayedRecords.map(rec => {
              const isVoided = rec.trangThai === 'DaHuy';
              const isPending = rec.trangThai === 'ChoDuyet';

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

                  {/* Crucial Section: WHO RECORDED THIS VIOLATION (Role Color Badge) */}
                  <div className="mt-2.5 pt-2.5 border-t border-token/60 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold text-muted">Người ghi nhận:</span>
                      <RecorderBadge
                        vaiTro={rec.vaiTroNguoiGhi}
                        nguoiGhi={rec.nguoiGhi}
                        size="sm"
                      />
                    </div>

                    {/* Teacher Action: Void / Cancel this infraction */}
                    {!isVoided && onVoidRecord && (
                      <div>
                        {voidConfirmId === rec.maGhiNhan ? (
                          <div className="flex items-center gap-1.5 animate-fade-in">
                            <input
                              type="text"
                              value={voidReason}
                              onChange={e => setVoidReason(e.target.value)}
                              placeholder="Lý do GV hủy..."
                              className="px-2 py-1 text-[11px] bg-surface border border-token rounded-lg w-40"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                onVoidRecord(rec.maGhiNhan, voidReason);
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
                          <button
                            type="button"
                            onClick={() => setVoidConfirmId(rec.maGhiNhan)}
                            className="text-[11px] font-semibold text-muted hover:text-[var(--st-bad)] transition-colors flex items-center gap-1 cursor-pointer"
                            title="Giáo viên hủy bỏ bản ghi vi phạm này"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Hủy lỗi này</span>
                          </button>
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
              <span>Ghi nhận vi phạm cho học sinh này</span>
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
