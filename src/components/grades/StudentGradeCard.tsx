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

  const { subjects, diemTBChung, hocLuc, danhHieu, nhanXetGVCN } = academicRecord;

  // Compute statistics
  const scoredSubjects = DEFAULT_SUBJECTS.filter(s => s.type === 'score');
  const validScores = scoredSubjects
    .map(s => subjects[s.id]?.tb)
    .filter((v): v is number => typeof v === 'number');

  const highestScore = validScores.length > 0 ? Math.max(...validScores) : null;
  const lowestScore = validScores.length > 0 ? Math.min(...validScores) : null;
  const excellentSubjectsCount = validScores.filter(v => v >= 8.0).length;

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Top Banner: Academic Summary Card */}
      <div className="w-full bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden border border-indigo-800/40">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none -ml-12 -mb-12" />

        <div className="relative z-10 flex flex-col gap-4">
          {/* Header row: Semester info & Read-only badge */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
                <GraduationCap className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-2">
                  <span>KẾT QUẢ HỌC TẬP THEO MÔN</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase tracking-wider">
                    Chính thức
                  </span>
                </h2>
                <p className="text-[11px] text-white/70">
                  Lớp 10A5 · Năm học 2026-2027 · THPT Số 2 Đức Phổ
                </p>
              </div>
            </div>

            {/* Semester selector */}
            <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setSelectedSemester(1)}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedSemester === 1 
                    ? 'bg-white text-indigo-950 shadow-xs' 
                    : 'text-white/80 hover:text-white'
                }`}
              >
                Học kỳ 1
              </button>
              <button
                type="button"
                onClick={() => setSelectedSemester(2)}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedSemester === 2 
                    ? 'bg-white text-indigo-950 shadow-xs' 
                    : 'text-white/80 hover:text-white'
                }`}
              >
                Học kỳ 2
              </button>
            </div>
          </div>

          {/* Core Score Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* GPA */}
            <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">
                Điểm TB Chung
              </span>
              <div className="flex items-baseline gap-1.5 my-1">
                <span className="text-2xl sm:text-3xl font-black text-amber-300">
                  {diemTBChung !== null ? diemTBChung.toFixed(1) : '--'}
                </span>
                <span className="text-xs text-white/60">/ 10</span>
              </div>
              <span className="text-[10px] text-white/60">
                12 môn tính điểm
              </span>
            </div>

            {/* Academic Standing */}
            <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">
                Học Lực
              </span>
              <div className="my-1">
                <span className={`inline-block px-2.5 py-1 rounded-lg font-black text-xs sm:text-sm ${
                  hocLuc === 'Xuất sắc' 
                    ? 'bg-purple-500/30 text-purple-200 border border-purple-400/40' 
                    : hocLuc === 'Giỏi'
                      ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40'
                      : hocLuc === 'Khá'
                        ? 'bg-blue-500/30 text-blue-200 border border-blue-400/40'
                        : 'bg-amber-500/30 text-amber-200 border border-amber-400/40'
                }`}>
                  {hocLuc || 'Đang cập nhật'}
                </span>
              </div>
              <span className="text-[10px] text-white/60">
                Theo TT 22/2021/BGDĐT
              </span>
            </div>

            {/* Honors Title */}
            <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">
                Danh Hiệu
              </span>
              <div className="my-1 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-300 shrink-0" />
                <span className="font-extrabold text-xs sm:text-sm text-white truncate">
                  {danhHieu || 'Chưa xét'}
                </span>
              </div>
              <span className="text-[10px] text-white/60">
                Thi đua học kỳ 1
              </span>
            </div>

            {/* High Performance Subjects */}
            <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">
                Môn Điểm Giỏi
              </span>
              <div className="flex items-baseline gap-1.5 my-1">
                <span className="text-2xl sm:text-3xl font-black text-emerald-300">
                  {excellentSubjectsCount}
                </span>
                <span className="text-xs text-white/60">/ 12 môn</span>
              </div>
              <span className="text-[10px] text-white/60">
                Điểm TB môn ≥ 8.0
              </span>
            </div>
          </div>

          {/* Teacher's Note */}
          {nhanXetGVCN && (
            <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs text-white/90 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong className="text-amber-200">Nhận xét của Giáo viên chủ nhiệm: </strong>
                <span>{nhanXetGVCN}</span>
              </div>
            </div>
          )}
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
                <th className="py-2.5 px-2 text-center">Cuối kỳ (x3)</th>
                <th className="py-2.5 px-2 text-center font-extrabold text-main">ĐTB môn</th>
                <th className="py-2.5 px-3 text-center rounded-r-lg">Đánh giá / Ghi chú</th>
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
                      <td colSpan={3} className="py-3 px-2 text-center text-muted italic text-[11px]">
                        Môn đánh giá bằng nhận xét
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded font-black text-xs ${
                          evalResult === 'Đ' 
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' 
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                        }`}>
                          {evalResult === 'Đ' ? 'ĐẠT' : 'CHƯA ĐẠT'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-[11px] text-muted">
                        {score?.note || 'Hoàn thành tốt nhiệm vụ'}
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
                const tbFormatted = score?.tb !== null && score?.tb !== undefined ? Number(score.tb).toFixed(1) : '--';

                const isGood = typeof score?.tb === 'number' && score.tb >= 8.0;
                const isMedium = typeof score?.tb === 'number' && score.tb >= 6.5 && score.tb < 8.0;
                const isLow = typeof score?.tb === 'number' && score.tb < 5.0;

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
                    <td className="py-3 px-2 text-center font-mono font-medium text-main">
                      {gkFormatted}
                    </td>

                    {/* CK */}
                    <td className="py-3 px-2 text-center font-mono font-medium text-main">
                      {ckFormatted}
                    </td>

                    {/* ĐTB */}
                    <td className="py-3 px-2 text-center">
                      <span className={`inline-block font-mono font-black text-sm px-2 py-0.5 rounded-lg ${
                        isGood 
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' 
                          : isMedium
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                            : isLow
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                              : 'bg-surface-2 text-main'
                      }`}>
                        {tbFormatted}
                      </span>
                    </td>

                    {/* Nhận xét / Ghi chú */}
                    <td className="py-3 px-3 text-center text-[11px] text-muted">
                      {score?.note ? (
                        <span className="italic truncate max-w-[200px] block mx-auto">
                          {score.note}
                        </span>
                      ) : isGood ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Tốt</span>
                      ) : isMedium ? (
                        <span className="text-blue-600 dark:text-blue-400 font-semibold">Khá</span>
                      ) : (
                        <span className="text-muted">Đạt</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend & Guide */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-token/60 text-[11px] text-muted">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>ĐTB ≥ 8.0: Giỏi</span>
            </span>
            <span className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>6.5 ≤ ĐTB &lt; 8.0: Khá</span>
            </span>
            <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>5.0 ≤ ĐTB &lt; 6.5: Đạt</span>
            </span>
          </div>

          <span className="text-[10px] text-muted italic">
            Công thức tính: ĐTB = (Tổng điểm TX + GK×2 + CK×3) / (Số cột TX + 5)
          </span>
        </div>
      </div>
    </div>
  );
};
