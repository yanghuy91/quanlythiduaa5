import React from 'react';
import { 
  Layers, 
  CalendarCheck2,
  Ban,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { HierarchyPeriodFilter } from '../../types';
import { 
  SEMESTER_1_WEEKS, 
  SEMESTER_2_WEEKS, 
  getSemesterFromWeek 
} from '../../utils/hierarchy';

interface PeriodHierarchyFilterProps {
  filter: HierarchyPeriodFilter;
  onChangeFilter: (newFilter: HierarchyPeriodFilter) => void;
  currentWeek?: number;
  onChangeCurrentWeek?: (week: number) => void;
  noDataWeeks?: number[];
  onToggleNoDataWeek?: (week: number) => void;
  compact?: boolean;
}

export const PeriodHierarchyFilter: React.FC<PeriodHierarchyFilterProps> = ({
  filter,
  onChangeFilter,
  currentWeek = 3,
  onChangeCurrentWeek,
  noDataWeeks = [],
  onToggleNoDataWeek,
}) => {
  // Active semester for display: 1 or 2
  const activeSemester = filter.hocKi === 2 ? 2 : 1;
  const weeksToDisplay = activeSemester === 1 ? SEMESTER_1_WEEKS : SEMESTER_2_WEEKS;
  const normalizedNoDataWeeks = noDataWeeks.map(Number);

  const selectedWeekNumber = typeof filter.tuanHoc === 'number' ? Number(filter.tuanHoc) : null;
  const isSelectedWeekNoData = selectedWeekNumber !== null && normalizedNoDataWeeks.includes(selectedWeekNumber);
  const isSelectedWeekFuture = selectedWeekNumber !== null && selectedWeekNumber > currentWeek;

  // Preset handlers
  const handleSelectSemester = (hk: 1 | 2) => {
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

  const handleSelectWeek = (week: number) => {
    const alignedSemester = getSemesterFromWeek(week);
    onChangeFilter({
      ...filter,
      hocKi: alignedSemester,
      tuanHoc: week,
    });
  };

  const handleSelectBuoi = (buoi: 'all' | 'Sang' | 'Chieu') => {
    onChangeFilter({
      ...filter,
      buoi,
    });
  };

  // Human readable label for 4-level hierarchy: Năm học - Học kì - Tuần - Buổi
  const currentLabel = () => {
    const parts: string[] = [];
    parts.push(`Năm ${filter.namHoc}`);

    if (filter.hocKi !== 'all') {
      parts.push(`Học kì ${filter.hocKi}`);
    } else {
      parts.push('Cả năm học');
    }

    if (filter.tuanHoc !== 'all') {
      parts.push(`Tuần ${filter.tuanHoc}`);
    } else {
      parts.push('Tất cả tuần');
    }

    if (filter.buoi !== 'all') {
      parts.push(filter.buoi === 'Sang' ? 'Sáng' : 'Chiều');
    } else {
      parts.push('Cả ngày');
    }

    return parts.join(' > ');
  };

  return (
    <div className="w-full bg-surface rounded-2xl border border-token p-3 sm:p-3.5 space-y-2.5 shadow-xs text-xs">
      {/* Top Header: Current Hierarchy Breadcrumb & Current Week / No-Data Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-token">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5 flex-wrap">
              <span>Thời gian theo dõi:</span>
              {isSelectedWeekFuture && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-500/15 text-slate-600 border border-slate-400/40 text-[9px] font-extrabold">
                  <Clock className="w-2.5 h-2.5" />
                  Tuần tương lai (Chưa có điểm)
                </span>
              )}
              {!isSelectedWeekFuture && isSelectedWeekNoData && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-700 border border-amber-500/40 text-[9px] font-extrabold">
                  <Ban className="w-2.5 h-2.5" />
                  Tuần không có dữ liệu (Không tính điểm)
                </span>
              )}
            </div>
            <div className="font-extrabold text-main truncate text-xs sm:text-sm">
              {currentLabel()}
            </div>
          </div>
        </div>

        {/* Action Buttons: Mark No-Data Week, Set Current Week, Quick Jump */}
        <div className="flex items-center gap-1.5 flex-wrap self-start sm:self-auto">
          {onToggleNoDataWeek && selectedWeekNumber !== null && (
            <button
              type="button"
              onClick={() => onToggleNoDataWeek(selectedWeekNumber)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border font-bold text-xs cursor-pointer transition-all shadow-2xs ${
                isSelectedWeekNoData
                  ? 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/35 text-amber-800'
              }`}
              title={
                isSelectedWeekNoData
                  ? `Bỏ đánh dấu không có dữ liệu cho Tuần ${selectedWeekNumber}`
                  : `Đánh dấu Tuần ${selectedWeekNumber} là không có dữ liệu (nghỉ lễ/chưa học, không tính điểm)`
              }
            >
              <Ban className="w-3.5 h-3.5" />
              <span>
                {isSelectedWeekNoData
                  ? `Mở lại điểm Tuần ${selectedWeekNumber}`
                  : `Đánh dấu Tuần ${selectedWeekNumber} không có dữ liệu`}
              </span>
            </button>
          )}

          {onChangeCurrentWeek && selectedWeekNumber !== null && selectedWeekNumber !== currentWeek && (
            <button
              type="button"
              onClick={() => onChangeCurrentWeek(selectedWeekNumber)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-700 font-bold text-xs cursor-pointer transition-colors shadow-2xs"
              title={`Đặt Tuần ${selectedWeekNumber} làm tuần hiện tại của lớp`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Đặt Tuần {selectedWeekNumber} là hiện tại</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSelectWeek(currentWeek)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 font-bold text-xs cursor-pointer transition-colors shadow-2xs"
            title="Bấm để chuyển nhanh về tuần hiện tại của lớp"
          >
            <CalendarCheck2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Tuần hiện tại:</span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-500 text-white font-extrabold">
              Tuần {currentWeek}
            </span>
          </button>
        </div>
      </div>

      {/* Level 2: Semester & Session Selector */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1 p-0.5 bg-surface-2 rounded-xl border border-token text-xs font-semibold">
          <button
            type="button"
            onClick={() => handleSelectSemester(1)}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              filter.hocKi === 1 
                ? 'bg-surface text-main font-bold shadow-xs' 
                : 'text-muted hover:text-main'
            }`}
          >
            Học kì 1 (1 - 19)
          </button>
          <button
            type="button"
            onClick={() => handleSelectSemester(2)}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              filter.hocKi === 2 
                ? 'bg-surface text-main font-bold shadow-xs' 
                : 'text-muted hover:text-main'
            }`}
          >
            Học kì 2 (20 - 38)
          </button>
        </div>

        {/* Buổi Selector (Sáng / Chiều / Cả ngày) */}
        <div className="flex items-center gap-0.5 p-0.5 bg-surface-2 rounded-xl border border-token text-xs font-semibold">
          <button
            type="button"
            onClick={() => handleSelectBuoi('all')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              filter.buoi === 'all' 
                ? 'bg-surface text-main font-bold shadow-xs' 
                : 'text-muted hover:text-main'
            }`}
          >
            Cả ngày
          </button>
          <button
            type="button"
            onClick={() => handleSelectBuoi('Sang')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              filter.buoi === 'Sang' 
                ? 'bg-surface text-main font-bold shadow-xs' 
                : 'text-muted hover:text-main'
            }`}
          >
            Sáng
          </button>
          <button
            type="button"
            onClick={() => handleSelectBuoi('Chieu')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              filter.buoi === 'Chieu' 
                ? 'bg-surface text-main font-bold shadow-xs' 
                : 'text-muted hover:text-main'
            }`}
          >
            Chiều
          </button>
        </div>
      </div>

      {/* Level 3: Compact Circular Week Chips with Distinct Colors */}
      <div className="pt-0.5 space-y-2">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {weeksToDisplay.map(w => {
            const isSelected = filter.tuanHoc === w;
            const isCurrentWeekOfClass = w === currentWeek;
            const isNoData = normalizedNoDataWeeks.includes(w);
            const isFuture = w > currentWeek;

            let chipStyle =
              'bg-surface-2 border border-token text-main hover:bg-surface hover:border-accent hover:text-accent font-semibold';
            if (isSelected) {
              if (isNoData) {
                chipStyle = 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-400 font-black scale-105';
              } else if (isFuture) {
                chipStyle = 'bg-slate-600 text-white shadow-sm ring-2 ring-slate-400 font-black scale-105';
              } else {
                chipStyle = 'bg-primary text-on-primary shadow-sm ring-2 ring-accent/50 font-black scale-105';
              }
            } else if (isNoData) {
              chipStyle =
                'bg-amber-500/15 border-2 border-dashed border-amber-500 text-amber-800 font-bold hover:bg-amber-500/25';
            } else if (isCurrentWeekOfClass) {
              chipStyle =
                'bg-emerald-500/15 border-2 border-emerald-500 text-emerald-700 font-black';
            } else if (isFuture) {
              chipStyle =
                'bg-slate-200/60 border border-dashed border-slate-300 text-slate-400 hover:text-slate-600 hover:border-slate-400 font-medium';
            }

            const statusNote = isNoData
              ? ' (Tuần không có dữ liệu - Không tính điểm)'
              : isCurrentWeekOfClass
                ? ' (Tuần hiện tại của lớp)'
                : isFuture
                  ? ' (Tuần tương lai - Chưa có điểm)'
                  : '';

            return (
              <button
                key={w}
                type="button"
                onClick={() => handleSelectWeek(w)}
                title={`Tuần ${w}${statusNote}`}
                aria-label={`Tuần ${w}${statusNote}`}
                className={`relative w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full text-xs transition-all cursor-pointer flex items-center justify-center tabular-nums shrink-0 active:scale-95 shadow-2xs ${chipStyle}`}
              >
                <span className={isNoData && !isSelected ? 'line-through decoration-amber-600/80' : ''}>{w}</span>
                {isCurrentWeekOfClass && !isSelected && !isNoData && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-surface animate-pulse"
                    title="Tuần hiện tại của lớp"
                  />
                )}
                {isNoData && (
                  <span
                    className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-white text-[8px] font-black flex items-center justify-center ring-2 ring-surface"
                    title="Tuần không có dữ liệu"
                  >
                    ⊘
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend for week colors */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[10px] text-muted border-t border-token/50">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>Tuần hiện tại (Tuần {currentWeek})</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-surface-2 border border-token inline-block" />
            <span>Tuần đã học (Có tính điểm)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/30 border border-dashed border-amber-500 inline-block" />
            <span>Tuần không có dữ liệu (Không tính điểm)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-200 border border-dashed border-slate-400 inline-block" />
            <span>Tuần sau tuần hiện tại (Chưa có điểm)</span>
          </span>
        </div>
      </div>
    </div>
  );
};
