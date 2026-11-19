import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layers, 
  CalendarCheck2,
  Ban,
  Clock,
  CheckCircle2,
  RefreshCw,
  RotateCcw,
  Calendar,
  ChevronDown
} from 'lucide-react';
import { HierarchyPeriodFilter } from '../../types';
import { 
  SEMESTER_1_WEEKS, 
  SEMESTER_2_WEEKS, 
  ALL_SCHOOL_WEEKS,
  getSemesterFromWeek 
} from '../../utils/hierarchy';
import { 
  VIETNAM_WEEKDAYS,
  getVietnamDateInfo, 
  getVietnamCurrentSession,
  getDateFromWeekAndDayIndex,
  getDayIndexFromDate,
  getNextVietnamMondayDisplayStr,
  getRealtimeNowMs,
  initRealtimeClockSync
} from '../../utils/realtimeWeek';

interface PeriodHierarchyFilterProps {
  filter: HierarchyPeriodFilter;
  onChangeFilter: (newFilter: HierarchyPeriodFilter) => void;
  currentWeek?: number;
  onChangeCurrentWeek?: (week: number) => void;
  noDataWeeks?: number[];
  onToggleNoDataWeek?: (week: number) => void;
  autoAdvanceWeek?: boolean;
  onToggleAutoAdvanceWeek?: (enabled: boolean) => void;
  compact?: boolean;
}

export const PeriodHierarchyFilter: React.FC<PeriodHierarchyFilterProps> = ({
  filter,
  onChangeFilter,
  currentWeek = 3,
  onChangeCurrentWeek,
  noDataWeeks = [],
  onToggleNoDataWeek,
  autoAdvanceWeek = true,
  onToggleAutoAdvanceWeek,
}) => {
  // Đồng bộ thời gian thực tế với máy chủ đám mây
  const [realtimeNowMs, setRealtimeNowMs] = useState<number>(getRealtimeNowMs);

  useEffect(() => {
    const unsub = initRealtimeClockSync(nowMs => {
      setRealtimeNowMs(nowMs);
    });
    const interval = setInterval(() => {
      setRealtimeNowMs(getRealtimeNowMs());
    }, 15000);
    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  const realtimeInfo = useMemo(() => {
    const info = getVietnamDateInfo(realtimeNowMs);
    const dayIdx = info.dayOfWeek === 0 ? 6 : info.dayOfWeek - 1;
    const session = getVietnamCurrentSession(realtimeNowMs);
    const hk: 1 | 2 = currentWeek <= 19 ? 1 : 2;
    return {
      hocKi: hk,
      tuanHoc: currentWeek,
      dayIndex: dayIdx,
      weekdayLabel: info.weekdayLabel,
      buoi: session,
      dateStr: info.dateStr,
      displayDateStr: info.displayDateStr,
      formattedRealtime: `${info.weekdayLabel}, ngày ${info.displayDateStr}`,
    };
  }, [realtimeNowMs, currentWeek]);

  const nextMondayStr = getNextVietnamMondayDisplayStr();
  const normalizedNoDataWeeks = noDataWeeks.map(Number);

  // Xác định tuần đang chọn trong filter
  const selectedWeekNumber = typeof filter.tuanHoc === 'number' ? Number(filter.tuanHoc) : null;
  const isSelectedWeekNoData = selectedWeekNumber !== null && normalizedNoDataWeeks.includes(selectedWeekNumber);
  const isSelectedWeekFuture = selectedWeekNumber !== null && selectedWeekNumber > currentWeek;

  // Xác định thứ đang chọn từ filter.ngayHoc
  const selectedDayIndexValue: number | 'all' = useMemo(() => {
    if (!filter.ngayHoc || filter.ngayHoc === 'all') return 'all';
    return getDayIndexFromDate(filter.ngayHoc);
  }, [filter.ngayHoc]);

  // Danh sách tuần hiển thị theo học kì đang chọn
  const availableWeeks = useMemo(() => {
    if (filter.hocKi === 1) return SEMESTER_1_WEEKS;
    if (filter.hocKi === 2) return SEMESTER_2_WEEKS;
    return ALL_SCHOOL_WEEKS;
  }, [filter.hocKi]);

  // Xử lý đổi Học kì
  const handleSelectSemester = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'all') {
      onChangeFilter({
        ...filter,
        hocKi: 'all',
        tuanHoc: 'all',
        ngayHoc: 'all',
      });
      return;
    }
    const hk = Number(val) as 1 | 2;
    let targetWeek: number | 'all' = filter.tuanHoc;
    if (hk === 1) {
      if (typeof targetWeek !== 'number' || targetWeek > 19) {
        targetWeek = currentWeek <= 19 ? currentWeek : 1;
      }
    } else {
      if (typeof targetWeek !== 'number' || targetWeek < 20) {
        targetWeek = currentWeek >= 20 ? currentWeek : 20;
      }
    }
    onChangeFilter({
      ...filter,
      hocKi: hk,
      tuanHoc: targetWeek,
    });
  };

  // Xử lý đổi Tuần
  const handleSelectWeek = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'all') {
      onChangeFilter({
        ...filter,
        tuanHoc: 'all',
        ngayHoc: 'all',
      });
      return;
    }
    const w = Number(val);
    const alignedSemester = getSemesterFromWeek(w);
    let nextNgayHoc = filter.ngayHoc;
    // Nếu trước đó đang chọn 1 thứ cụ thể, cập nhật ngày tương ứng theo tuần mới
    if (selectedDayIndexValue !== 'all') {
      const calc = getDateFromWeekAndDayIndex(w, selectedDayIndexValue, currentWeek);
      nextNgayHoc = calc.dateStr;
    }
    onChangeFilter({
      ...filter,
      hocKi: alignedSemester,
      tuanHoc: w,
      ngayHoc: nextNgayHoc,
    });
  };

  // Xử lý đổi Thứ (từ Thứ 2 đến Chủ nhật hoặc Cả tuần)
  const handleSelectDay = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'all') {
      onChangeFilter({
        ...filter,
        ngayHoc: 'all',
      });
      return;
    }
    const dayIdx = Number(val);
    const activeWeek = typeof filter.tuanHoc === 'number' ? filter.tuanHoc : currentWeek;
    const calc = getDateFromWeekAndDayIndex(activeWeek, dayIdx, currentWeek);
    onChangeFilter({
      ...filter,
      tuanHoc: activeWeek,
      hocKi: getSemesterFromWeek(activeWeek),
      ngayHoc: calc.dateStr,
    });
  };

  // Xử lý đổi Buổi (Cả ngày / Sáng / Chiều)
  const handleSelectBuoi = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const b = e.target.value as 'all' | 'Sang' | 'Chieu';
    onChangeFilter({
      ...filter,
      buoi: b,
    });
  };

  // Reset về đúng tuần và ngày thực tế
  const handleResetToRealtime = () => {
    onChangeFilter({
      ...filter,
      hocKi: realtimeInfo.hocKi,
      tuanHoc: realtimeInfo.tuanHoc,
      ngayHoc: 'all', // Xem tổng thể cả tuần hiện tại
      buoi: 'all',
    });
  };

  const isMatchingRealtimeWeek =
    filter.tuanHoc === realtimeInfo.tuanHoc &&
    (filter.hocKi === 'all' || filter.hocKi === realtimeInfo.hocKi) &&
    filter.ngayHoc === 'all' &&
    filter.buoi === 'all';

  return (
    <div className="w-full bg-surface rounded-2xl border border-token p-2.5 sm:p-3 space-y-2.5 shadow-xs text-xs">
      {/* Tiêu đề & Thông báo trạng thái */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 pb-2 border-b border-token">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="font-extrabold text-main text-xs sm:text-sm truncate leading-tight">
              Thời gian xem dữ liệu &amp; Thi đua lớp
            </h4>
            <p className="text-[10px] text-muted truncate">
              Cấu trúc: Học kì - Tuần - Thứ - Buổi (tự động theo thời gian thực)
            </p>
          </div>
        </div>

        {/* Badges trạng thái tuần */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {isSelectedWeekFuture && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-400/30 text-[10px] font-extrabold">
              <Clock className="w-3 h-3" />
              Chưa học (Tuần tương lai)
            </span>
          )}
          {!isSelectedWeekFuture && isSelectedWeekNoData && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/35 text-[10px] font-extrabold">
              <Ban className="w-3 h-3" />
              Không tính điểm (Nghỉ/Lễ)
            </span>
          )}
        </div>
      </div>

      {/* Hàng 1: 4 Cột / 4 List chọn theo cấu trúc: Học kì (1/2) - Tuần - Thứ (Thứ 2..CN) - Buổi (Sáng/Chiều) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* 1. Học kì */}
        <div>
          <label className="block text-[10px] font-bold text-muted mb-0.5 uppercase tracking-wide">
            Học kì
          </label>
          <div className="relative">
            <select
              value={filter.hocKi}
              onChange={handleSelectSemester}
              className="w-full appearance-none px-2.5 py-1.5 bg-surface-2 hover:bg-surface border border-token rounded-xl text-xs font-bold text-main cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/40 transition-colors pr-7"
            >
              <option value={1}>Học kì 1</option>
              <option value={2}>Học kì 2</option>
              <option value="all">Cả năm học</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-muted absolute right-2 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* 2. Tuần học */}
        <div>
          <label className="block text-[10px] font-bold text-muted mb-0.5 uppercase tracking-wide">
            Tuần học ({filter.hocKi === 1 ? '1-19' : filter.hocKi === 2 ? '20-38' : '1-38'})
          </label>
          <div className="relative">
            <select
              value={filter.tuanHoc}
              onChange={handleSelectWeek}
              className="w-full appearance-none px-2.5 py-1.5 bg-surface-2 hover:bg-surface border border-token rounded-xl text-xs font-bold text-main cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/40 transition-colors pr-7"
            >
              {availableWeeks.map(w => (
                <option key={w} value={w}>
                  Tuần {w} {w === currentWeek ? '⭐ (Hiện tại)' : ''}
                </option>
              ))}
              <option value="all">Tất cả các tuần</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-muted absolute right-2 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* 3. Thứ trong tuần */}
        <div>
          <label className="block text-[10px] font-bold text-muted mb-0.5 uppercase tracking-wide">
            Thứ trong tuần
          </label>
          <div className="relative">
            <select
              value={selectedDayIndexValue}
              onChange={handleSelectDay}
              className="w-full appearance-none px-2.5 py-1.5 bg-surface-2 hover:bg-surface border border-token rounded-xl text-xs font-bold text-main cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/40 transition-colors pr-7"
            >
              <option value="all">Cả tuần (Thứ 2 - CN)</option>
              {VIETNAM_WEEKDAYS.map(d => (
                <option key={d.dayIndex} value={d.dayIndex}>
                  {d.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-muted absolute right-2 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* 4. Buổi học */}
        <div>
          <label className="block text-[10px] font-bold text-muted mb-0.5 uppercase tracking-wide">
            Buổi học
          </label>
          <div className="relative">
            <select
              value={filter.buoi}
              onChange={handleSelectBuoi}
              className="w-full appearance-none px-2.5 py-1.5 bg-surface-2 hover:bg-surface border border-token rounded-xl text-xs font-bold text-main cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/40 transition-colors pr-7"
            >
              <option value="all">Cả ngày (Sáng &amp; Chiều)</option>
              <option value="Sang">Buổi Sáng</option>
              <option value="Chieu">Buổi Chiều</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-muted absolute right-2 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Hàng 2: Thời gian thực (ngày/tháng/năm) & Các nút chức năng tiện ích */}
      <div className="pt-2 border-t border-token flex flex-wrap items-center justify-between gap-2 text-[11px]">
        {/* Thời gian thực tế chuẩn */}
        <div className="flex items-center gap-1.5 text-main font-semibold flex-wrap">
          <Clock className="w-3.5 h-3.5 text-emerald-500 animate-pulse shrink-0" />
          <span>
            Thời gian thực: <strong className="text-emerald-700 dark:text-emerald-400 font-extrabold">{realtimeInfo.formattedRealtime}</strong>
          </span>
          {filter.ngayHoc && filter.ngayHoc !== 'all' && (
            <span className="text-[10.5px] text-accent font-bold pl-1 border-l border-token">
              Đang lọc: {filter.ngayHoc}
            </span>
          )}
        </div>

        {/* Cụm nút hành động */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Nút quay về tuần hiện tại nếu đang xem tuần khác */}
          {!isMatchingRealtimeWeek && (
            <button
              type="button"
              onClick={handleResetToRealtime}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-700 dark:text-emerald-300 font-bold text-[10.5px] cursor-pointer transition-colors shadow-2xs"
              title="Quay về xem tuần và thời gian thực tế hiện tại"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Về hiện tại (Tuần {currentWeek})</span>
            </button>
          )}

          {/* Dành cho Giáo viên: Đặt tuần đang chọn làm tuần hiện tại của lớp */}
          {onChangeCurrentWeek && selectedWeekNumber !== null && selectedWeekNumber !== currentWeek && (
            <button
              type="button"
              onClick={() => onChangeCurrentWeek(selectedWeekNumber)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/35 text-blue-700 dark:text-blue-300 font-bold text-[10.5px] cursor-pointer transition-colors shadow-2xs"
              title={`Đặt Tuần ${selectedWeekNumber} làm tuần chuẩn hiện tại của cả lớp`}
            >
              <CheckCircle2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              <span>Đặt T{selectedWeekNumber} làm chuẩn</span>
            </button>
          )}

          {/* Nút đánh dấu nghỉ / mở lại tuần */}
          {onToggleNoDataWeek && selectedWeekNumber !== null && (
            <button
              type="button"
              onClick={() => onToggleNoDataWeek(selectedWeekNumber)}
              className={`flex items-center gap-1 px-2 py-1 rounded-xl border font-bold text-[10.5px] cursor-pointer transition-all shadow-2xs ${
                isSelectedWeekNoData
                  ? 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/35 text-amber-800 dark:text-amber-400'
              }`}
              title={
                isSelectedWeekNoData
                  ? `Bỏ đánh dấu không có dữ liệu cho Tuần ${selectedWeekNumber}`
                  : `Đánh dấu Tuần ${selectedWeekNumber} là không có dữ liệu (nghỉ lễ, không tính điểm)`
              }
            >
              <Ban className="w-3 h-3" />
              <span>
                {isSelectedWeekNoData
                  ? `Mở lại T${selectedWeekNumber}`
                  : `Nghỉ T${selectedWeekNumber}`}
              </span>
            </button>
          )}

          {/* Nút bật/tắt tự động tăng tuần vào Thứ 2 */}
          {onToggleAutoAdvanceWeek && (
            <button
              type="button"
              onClick={() => onToggleAutoAdvanceWeek(!autoAdvanceWeek)}
              className={`flex items-center gap-1 px-2 py-1 rounded-xl border font-bold text-[10.5px] cursor-pointer transition-all shadow-2xs ${
                autoAdvanceWeek
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 hover:bg-indigo-100'
                  : 'bg-surface-2 text-muted border-token hover:text-main'
              }`}
              title={`Hôm nay: ${realtimeInfo.formattedRealtime}. Tự động tăng tuần vào Thứ 2 (${nextMondayStr})`}
            >
              <RefreshCw className={`w-3 h-3 ${autoAdvanceWeek ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted'}`} />
              <span>
                {autoAdvanceWeek
                  ? `Tự sang T${Math.min(38, currentWeek + 1)} (${nextMondayStr.slice(0, 5)})`
                  : 'Tự chuyển tuần: TẮT'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
