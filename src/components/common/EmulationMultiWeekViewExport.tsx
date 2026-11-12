import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  CheckSquare,
  Square,
  FileSpreadsheet,
  ArrowUpDown,
  Trophy,
  ListOrdered,
  Calendar,
  Eye,
  Download,
} from 'lucide-react';
import {
  Student,
  DisciplineRecord,
  TeacherSettings,
} from '../../types';
import {
  calculateStudentWeekSummary,
  calculateDenseRankings,
} from '../../utils/emulation';

interface EmulationMultiWeekViewExportProps {
  students: Student[];
  records: DisciplineRecord[];
  settings: TeacherSettings;
  currentWeek: number;
  currentStudent?: Student;
  isRestrictedToOwnExport?: boolean;
  onShowToast?: (msg: string, sub?: string) => void;
}

export const EmulationMultiWeekViewExport: React.FC<EmulationMultiWeekViewExportProps> = ({
  students,
  records,
  settings,
  currentWeek,
  currentStudent,
  isRestrictedToOwnExport = false,
  onShowToast,
}) => {
  // Mặc định tích chọn tuần hiện tại
  const [selectedWeeks, setSelectedWeeks] = useState<number[]>(() => [currentWeek]);
  // Chế độ sắp xếp: 'order' (Theo thứ tự) | 'ranking' (Theo xếp hạng)
  const [sortMode, setSortMode] = useState<'order' | 'ranking'>('order');
  const [showAll35Weeks, setShowAll35Weeks] = useState(false);

  const sortedSelectedWeeks = useMemo(
    () => [...selectedWeeks].sort((a, b) => a - b),
    [selectedWeeks]
  );

  const toggleWeek = (w: number) => {
    setSelectedWeeks(prev => {
      if (prev.includes(w)) {
        if (prev.length === 1) return prev; // Giữ ít nhất 1 tuần
        return prev.filter(item => item !== w);
      }
      return [...prev, w];
    });
  };

  const selectRange = (start: number, end: number) => {
    const arr: number[] = [];
    for (let i = start; i <= end; i++) {
      arr.push(i);
    }
    setSelectedWeeks(arr);
  };

  // Tính điểm thi đua từng tuần được tích chọn cho từng học sinh
  const computedRows = useMemo(() => {
    const activeWeeks = sortedSelectedWeeks.length > 0 ? sortedSelectedWeeks : [currentWeek];

    const baseList = students.map((student, index) => {
      const weekScores: Record<number, number | null> = {};
      let validSum = 0;
      let validCount = 0;

      activeWeeks.forEach(w => {
        const summary = calculateStudentWeekSummary(
          student.maHS,
          student.hoTen,
          student.to,
          w,
          records,
          settings,
          currentWeek
        );
        if (summary.chuaCoDiem) {
          weekScores[w] = null;
        } else {
          weekScores[w] = summary.diemHienTai;
          validSum += summary.diemHienTai;
          validCount += 1;
        }
      });

      const finalEmulationScore =
        validCount > 0
          ? Math.round((validSum / validCount) * 10) / 10
          : settings.diemKhoiDau || 100;

      return {
        student,
        originalStt: index + 1,
        maHS: student.maHS,
        hoTen: student.hoTen,
        to: student.to,
        weekScores,
        finalEmulationScore,
      };
    });

    // Tính thứ hạng chuẩn
    const ranked = calculateDenseRankings(baseList, item => item.finalEmulationScore);
    const rankByMa = new Map<string, number>();
    ranked.forEach(r => rankByMa.set(r.maHS, r.officialRank));

    const enriched = baseList.map(row => ({
      ...row,
      rank: rankByMa.get(row.maHS) || 1,
    }));

    if (sortMode === 'ranking') {
      return [...enriched].sort((a, b) => {
        if (b.finalEmulationScore !== a.finalEmulationScore) {
          return b.finalEmulationScore - a.finalEmulationScore;
        }
        return a.originalStt - b.originalStt;
      });
    }

    return enriched;
  }, [students, records, settings, currentWeek, sortedSelectedWeeks, sortMode]);

  // Xuất file Excel (.xlsx)
  const handleExportSimpleEmulationExcel = () => {
    const activeWeeks = sortedSelectedWeeks.length > 0 ? sortedSelectedWeeks : [currentWeek];
    const isSingleWeek = activeWeeks.length === 1;

    // Nếu là học sinh không phải Ban cán sự: chỉ xuất điểm của chính mình
    const rowsToExport =
      isRestrictedToOwnExport && currentStudent
        ? computedRows.filter(
            r => r.maHS === currentStudent.maHS || r.hoTen === currentStudent.hoTen
          )
        : computedRows;

    const includeRank = sortMode === 'ranking' || (isRestrictedToOwnExport && !!currentStudent);

    const headers: string[] = includeRank
      ? isSingleWeek
        ? ['STT', 'Họ và tên học sinh', `Điểm thi đua (Tuần ${activeWeeks[0]})`, 'Xếp hạng']
        : [
            'STT',
            'Họ và tên học sinh',
            ...activeWeeks.map(w => `Tuần ${w}`),
            'Điểm thi đua (TB)',
            'Xếp hạng',
          ]
      : isSingleWeek
      ? ['STT', 'Họ và tên học sinh', `Điểm thi đua (Tuần ${activeWeeks[0]})`]
      : [
          'STT',
          'Họ và tên học sinh',
          ...activeWeeks.map(w => `Tuần ${w}`),
          'Điểm thi đua (TB)',
        ];

    const dataRows = rowsToExport.map((row, idx) => {
      const displayStt =
        isRestrictedToOwnExport && currentStudent
          ? row.originalStt
          : sortMode === 'order'
          ? row.originalStt
          : idx + 1;

      if (isSingleWeek) {
        const wScore = row.weekScores[activeWeeks[0]];
        const scoreCell = wScore !== null && wScore !== undefined ? wScore : row.finalEmulationScore;
        return includeRank
          ? [displayStt, row.hoTen, scoreCell, `Hạng ${row.rank}`]
          : [displayStt, row.hoTen, scoreCell];
      }

      const perWeekCells = activeWeeks.map(w =>
        row.weekScores[w] !== null && row.weekScores[w] !== undefined ? row.weekScores[w] : '-'
      );
      return includeRank
        ? [displayStt, row.hoTen, ...perWeekCells, row.finalEmulationScore, `Hạng ${row.rank}`]
        : [displayStt, row.hoTen, ...perWeekCells, row.finalEmulationScore];
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
    ws['!cols'] = [
      { wch: 7 },
      { wch: 28 },
      ...activeWeeks.map(() => ({ wch: 14 })),
      { wch: 18 },
      { wch: 12 },
    ];

    const weekLabel = isSingleWeek
      ? `Tuan_${activeWeeks[0]}`
      : `Tuan_${activeWeeks[0]}_den_${activeWeeks[activeWeeks.length - 1]}`;
    const modeLabel =
      isRestrictedToOwnExport && currentStudent
        ? `Ca_Nhan_${currentStudent.maHS}`
        : sortMode === 'ranking'
        ? 'Theo_Xep_Hang'
        : 'Theo_Thu_Tu';

    XLSX.utils.book_append_sheet(wb, ws, 'Diem_Thi_Dua_10A5');
    XLSX.writeFile(wb, `Diem_Thi_Dua_10A5_${weekLabel}_${modeLabel}.xlsx`);

    onShowToast?.(
      isRestrictedToOwnExport && currentStudent
        ? `Đã xuất điểm thi đua cá nhân (${currentStudent.hoTen})!`
        : `Đã xuất File Excel Điểm Thi Đua (${activeWeeks.length} tuần)!`
    );
  };

  const maxVisibleWeek = showAll35Weeks ? 35 : Math.max(18, currentWeek + 2);
  const weekNumbers = Array.from({ length: maxVisibleWeek }, (_, i) => i + 1);

  return (
    <div className="bg-surface rounded-2xl border border-emerald-500/30 shadow-xs overflow-hidden">
      {/* Header gọn gàng */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 px-3.5 py-2.5 text-white flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Eye className="w-4 h-4 text-amber-300 shrink-0" />
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-tight truncate">
            Điểm Thi Đua Theo Tuần
          </h3>
        </div>

        <button
          type="button"
          onClick={handleExportSimpleEmulationExcel}
          className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>
            {isRestrictedToOwnExport && currentStudent
              ? `Xuất điểm của tôi (${sortedSelectedWeeks.length} tuần)`
              : `Xuất Excel (${sortedSelectedWeeks.length} tuần)`}
          </span>
        </button>
      </div>

      {/* Controls: Week Checkboxes & Sort Mode */}
      <div className="p-3 space-y-2.5 bg-surface-2/60 border-b border-token">
        {/* Tích chọn tuần */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-main">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Chọn tuần ({sortedSelectedWeeks.length}):</span>
            </div>

            {/* Quick select buttons */}
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => setSelectedWeeks([currentWeek])}
                className="px-2 py-1 rounded-lg bg-surface hover:bg-emerald-50 text-emerald-700 border border-emerald-300 text-[11px] font-bold cursor-pointer"
              >
                Tuần {currentWeek}
              </button>
              <button
                type="button"
                onClick={() => selectRange(1, currentWeek)}
                className="px-2 py-1 rounded-lg bg-surface hover:bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold cursor-pointer"
              >
                T1 → T{currentWeek}
              </button>
              <button
                type="button"
                onClick={() => selectRange(1, 18)}
                className="px-2 py-1 rounded-lg bg-surface hover:bg-surface-3 text-main border border-token text-[11px] font-bold cursor-pointer"
              >
                HK 1
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAll35Weeks(true);
                  selectRange(19, 35);
                }}
                className="px-2 py-1 rounded-lg bg-surface hover:bg-surface-3 text-main border border-token text-[11px] font-bold cursor-pointer"
              >
                HK 2
              </button>
              <button
                type="button"
                onClick={() => setShowAll35Weeks(prev => !prev)}
                className="px-2 py-1 rounded-lg bg-surface-3 text-muted hover:text-main text-[11px] font-semibold cursor-pointer"
              >
                {showAll35Weeks ? 'Thu gọn' : '35 tuần'}
              </button>
            </div>
          </div>

          {/* Grid of week checkboxes */}
          <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-12 gap-1 pt-0.5">
            {weekNumbers.map(w => {
              const isChecked = selectedWeeks.includes(w);
              const isCurrent = w === currentWeek;
              return (
                <button
                  key={w}
                  type="button"
                  onClick={() => toggleWeek(w)}
                  className={`py-1 px-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-emerald-600 text-white border-emerald-600 font-black shadow-2xs'
                      : isCurrent
                      ? 'bg-amber-50 text-amber-900 border-amber-400 font-black'
                      : 'bg-surface text-main border-token hover:bg-surface-3'
                  }`}
                >
                  {isChecked ? (
                    <CheckSquare className="w-3 h-3 shrink-0" />
                  ) : (
                    <Square className="w-3 h-3 text-slate-400 shrink-0" />
                  )}
                  <span>T{w}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chế độ sắp xếp */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-token">
          <div className="flex items-center gap-1 text-xs font-bold text-main shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600" />
            <span>Sắp xếp:</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 sm:flex sm:items-center">
            <button
              type="button"
              onClick={() => setSortMode('order')}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                sortMode === 'order'
                  ? 'bg-indigo-600 text-white border-indigo-600 font-black shadow-2xs'
                  : 'bg-surface text-main border-token hover:bg-surface-3'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5 shrink-0" />
              <span>Theo thứ tự</span>
            </button>

            <button
              type="button"
              onClick={() => setSortMode('ranking')}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                sortMode === 'ranking'
                  ? 'bg-amber-500 text-slate-950 border-amber-500 font-black shadow-2xs'
                  : 'bg-surface text-main border-token hover:bg-surface-3'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 shrink-0" />
              <span>Theo xếp hạng</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bảng Xem Trực Tiếp (Chỉ STT, Họ và tên học sinh, và Điểm thi đua) */}
      <div className="overflow-x-auto max-h-[460px]">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 z-10 bg-slate-100 border-b border-token text-slate-700 font-black uppercase text-[11px]">
            <tr>
              <th className="py-2.5 px-3 w-14 text-center">STT</th>
              <th className="py-2.5 px-3 min-w-[180px]">Họ và tên học sinh</th>
              {sortedSelectedWeeks.map(w => (
                <th key={w} className="py-2.5 px-2.5 text-center whitespace-nowrap">
                  {sortedSelectedWeeks.length === 1 ? `Điểm thi đua (Tuần ${w})` : `Tuần ${w}`}
                </th>
              ))}
              {sortedSelectedWeeks.length > 1 && (
                <th className="py-2.5 px-3 text-center whitespace-nowrap bg-emerald-50 text-emerald-900">
                  Điểm thi đua (TB)
                </th>
              )}
              {sortMode === 'ranking' && (
                <th className="py-2.5 px-3 text-center whitespace-nowrap bg-amber-50 text-amber-900">
                  Xếp hạng
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-token">
            {computedRows.map((row, idx) => {
              const displayStt = sortMode === 'order' ? row.originalStt : idx + 1;
              return (
                <tr key={row.maHS} className="hover:bg-emerald-50/30 transition-colors">
                  <td className="py-2 px-3 text-center font-mono font-bold text-muted">
                    {displayStt}
                  </td>
                  <td className="py-2 px-3 font-bold text-main">
                    {row.hoTen}
                  </td>
                  {sortedSelectedWeeks.map(w => {
                    const val = row.weekScores[w];
                    return (
                      <td
                        key={w}
                        className={`py-2 px-2.5 text-center font-mono font-black ${
                          val === null
                            ? 'text-slate-400 font-normal'
                            : val >= 100
                            ? 'text-emerald-600'
                            : val < 80
                            ? 'text-rose-600'
                            : 'text-slate-800'
                        }`}
                      >
                        {val !== null && val !== undefined ? val : '-'}
                      </td>
                    );
                  })}
                  {sortedSelectedWeeks.length > 1 && (
                    <td className="py-2 px-3 text-center font-mono font-black text-emerald-700 bg-emerald-50/40">
                      {row.finalEmulationScore}
                    </td>
                  )}
                  {sortMode === 'ranking' && (
                    <td className="py-2 px-3 text-center bg-amber-50/40">
                      <span
                        className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-black ${
                          row.rank === 1
                            ? 'bg-amber-400 text-slate-950'
                            : row.rank <= 3
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        Hạng {row.rank}
                      </span>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
