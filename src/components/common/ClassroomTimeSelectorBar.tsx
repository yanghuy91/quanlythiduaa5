import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Clock, Calendar, ChevronDown, RotateCcw } from 'lucide-react';
import {
  VIETNAM_WEEKDAYS,
  getVietnamDateInfo,
  getVietnamCurrentSession,
  getDateFromWeekAndDayIndex,
  getRealtimeNowMs,
  initRealtimeClockSync,
} from '../../utils/realtimeWeek';
import { SEMESTER_1_WEEKS, SEMESTER_2_WEEKS, getSemesterFromWeek } from '../../utils/hierarchy';

export interface ClassroomTimeSelection {
  hocKi: 1 | 2;
  tuanHoc: number;
  dayIndex: number; // 0 = Thứ 2, ..., 6 = Chủ nhật
  buoi: 'Sang' | 'Chieu';
  dateStr: string; // YYYY-MM-DD
  displayDateStr: string; // DD/MM/YYYY
  weekdayLabel: string;
}

interface ClassroomTimeSelectorBarProps {
  currentWeek: number; // Tuần chuẩn thực tế hiện tại
  selectedHocKi?: 1 | 2;
  selectedWeek?: number;
  selectedDayIndex?: number;
  selectedBuoi?: 'Sang' | 'Chieu';
  onTimeChange?: (time: ClassroomTimeSelection) => void;
  onChangeCurrentWeek?: (week: number) => void;
  isTeacher?: boolean;
  className?: string;
  compact?: boolean;
}

export const ClassroomTimeSelectorBar: React.FC<ClassroomTimeSelectorBarProps> = ({
  currentWeek,
  selectedHocKi,
  selectedWeek,
  selectedDayIndex,
  selectedBuoi,
  onTimeChange,
  onChangeCurrentWeek,
  isTeacher = false,
  className = '',
  compact = false,
}) => {
  // Lấy dữ liệu thời gian thực hiện tại của máy chủ/hệ thống
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

  // Tính toán thông tin thực tế hôm nay
  const realtimeInfo = useMemo(() => {
    const info = getVietnamDateInfo(realtimeNowMs);
    const dayIdx = info.dayOfWeek === 0 ? 6 : info.dayOfWeek - 1;
    const buoi = getVietnamCurrentSession(realtimeNowMs);
    const hk: 1 | 2 = currentWeek <= 19 ? 1 : 2;
    return {
      hocKi: hk,
      tuanHoc: currentWeek,
      dayIndex: dayIdx,
      weekdayLabel: info.weekdayLabel,
      buoi,
      dateStr: info.dateStr,
      displayDateStr: info.displayDateStr,
      realtimeDateFormatted: `${info.weekdayLabel}, ngày ${info.displayDateStr}`,
    };
  }, [realtimeNowMs, currentWeek]);

  // Trạng thái cục bộ nếu không được truyền từ props bên ngoài
  const [internalHocKi, setInternalHocKi] = useState<1 | 2>(realtimeInfo.hocKi);
  const [internalWeek, setInternalWeek] = useState<number>(realtimeInfo.tuanHoc);
  const [internalDayIndex, setInternalDayIndex] = useState<number>(realtimeInfo.dayIndex);
  const [internalBuoi, setInternalBuoi] = useState<'Sang' | 'Chieu'>(realtimeInfo.buoi);

  // Cập nhật khi realtimeInfo hoặc currentWeek thay đổi (nếu người dùng chưa chọn thủ công)
  const [hasUserOverridden, setHasUserOverridden] = useState<boolean>(false);

  useEffect(() => {
    if (!hasUserOverridden) {
      setInternalHocKi(realtimeInfo.hocKi);
      setInternalWeek(realtimeInfo.tuanHoc);
      setInternalDayIndex(realtimeInfo.dayIndex);
      setInternalBuoi(realtimeInfo.buoi);
    }
  }, [realtimeInfo, hasUserOverridden]);

  // Giá trị hoạt động (ưu tiên props nếu có)
  const activeHocKi = selectedHocKi !== undefined ? selectedHocKi : internalHocKi;
  const activeWeek = selectedWeek !== undefined ? selectedWeek : internalWeek;
  const activeDayIndex = selectedDayIndex !== undefined ? selectedDayIndex : internalDayIndex;
  const activeBuoi = selectedBuoi !== undefined ? selectedBuoi : internalBuoi;

  // Tính ngày tương ứng với bộ chọn hiện tại
  const computedDateInfo = useMemo(() => {
    return getDateFromWeekAndDayIndex(activeWeek, activeDayIndex, currentWeek);
  }, [activeWeek, activeDayIndex, currentWeek]);

  // Danh sách tuần theo học kì được chọn
  const availableWeeks = useMemo(() => {
    return activeHocKi === 1 ? SEMESTER_1_WEEKS : SEMESTER_2_WEEKS;
  }, [activeHocKi]);

  // Thông báo khi thay đổi
  const notifyChange = useCallback(
    (newHK: 1 | 2, newWeek: number, newDayIdx: number, newBuoi: 'Sang' | 'Chieu') => {
      const calc = getDateFromWeekAndDayIndex(newWeek, newDayIdx, currentWeek);
      onTimeChange?.({
        hocKi: newHK,
        tuanHoc: newWeek,
        dayIndex: newDayIdx,
        buoi: newBuoi,
        dateStr: calc.dateStr,
        displayDateStr: calc.displayDateStr,
        weekdayLabel: calc.weekdayLabel,
      });
    },
    [currentWeek, onTimeChange]
  );

  // Xử lý đổi Học kì
  const handleSelectHocKi = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const hk = Number(e.target.value) as 1 | 2;
    setHasUserOverridden(true);
    setInternalHocKi(hk);

    let nextWeek = activeWeek;
    if (hk === 1 && (nextWeek < 1 || nextWeek > 19)) {
      nextWeek = Math.min(19, Math.max(1, currentWeek <= 19 ? currentWeek : 1));
    } else if (hk === 2 && (nextWeek < 20 || nextWeek > 38)) {
      nextWeek = Math.min(38, Math.max(20, currentWeek >= 20 ? currentWeek : 20));
    }
    setInternalWeek(nextWeek);
    notifyChange(hk, nextWeek, activeDayIndex, activeBuoi);
  };

  // Xử lý đổi Tuần
  const handleSelectWeek = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const w = Number(e.target.value);
    setHasUserOverridden(true);
    setInternalWeek(w);
    const alignedHocKi = getSemesterFromWeek(w);
    setInternalHocKi(alignedHocKi);

    if (isTeacher && onChangeCurrentWeek) {
      onChangeCurrentWeek(w);
    }
    notifyChange(alignedHocKi, w, activeDayIndex, activeBuoi);
  };

  // Xử lý đổi Thứ
  const handleSelectDay = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dIdx = Number(e.target.value);
    setHasUserOverridden(true);
    setInternalDayIndex(dIdx);
    notifyChange(activeHocKi, activeWeek, dIdx, activeBuoi);
  };

  // Xử lý đổi Buổi
  const handleSelectBuoi = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const b = e.target.value as 'Sang' | 'Chieu';
    setHasUserOverridden(true);
    setInternalBuoi(b);
    notifyChange(activeHocKi, activeWeek, activeDayIndex, b);
  };

  // Nút quay về thời gian thực
  const handleResetToRealtime = () => {
    setHasUserOverridden(false);
    setInternalHocKi(realtimeInfo.hocKi);
    setInternalWeek(realtimeInfo.tuanHoc);
    setInternalDayIndex(realtimeInfo.dayIndex);
    setInternalBuoi(realtimeInfo.buoi);

    if (isTeacher && onChangeCurrentWeek && realtimeInfo.tuanHoc !== activeWeek) {
      onChangeCurrentWeek(realtimeInfo.tuanHoc);
    }

    notifyChange(realtimeInfo.hocKi, realtimeInfo.tuanHoc, realtimeInfo.dayIndex, realtimeInfo.buoi);
  };

  const isMatchingRealtime =
    activeHocKi === realtimeInfo.hocKi &&
    activeWeek === realtimeInfo.tuanHoc &&
    activeDayIndex === realtimeInfo.dayIndex &&
    activeBuoi === realtimeInfo.buoi;

  return (
    <div
      className={`rounded-2xl bg-slate-950/85 backdrop-blur-md border border-amber-400/50 shadow-xl p-2 sm:p-2.5 transition-all text-white ${className}`}
    >
      {/* Hàng 1: 4 List chọn Học kì - Tuần - Thứ - Buổi */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* 1. Học kì */}
        <div className="relative inline-flex items-center">
          <select
            value={activeHocKi}
            onChange={handleSelectHocKi}
            title="Chọn học kì"
            className="appearance-none bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] sm:text-xs pl-2.5 pr-6 py-1 rounded-xl border border-white/80 cursor-pointer shadow-xs focus:outline-none transition-all"
          >
            <option value={1} className="bg-slate-900 text-white font-bold">Học kì 1</option>
            <option value={2} className="bg-slate-900 text-white font-bold">Học kì 2</option>
          </select>
          <ChevronDown className="w-3 h-3 text-slate-950 absolute right-1.5 pointer-events-none" />
        </div>

        {/* Gạch nối */}
        <span className="text-amber-300 font-bold text-xs select-none">-</span>

        {/* 2. Tuần học */}
        <div className="relative inline-flex items-center">
          <select
            value={activeWeek}
            onChange={handleSelectWeek}
            title="Chọn tuần học"
            className="appearance-none bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] sm:text-xs pl-2.5 pr-6 py-1 rounded-xl border border-white/80 cursor-pointer shadow-xs focus:outline-none transition-all"
          >
            {availableWeeks.map(w => (
              <option key={w} value={w} className="bg-slate-900 text-white font-bold">
                Tuần {w}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-slate-950 absolute right-1.5 pointer-events-none" />
        </div>

        {/* Gạch nối */}
        <span className="text-amber-300 font-bold text-xs select-none">-</span>

        {/* 3. Thứ trong tuần */}
        <div className="relative inline-flex items-center">
          <select
            value={activeDayIndex}
            onChange={handleSelectDay}
            title="Chọn thứ trong tuần"
            className="appearance-none bg-slate-900/90 hover:bg-slate-800 text-amber-300 font-black text-[11px] sm:text-xs pl-2.5 pr-6 py-1 rounded-xl border border-amber-400/60 cursor-pointer shadow-xs focus:outline-none transition-all"
          >
            {VIETNAM_WEEKDAYS.map(d => (
              <option key={d.dayIndex} value={d.dayIndex} className="bg-slate-900 text-white font-bold">
                {d.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-amber-300 absolute right-1.5 pointer-events-none" />
        </div>

        {/* Gạch nối */}
        <span className="text-amber-300 font-bold text-xs select-none">-</span>

        {/* 4. Buổi học */}
        <div className="relative inline-flex items-center">
          <select
            value={activeBuoi}
            onChange={handleSelectBuoi}
            title="Chọn buổi học (Sáng / Chiều)"
            className="appearance-none bg-slate-900/90 hover:bg-slate-800 text-amber-300 font-black text-[11px] sm:text-xs pl-2.5 pr-6 py-1 rounded-xl border border-amber-400/60 cursor-pointer shadow-xs focus:outline-none transition-all"
          >
            <option value="Sang" className="bg-slate-900 text-white font-bold">Sáng</option>
            <option value="Chieu" className="bg-slate-900 text-white font-bold">Chiều</option>
          </select>
          <ChevronDown className="w-3 h-3 text-amber-300 absolute right-1.5 pointer-events-none" />
        </div>
      </div>

      {/* Hàng 2: Thời gian thực (ngày/tháng/năm) & Nút về thời gian thực */}
      <div className="mt-1.5 pt-1.5 border-t border-white/15 flex items-center justify-between gap-2 flex-wrap text-[10px] sm:text-[11px]">
        {/* Thời gian thực tế hôm nay */}
        <div className="flex items-center gap-1.5 text-amber-100 font-semibold drop-shadow-xs">
          <Clock className="w-3 h-3 text-emerald-400 animate-pulse shrink-0" />
          <span>Thời gian thực: <strong className="text-white font-extrabold">{realtimeInfo.realtimeDateFormatted}</strong></span>
        </div>

        {/* Trạng thái xem / Nút về hiện tại nếu đang xem tuần hoặc ngày khác */}
        {!isMatchingRealtime ? (
          <button
            type="button"
            onClick={handleResetToRealtime}
            title="Bấm để quay về thời gian thực tế hiện tại"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 font-bold text-[10px] cursor-pointer transition-colors shrink-0"
          >
            <RotateCcw className="w-2.5 h-2.5 shrink-0" />
            <span>Về hiện tại</span>
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[9.5px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Đang trực tiếp</span>
          </span>
        )}
      </div>
    </div>
  );
};
