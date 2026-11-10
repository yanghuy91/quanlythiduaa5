import React, { useState, useMemo } from 'react';
import { 
  Search, 
  LayoutGrid, 
  ListFilter, 
  User, 
  Check, 
  X,
  Users,
  Eye,
  Zap
} from 'lucide-react';
import { Student, SeatLayoutNode, StudentWeekSummary, RoleCode } from '../../types';
import { searchStudents, sortVietnameseNames, getStudentAvatarInitial } from '../../utils/vietnamese';
import { SeatGrid } from './SeatGrid';
import { ROLE_CONFIG } from '../../data/mockData';
import { resolveStudentAvatar } from '../../data/avatarPresets';

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
  fastSaveEnabled?: boolean;
  onToggleFastSave?: () => void;
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
  fastSaveEnabled = false,
  onToggleFastSave,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter students if viewer is Tổ trưởng (hard scope filtering)
  const visibleStudents = useMemo(() => {
    let list = students;
    if (viewerRole === 'TT' && viewerTo !== undefined) {
      list = list.filter(s => s.to === viewerTo);
    }
    return searchStudents(list, searchQuery);
  }, [students, viewerRole, viewerTo, searchQuery]);

  const sortedList = useMemo(() => {
    return sortVietnameseNames(visibleStudents);
  }, [visibleStudents]);

  return (
    <div className="w-full flex flex-col gap-2.5">
      {/* Top Controls: Mode Switcher & Neat Action Buttons */}
      <div className="flex items-center justify-between gap-2">
        {/* Toggle Grid vs List */}
        <div className="flex items-center p-0.5 bg-surface-2 rounded-xl border border-token">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'grid' 
                ? 'bg-surface text-main shadow-xs font-bold' 
                : 'text-muted hover:text-main'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-accent" />
            <span>Sơ đồ</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'list' 
                ? 'bg-surface text-main shadow-xs font-bold' 
                : 'text-muted hover:text-main'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5 text-accent" />
            <span>DS ({visibleStudents.length})</span>
          </button>
        </div>

        {/* Neat Action Buttons: Fast Save & Multi-Select */}
        <div className="flex items-center gap-1.5">
          {onToggleFastSave && (
            <button
              type="button"
              onClick={onToggleFastSave}
              title={fastSaveEnabled ? 'Đang BẬT lưu nhanh 1 chạm (bấm học sinh để ghi nhận ngay)' : 'Bật lưu nhanh 1 chạm'}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                fastSaveEnabled
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-300 dark:ring-amber-900'
                  : 'bg-surface border-token text-muted hover:text-main hover:bg-surface-2'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${fastSaveEnabled ? 'fill-current text-white' : 'text-amber-500'}`} />
              <span>1 chạm</span>
            </button>
          )}

          {onToggleMultiSelect && (
            <button
              type="button"
              onClick={onToggleMultiSelect}
              title={isMultiSelect ? 'Tắt chọn nhiều' : 'Bật chọn nhiều học sinh cùng lúc'}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                isMultiSelect 
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs ring-2 ring-indigo-300 dark:ring-indigo-900' 
                  : 'bg-surface border-token text-muted hover:text-main hover:bg-surface-2'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{isMultiSelect ? `Chọn (${selectedStudentIds.length})` : 'Chọn nhiều'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Clean Full-width Search Input */}
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Tìm tên hoặc chữ cái đầu (vd: huy, nkh)..."
          className="w-full pl-9 pr-8 py-2 bg-surface border border-token rounded-xl text-xs text-main placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 shadow-2xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-main p-0.5"
            aria-label="Xóa tìm kiếm"
          >
            <X className="w-3.5 h-3.5" />
          </button>
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
                    ) : !showStatusColors ? (
                      <div className="w-8 h-8 rounded-xl border border-token/70 shrink-0 bg-surface-2 flex items-center justify-center font-bold text-xs text-muted shadow-2xs">
                        #{student.viTriGhe}
                      </div>
                    ) : (
                      <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-token/70 shrink-0 bg-surface-2 shadow-2xs">
                        {student.avatarUrl ? (
                          <img 
                            src={resolveStudentAvatar(student.avatarUrl)} 
                            alt={student.hoTen} 
                            className="w-full h-full object-cover" 
                            loading="lazy" 
                          />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center font-bold text-[10px] sm:text-xs px-0.5 text-center leading-tight truncate ${
                            student.gioiTinh === 'Nu' ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'
                          }`}>
                            {student.tenRutGon || student.hoTen.split(' ').slice(-1)[0]}
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
                        <span className="font-semibold text-token">Tổ {student.to}</span>
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
