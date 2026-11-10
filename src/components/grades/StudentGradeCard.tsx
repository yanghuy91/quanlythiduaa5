import React, { useState } from 'react';
import { 
  GraduationCap, 
  Lock, 
  Award, 
  BookOpen, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  BarChart3,
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';
import { Student, StudentAcademicRecord, TeacherSettings } from '../../types';
import { DEFAULT_SUBJECTS } from '../../data/academicCatalog';

interface StudentGradeCardProps {
  currentStudent: Student;
  academicRecord?: StudentAcademicRecord;
  settings: TeacherSettings;
  allAcademicRecords?: StudentAcademicRecord[];
}

export const StudentGradeCard: React.FC<StudentGradeCardProps> = ({
  currentStudent,
  academicRecord,
  settings,
  allAcademicRecords = [],
}) => {
  const [selectedSemester, setSelectedSemester] = useState<1 | 2>(1);
  const [viewDetailSubjectId, setViewDetailSubjectId] = useState<string | null>(null);

  const isGradeViewAllowed = settings.choPhepXemDiemMon;

  // If teacher has turned off student grade viewing
  if (!isGradeViewAllowed) {
    return (
      <div className="w-full bg-surface rounded-2xl border border-token p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4 ring-8 ring-amber-500/5">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-base sm:text-lg font-black text-main mb-2">
          Bảng điểm môn học đang tạm ẩn
        </h3>
        <p className="text-xs sm:text-sm text-muted max-w-md mb-5 leading-relaxed">
          Thầy/Cô Giáo viên chủ nhiệm đang trong quá trình cập nhật hoặc khóa bảng điểm môn học lớp 10A5. Bảng điểm sẽ tự động mở khi Thầy/Cô hoàn tất công bố.
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-2 border border-token text-xs text-muted font-medium">
          <Info className="w-3.5 h-3.5 text-accent" />
          <span>Vui lòng liên hệ Giáo viên chủ nhiệm hoặc cán sự học tập nếu cần giải đáp</span>
        </div>
      </div>
    );
  }

  // If allowed, but student record not found yet
  if (!academicRecord) {
    return (
      <div className="w-full bg-surface rounded-2xl border border-token p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h3 className="text-base sm:text-lg font-black text-main mb-2">
          Chưa có dữ liệu bảng điểm của em
        </h3>
        <p className="text-xs sm:text-sm text-muted max-w-md">
          Dữ liệu điểm môn học của em ({currentStudent.hoTen} - {currentStudent.maHS}) đang được cập nhật từ sổ điểm điện tử của lớp.
        </p>
      </div>
    );
  }

  const { subjects } = academicRecord;

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Top Header: Academic Grades Only */}
      <div className="w-full bg-surface rounded-2xl p-4 sm:p-5 border border-token shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-main uppercase tracking-tight">
              Bảng Điểm Các Môn Học
            </h2>
            <p className="text-[11px] text-muted">
              Lớp 10A5 · THPT Số 2 Đức Phổ · Điểm thành phần các môn
            </p>
          </div>
        </div>

        {/* Semester selector */}
        <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-xl text-xs font-bold border border-token">
          <button
            type="button"
            onClick={() => setSelectedSemester(1)}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              selectedSemester === 1 
                ? 'bg-surface text-main shadow-xs ring-1 ring-token font-black' 
                : 'text-muted hover:text-main'
            }`}
          >
            Học kỳ 1
          </button>
          <button
            type="button"
            onClick={() => setSelectedSemester(2)}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              selectedSemester === 2 
                ? 'bg-surface text-main shadow-xs ring-1 ring-token font-black' 
                : 'text-muted hover:text-main'
            }`}
          >
            Học kỳ 2
          </button>
        </div>
      </div>

      {/* Main Grade Table Card (Read-only) */}
      <div className="w-full bg-surface rounded-2xl border border-token p-4 sm:p-5 shadow-xs flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-token/60 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-accent" />
            <h3 className="text-xs sm:text-sm font-black text-main uppercase tracking-wider">
              Chi tiết điểm các môn học (Học kỳ {selectedSemester})
            </h3>
          </div>
          <span className="text-[11px] text-muted font-medium">
            Học sinh chỉ có quyền xem, không chỉnh sửa
          </span>
        </div>

        {/* Responsive Table */}
        <div className="w-full overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-token text-[11px] font-bold text-muted uppercase tracking-wider bg-surface-2/50">
                <th className="py-2.5 px-3 rounded-l-lg">Môn học</th>
                <th className="py-2.5 px-2 text-center">ĐĐG thường xuyên</th>
                <th className="py-2.5 px-2 text-center">Giữa kỳ (x2)</th>
                <th className="py-2.5 px-3 text-center rounded-r-lg">Cuối kỳ (x3)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-token/60">
              {DEFAULT_SUBJECTS.map((subj) => {
                const score = subjects[subj.id];
                const isSelected = viewDetailSubjectId === subj.id;

                if (subj.type === 'evaluate') {
                  const evalResult = score?.evaluateResult ?? 'Đ';
                  return (
                    <tr 
                      key={subj.id}
                      className="hover:bg-surface-2/40 transition-colors"
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2 font-bold text-main">
                          <span className="text-base select-none">{subj.icon}</span>
                          <span>{subj.name}</span>
                        </div>
                      </td>
                      <td colSpan={3} className="py-3 px-2 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded font-black text-xs ${
                          evalResult === 'Đ' 
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' 
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                        }`}>
                          {evalResult === 'Đ' ? 'ĐẠT' : 'CHƯA ĐẠT'}
                        </span>
                      </td>
                    </tr>
                  );
                }

                // Scored subject
                const txFormatted = score?.tx && score.tx.length > 0 
                  ? score.tx.filter(v => v !== null).map(v => Number(v).toFixed(1)).join(' · ') 
                  : '--';
                const gkFormatted = score?.gk !== null && score?.gk !== undefined ? Number(score.gk).toFixed(1) : '--';
                const ckFormatted = score?.ck !== null && score?.ck !== undefined ? Number(score.ck).toFixed(1) : '--';

                return (
                  <tr 
                    key={subj.id}
                    onClick={() => setViewDetailSubjectId(isSelected ? null : subj.id)}
                    className={`hover:bg-surface-2/60 transition-colors cursor-pointer ${
                      isSelected ? 'bg-surface-2/80' : ''
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base select-none">{subj.icon}</span>
                        <div>
                          <span className="font-bold text-main block">{subj.name}</span>
                          <span className="text-[10px] text-muted">{subj.category === 'core' ? 'Môn bắt buộc' : subj.category === 'science' ? 'KHTN' : 'KHXH'}</span>
                        </div>
                      </div>
                    </td>

                    {/* TX */}
                    <td className="py-3 px-2 text-center font-mono font-medium text-main">
                      {txFormatted}
                    </td>

                    {/* GK */}
                    <td className="py-3 px-2 text-center font-mono font-semibold text-main">
                      {gkFormatted}
                    </td>

                    {/* CK */}
                    <td className="py-3 px-3 text-center font-mono font-bold text-main">
                      {ckFormatted}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
