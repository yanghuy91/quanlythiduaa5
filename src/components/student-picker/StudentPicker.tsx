import React, { useState, useMemo } from 'react';
import { 
  Search, 
  LayoutGrid, 
  ListFilter, 
  User, 
  Check, 
  X,
  Users,
  Eye
} from 'lucide-react';
import { Student, SeatLayoutNode, StudentWeekSummary, RoleCode } from '../../types';
import { searchStudents, sortVietnameseNames, getStudentAvatarInitial } from '../../utils/vietnamese';
import { SeatGrid } from './SeatGrid';
import { ROLE_CONFIG } from '../../data/mockData';

interface StudentPickerProps {
  students: Student[];
  layout: SeatLayoutNode[];
  studentSummaries?: Record<string, StudentWeekSummary>;
  selectedStudentIds: string[];
  onSelectStudent: (student: Student) => void;
  viewerRole?: RoleCode;
  viewerTo?: number;
  showStatusColors?: boolean;
  isMultiSelect?: boolean;
  initialDisplayMode?: 'compact' | 'avatar_badge';
  onToggleMultiSelect?: () => void;
  onInspectStudent?: (student: Student) => void;
}

export const StudentPicker: React.FC<StudentPickerProps> = ({
  students,
  layout,
  studentSummaries = {},
  selectedStudentIds,
  onSelectStudent,
  viewerRole,
  viewerTo,
  showStatusColors = true,
  isMultiSelect = false,
  initialDisplayMode = 'avatar_badge',
  onToggleMultiSelect,
  onInspectStudent,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTo, setFilterTo] = useState<number | 'all'>('all');

  // Filter students if viewer is Tổ trưởng (hard scope filtering)
  const visibleStudents = useMemo(() => {
    let list = students;
    if (viewerRole === 'TT' && viewerTo !== undefined) {
      list = list.filter(s => s.to === viewerTo);
    } else if (filterTo !== 'all') {
      list = list.filter(s => s.to === filterTo);
    }
    return searchStudents(list, searchQuery);
  }, [students, viewerRole, viewerTo, filterTo, searchQuery]);

  const sortedList = useMemo(() => {
    return sortVietnameseNames(visibleStudents);
  }, [visibleStudents]);

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Top Controls: Mode Switcher & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        {/* Toggle Grid vs List */}
        <div className="flex items-center p-1 bg-surface-2 rounded-lg border border-token self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              viewMode === 'grid' 
                ? 'bg-surface text-main shadow-xs' 
                : 'text-muted hover:text-main'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-accent" />
            <span>Sơ đồ lớp</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              viewMode === 'list' 
                ? 'bg-surface text-main shadow-xs' 
                : 'text-muted hover:text-main'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5 text-accent" />
            <span>Danh sách ({visibleStudents.length})</span>
          </button>
        </div>

        {/* Multi-Select Toggle Button if supported */}
        {onToggleMultiSelect && (
          <button
            type="button"
            onClick={onToggleMultiSelect}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors self-end sm:self-auto cursor-pointer ${
              isMultiSelect 
                ? 'bg-accent text-on-accent border-accent' 
                : 'bg-surface border-token text-main hover:bg-surface-2'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{isMultiSelect ? `Đang chọn (${selectedStudentIds.length})` : 'Chọn nhiều'}</span>
          </button>
        )}
      </div>

      {/* Search & Tổ Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm tên, chữ cái đầu (vd: huy, nkh)..."
            className="w-full pl-9 pr-8 py-2 bg-surface border border-token rounded-lg text-xs text-main placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-main p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Group Filter Chips (Hidden if Tổ trưởng) */}
        {!(viewerRole === 'TT' && viewerTo !== undefined) && (
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              onClick={() => setFilterTo('all')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filterTo === 'all' 
                  ? 'bg-primary text-on-primary font-bold' 
                  : 'bg-surface border border-token text-muted hover:text-main'
              }`}
            >
              Tất cả
            </button>
            {[1, 2, 3, 4].map(toNum => (
              <button
                key={toNum}
                type="button"
                onClick={() => setFilterTo(toNum)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  filterTo === toNum 
                    ? 'bg-primary text-on-primary font-bold' 
                    : 'bg-surface border border-token text-muted hover:text-main'
                }`}
              >
                Tổ {toNum}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main View Area */}
      {viewMode === 'grid' ? (
        <div className="bg-surface p-3 rounded-xl border border-token">
          <SeatGrid
            layout={layout}
            students={students}
            studentSummaries={studentSummaries}
            selectedStudentIds={selectedStudentIds}
            onSelectStudent={onSelectStudent}
            viewerRole={viewerRole}
            viewerTo={viewerTo}
            showStatusColors={showStatusColors}
            isMultiSelect={isMultiSelect}
            initialDisplayMode={initialDisplayMode}
            onInspectStudent={onInspectStudent}
          />
        </div>
      ) : (
        /* List Mode */
        <div className="bg-surface rounded-xl border border-token divide-y divide-token max-h-[500px] overflow-y-auto">
          {sortedList.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted">
              Không tìm thấy học sinh nào phù hợp.
            </div>
          ) : (
            sortedList.map(student => {
              const isSelected = selectedStudentIds.includes(student.maHS);
              const summary = studentSummaries[student.maHS];
              const topRole = student.vaiTro[0] || 'HS';
              const roleConfig = ROLE_CONFIG[topRole];

              return (
                <button
                  key={student.maHS}
                  type="button"
                  onClick={() => onSelectStudent(student)}
                  className={`w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-surface-2 transition-colors cursor-pointer ${
                    isSelected ? 'bg-surface-2 ring-1 ring-accent' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Multi-select box or Seat Number with Avatar Thumbnail */}
                    {isMultiSelect ? (
                      <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                        isSelected 
                          ? 'bg-accent border-accent text-on-accent' 
                          : 'border-token bg-surface'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    ) : (
                      <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-token/70 shrink-0 bg-surface-2 shadow-2xs">
                        {student.avatarUrl ? (
                          <img 
                            src={student.avatarUrl} 
                            alt={student.hoTen} 
                            className="w-full h-full object-cover" 
                            loading="lazy" 
                          />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center font-bold text-xs ${
                            student.gioiTinh === 'Nu' ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'
                          }`}>
                            {getStudentAvatarInitial(student.hoTen)}
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 px-1 text-[8px] font-black bg-black/75 text-white rounded-tl-sm leading-tight">
                          #{student.viTriGhe}
                        </span>
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-main truncate">
                          {student.hoTen}
                        </span>
                        {topRole !== 'HS' && (
                          <span 
                            className="text-[9px] font-bold px-1.5 py-0.2 rounded"
                            style={{ color: roleConfig.fg, backgroundColor: roleConfig.bg }}
                          >
                            {topRole === 'TT' && student.toTruongTo ? `Tổ trưởng T${student.toTruongTo}` : roleConfig.label}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted flex items-center gap-2 mt-0.5">
                        <span>Tổ {student.to}</span>
                        <span>·</span>
                        <span>Dãy {student.dayBan} - Bàn {student.soBan}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right side: Points or Status badge (only after login) */}
                  {showStatusColors && summary && (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        summary.mucMau === 'bad' 
                          ? 'bg-[var(--st-bad)]/15 text-[var(--st-bad)]' 
                          : summary.mucMau === 'warn'
                          ? 'bg-[var(--st-warn)]/15 text-[var(--st-warn)]'
                          : summary.mucMau === 'ok'
                          ? 'bg-[var(--st-ok)]/15 text-[var(--st-ok)]'
                          : 'bg-surface-2 text-muted'
                      }`}>
                        {summary.diemHienTai} đ
                      </span>

                      {onInspectStudent && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            onInspectStudent(student);
                          }}
                          className="p-1 rounded-md bg-surface-2 hover:bg-surface-3 text-muted hover:text-main border border-token cursor-pointer transition-colors"
                          title="Xem chi tiết vi phạm & người ghi"
                        >
                          <Eye className="w-3.5 h-3.5 text-accent" />
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
