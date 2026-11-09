import React, { useState } from 'react';
import { 
  Calendar, 
  ChevronRight, 
  Clock, 
  Filter, 
  Layers, 
  ChevronDown,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  CalendarCheck2
} from 'lucide-react';
import { HierarchyPeriodFilter } from '../../types';
import { 
  SEMESTER_1_WEEKS, 
  SEMESTER_2_WEEKS, 
  ALL_SCHOOL_WEEKS, 
  getSemesterFromWeek 
} from '../../utils/hierarchy';

interface PeriodHierarchyFilterProps {
  filter: HierarchyPeriodFilter;
  onChangeFilter: (newFilter: HierarchyPeriodFilter) => void;
  currentWeek?: number;
  onChangeCurrentWeek?: (week: number) => void;
  compact?: boolean;
}

export const PeriodHierarchyFilter: React.FC<PeriodHierarchyFilterProps> = ({
  filter,
  onChangeFilter,
  currentWeek = 3,
  onChangeCurrentWeek,
  compact = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSetCurrentWeekModal, setShowSetCurrentWeekModal] = useState(false);

  // Active semester for display: 1 or 2
  const activeSemester = filter.hocKi === 2 ? 2 : 1;
  const weeksToDisplay = activeSemester === 1 ? SEMESTER_1_WEEKS : SEMESTER_2_WEEKS;

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
      {/* Top Header: Current Hierarchy Breadcrumb & Current Week Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-token">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-muted uppercase tracking-wider">
              Thời gian theo dõi:
            </div>
            <div className="font-extrabold text-main truncate text-xs sm:text-sm">
              {currentLabel()}
            </div>
          </div>
        </div>

        {/* Current Week Quick Jump Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleSelectWeek(currentWeek)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold text-xs cursor-pointer transition-colors shadow-2xs"
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

      {/* Level 3: Compact Circular Week Chips */}
      <div className="pt-0.5">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {weeksToDisplay.map(w => {
            const isSelected = filter.tuanHoc === w;
            const isCurrentWeekOfClass = w === currentWeek;

            return (
              <button
                key={w}
                type="button"
                onClick={() => handleSelectWeek(w)}
                title={`Tuần ${w}${isCurrentWeekOfClass ? ' (Tuần hiện tại của lớp)' : ''}`}
                aria-label={`Tuần ${w}`}
                className={`relative w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center tabular-nums shrink-0 active:scale-95 shadow-2xs ${
                  isSelected
                    ? 'bg-primary text-on-primary shadow-sm ring-2 ring-accent/50 font-black scale-105'
                    : isCurrentWeekOfClass
                      ? 'bg-emerald-500/15 border-2 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-black'
                      : 'bg-surface-2 border border-token text-main hover:bg-surface hover:border-accent hover:text-accent font-semibold'
                }`}
              >
                <span>{w}</span>
                {isCurrentWeekOfClass && !isSelected && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-surface animate-pulse"
                    title="Tuần hiện tại của lớp"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
