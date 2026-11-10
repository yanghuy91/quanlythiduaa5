import React, { useState, useRef, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  Eye, 
  EyeOff, 
  RotateCcw, 
  Search, 
  Filter, 
  Check, 
  X, 
  AlertCircle, 
  Sparkles, 
  ChevronRight, 
  GraduationCap, 
  Award, 
  HelpCircle,
  FileCheck,
  Edit3
} from 'lucide-react';
import { Student, StudentAcademicRecord, TeacherSettings, SubjectScore } from '../../types';
import { 
  DEFAULT_SUBJECTS, 
  exportGradeTemplate, 
  exportClassGrades, 
  importGradesFromExcel, 
  saveAcademicRecords,
  calculateSubjectAverage,
  calculateOverallGPA,
  evaluateAcademicStanding
} from '../../data/academicCatalog';
import { reconcileAcademicRecordsWithSeating } from '../../utils/seatingMaster';

interface TeacherGradeManagerProps {
  students: Student[];
  records: StudentAcademicRecord[];
  onUpdateRecords: (records: StudentAcademicRecord[]) => void;
  settings: TeacherSettings;
  onUpdateSettings: (newSettings: Partial<TeacherSettings>) => void;
  onShowToast: (msg: string, sub?: string) => void;
}

export const TeacherGradeManager: React.FC<TeacherGradeManagerProps> = ({
  students,
  records,
  onUpdateRecords,
  settings,
  onUpdateSettings,
  onShowToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTo, setSelectedTo] = useState<number | 'all'>('all');
  const [selectedHocKi, setSelectedHocKi] = useState<1 | 2>(1);

  // Modals
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<StudentAcademicRecord | null>(null);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);

  // Toggle switch for student viewing
  const handleToggleStudentView = () => {
    const nextState = !settings.choPhepXemDiemMon;
    onUpdateSettings({ choPhepXemDiemMon: nextState });
    onShowToast(
      nextState 
        ? 'Đã BẬT chế độ xem điểm cho học sinh 🟢' 
        : 'Đã KHÓA / TẠM ẨN bảng điểm với học sinh 🔒',
      nextState 
        ? 'Học sinh lớp 10A5 hiện đã có thể xem bảng điểm học tập của mình.' 
        : 'Học sinh sẽ nhận được thông báo bảng điểm đang trong quá trình cập nhật.'
    );
  };

  // Quy chiếu toàn bộ danh sách điểm từ Sơ đồ lớp (`students`) làm chuẩn
  const canonicalAllRecords = useMemo(() => {
    return reconcileAcademicRecordsWithSeating(students, records, selectedHocKi);
  }, [students, records, selectedHocKi]);

  const semesterRecords = useMemo(() => {
    return canonicalAllRecords.filter(r => (r.hocKi || 1) === selectedHocKi);
  }, [canonicalAllRecords, selectedHocKi]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return semesterRecords.filter(r => {
      if (selectedTo !== 'all' && r.to !== selectedTo) return false;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = r.hoTen.toLowerCase().includes(query);
        const matchMa = r.maHS.toLowerCase().includes(query);
        if (!matchName && !matchMa) return false;
      }
      return true;
    });
  }, [semesterRecords, selectedTo, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const validGpas = semesterRecords
      .map(r => r.diemTBChung)
      .filter((v): v is number => typeof v === 'number');

    const avgClassGpa = validGpas.length > 0 
      ? Math.round((validGpas.reduce((a, b) => a + b, 0) / validGpas.length) * 10) / 10 
      : null;

    const countXuatSac = semesterRecords.filter(r => r.hocLuc === 'Xuất sắc').length;
    const countGioi = semesterRecords.filter(r => r.hocLuc === 'Giỏi').length;
    const countKha = semesterRecords.filter(r => r.hocLuc === 'Khá').length;
    const countDat = semesterRecords.filter(r => r.hocLuc === 'Đạt').length;
    const countHasGrades = semesterRecords.filter(r => r.diemTBChung !== null || Object.keys(r.subjects || {}).length > 0).length;

    return {
      total: students.length,
      countHasGrades,
      avgClassGpa,
      countXuatSac,
      countGioi,
      countKha,
      countDat,
    };
  }, [semesterRecords, students.length]);

  // Handle Excel File Drop / Selection (Quy chiếu vào Sơ đồ lớp làm chuẩn)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccessMsg(null);

    try {
      const res = await importGradesFromExcel(file, canonicalAllRecords, selectedHocKi, students);
      if (res.success) {
        onUpdateRecords(res.importedRecords);
        setUploadSuccessMsg(`Đã quy chiếu và nhập điểm thành công cho ${res.recordsCount} học sinh theo chuẩn Sơ đồ lớp từ file "${file.name}"!`);
        onShowToast(
          `Đã nhập điểm & quy chiếu theo Sơ đồ lớp ✨`,
          `Cập nhật dữ liệu điểm môn học cho ${res.recordsCount}/${students.length} học sinh trên Sơ đồ lớp.`
        );
      } else {
        setUploadError(res.errors.join('; ') || 'Không thể nhập dữ liệu từ file này.');
      }
    } catch (err: any) {
      setUploadError(err?.message || 'Đã xảy ra lỗi khi đọc file Excel.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Reset to default sample grades
  const handleResetSampleGrades = () => {
    if (window.confirm(`Xóa trắng dữ liệu điểm đang nhập để nhập lại từ đầu theo Sơ đồ lớp (${students.length} học sinh)?`)) {
      const reset = reconcileAcademicRecordsWithSeating(students, [], selectedHocKi);
      onUpdateRecords(reset);
      onShowToast('Đã làm mới bảng điểm theo Sơ đồ lớp', `Bảng điểm đã được đồng bộ chuẩn với ${students.length} học sinh trên Sơ đồ lớp.`);
    }
  };

  // Save changes to single student from detail modal
  const handleSaveStudentDetail = (updatedStudent: StudentAcademicRecord) => {
    const updated = canonicalAllRecords.map(r =>
      r.maHS === updatedStudent.maHS && (r.hocKi || 1) === (updatedStudent.hocKi || selectedHocKi)
        ? updatedStudent
        : r
    );
    onUpdateRecords(updated);
    saveAcademicRecords(updated);
    setSelectedStudentForDetail(null);
    onShowToast(`Đã lưu bảng điểm của ${updatedStudent.hoTen}`, 'Dữ liệu điểm thành phần đã được cập nhật và quy chiếu theo Sơ đồ lớp.');
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Top Controls Banner: Permission Switch & Action Buttons */}
      <div className="w-full bg-surface rounded-2xl border border-token p-4 sm:p-5 shadow-xs flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-main flex items-center gap-2">
                <span>QUẢN LÝ BẢNG ĐIỂM MÔN HỌC</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-surface-2 border border-token text-muted">
                  Lớp 10A5
                </span>
              </h2>
              <p className="text-xs text-muted">
                Nhập dữ liệu từ Excel (vnEdu/SMAS), quản lý điểm thành phần và công bố điểm cho học sinh
              </p>
            </div>
          </div>

          {/* Student View Toggle Switch */}
          <div className="flex items-center gap-3 bg-surface-2/80 px-3.5 py-2 rounded-xl border border-token">
            <div className="flex flex-col text-right">
              <span className="text-xs font-bold text-main">
                Cho phép học sinh xem điểm
              </span>
              <span className={`text-[10px] font-semibold flex items-center gap-1 justify-end ${
                settings.choPhepXemDiemMon 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : 'text-amber-600 dark:text-amber-400'
              }`}>
                {settings.choPhepXemDiemMon ? (
                  <>
                    <Eye className="w-3 h-3" />
                    <span>🟢 Đang công bố</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3 h-3" />
                    <span>🔒 Đang tạm ẩn</span>
                  </>
                )}
              </span>
            </div>

            <button
              type="button"
              onClick={handleToggleStudentView}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                settings.choPhepXemDiemMon ? 'bg-emerald-500' : 'bg-surface-3'
              }`}
              title={settings.choPhepXemDiemMon ? 'Nhấn để ẩn bảng điểm với học sinh' : 'Nhấn để công bố bảng điểm cho học sinh xem'}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  settings.choPhepXemDiemMon ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-token/60">
          <div className="flex flex-wrap items-center gap-2">
            {/* Import from Excel */}
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent text-on-accent text-xs font-bold hover:brightness-110 shadow-xs cursor-pointer transition-all"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Nhập từ Excel (.xlsx)</span>
            </button>

            {/* Download Template */}
            <button
              type="button"
              onClick={() => exportGradeTemplate(students)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-2 border border-token text-main text-xs font-bold hover:bg-surface-3 cursor-pointer transition-all"
              title="Tải file mẫu Excel chuẩn theo danh sách Sơ đồ lớp hiện tại"
            >
              <Download className="w-3.5 h-3.5 text-accent" />
              <span>Tải file mẫu (Theo Sơ đồ lớp)</span>
            </button>

            {/* Export Current Class Grades */}
            <button
              type="button"
              onClick={() => exportClassGrades(semesterRecords, selectedHocKi)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-2 border border-token text-main text-xs font-bold hover:bg-surface-3 cursor-pointer transition-all"
              title="Xuất bảng điểm lớp hiện tại ra file Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              <span>Xuất Excel</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetSampleGrades}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-muted text-xs font-semibold hover:text-main hover:bg-surface-2 cursor-pointer transition-all"
            title="Làm mới bảng điểm theo danh sách Sơ đồ lớp"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Đồng bộ Sơ đồ lớp</span>
          </button>
        </div>
      </div>

      {/* Class Statistics Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-surface rounded-xl border border-token p-3 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-muted uppercase">Sĩ số (Chuẩn Sơ đồ lớp)</span>
          <div className="my-1 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-main">{stats.countHasGrades}</span>
            <span className="text-xs text-muted">/ {stats.total} học sinh</span>
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            Quy chiếu 100% từ Sơ đồ lớp
          </span>
        </div>

        <div className="bg-surface rounded-xl border border-token p-3 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-muted uppercase">ĐTB Cả Lớp</span>
          <div className="my-1 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-accent">
              {stats.avgClassGpa !== null ? stats.avgClassGpa.toFixed(1) : '--'}
            </span>
            <span className="text-xs text-muted">/ 10</span>
          </div>
          <span className="text-[10px] text-muted">
            Theo TT 22/2021/BGDĐT
          </span>
        </div>

        <div className="bg-surface rounded-xl border border-token p-3 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-muted uppercase">Học lực Xuất sắc &amp; Giỏi</span>
          <div className="my-1 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400">
              {stats.countXuatSac + stats.countGioi}
            </span>
            <span className="text-xs text-muted">HS ({Math.round(((stats.countXuatSac + stats.countGioi) / (stats.total || 1)) * 100)}%)</span>
          </div>
          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
            {stats.countXuatSac} Xuất sắc · {stats.countGioi} Giỏi
          </span>
        </div>

        <div className="bg-surface rounded-xl border border-token p-3 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-muted uppercase">Học lực Khá &amp; Đạt</span>
          <div className="my-1 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">
              {stats.countKha + stats.countDat}
            </span>
            <span className="text-xs text-muted">HS ({Math.round(((stats.countKha + stats.countDat) / (stats.total || 1)) * 100)}%)</span>
          </div>
          <span className="text-[10px] text-muted">
            {stats.countKha} Khá · {stats.countDat} Đạt
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="w-full bg-surface rounded-xl border border-token p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Tìm theo tên học sinh, mã HS..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-surface-2 border border-token text-xs text-main placeholder:text-muted focus:outline-hidden focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Group / Tổ Filter */}
          <div className="flex items-center gap-1 bg-surface-2 p-0.5 rounded-lg border border-token">
            <button
              type="button"
              onClick={() => setSelectedTo('all')}
              className={`px-2 py-1 rounded font-bold cursor-pointer transition-colors ${
                selectedTo === 'all' ? 'bg-surface text-main shadow-xs' : 'text-muted hover:text-main'
              }`}
            >
              Cả lớp
            </button>
            {[1, 2, 3, 4].map(toNum => (
              <button
                key={toNum}
                type="button"
                onClick={() => setSelectedTo(toNum)}
                className={`px-2 py-1 rounded font-bold cursor-pointer transition-colors ${
                  selectedTo === toNum ? 'bg-surface text-main shadow-xs' : 'text-muted hover:text-main'
                }`}
              >
                Tổ {toNum}
              </button>
            ))}
          </div>
        </div>

        {/* Semester Selector */}
        <div className="flex items-center gap-1 bg-surface-2 p-0.5 rounded-lg border border-token">
          <button
            type="button"
            onClick={() => setSelectedHocKi(1)}
            className={`px-2.5 py-1 rounded font-bold cursor-pointer transition-colors ${
              selectedHocKi === 1 ? 'bg-accent text-on-accent shadow-xs' : 'text-muted hover:text-main'
            }`}
          >
            Học kỳ 1
          </button>
          <button
            type="button"
            onClick={() => setSelectedHocKi(2)}
            className={`px-2.5 py-1 rounded font-bold cursor-pointer transition-colors ${
              selectedHocKi === 2 ? 'bg-accent text-on-accent shadow-xs' : 'text-muted hover:text-main'
            }`}
          >
            Học kỳ 2
          </button>
        </div>
      </div>

      {/* Main Class Gradebook Table */}
      <div className="w-full bg-surface rounded-2xl border border-token shadow-xs overflow-hidden">
        <div className="w-full overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-token bg-surface-2/80 text-[11px] font-bold text-muted uppercase tracking-wider">
                <th className="py-2.5 px-3 whitespace-nowrap">STT</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Họ và tên</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap">Tổ</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap">Toán</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap">Văn</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap">Anh</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap">Lí</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap">Hóa</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap">Sinh</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap">Sử</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap">Địa</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap">GDKT</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap">Tin</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap">GDTC</th>
                <th className="py-2.5 px-2 text-center font-black text-main whitespace-nowrap">ĐTB</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap">Học lực</th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-token/50">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={17} className="py-8 text-center text-muted">
                    Không tìm thấy học sinh nào phù hợp bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec, idx) => {
                  const toanTb = rec.subjects['toan']?.tb;
                  const vanTb = rec.subjects['van']?.tb;
                  const anhTb = rec.subjects['anh']?.tb;
                  const lyTb = rec.subjects['ly']?.tb;
                  const hoaTb = rec.subjects['hoa']?.tb;
                  const sinhTb = rec.subjects['sinh']?.tb;
                  const suTb = rec.subjects['su']?.tb;
                  const diaTb = rec.subjects['dia']?.tb;
                  const gdcdTb = rec.subjects['gdcd']?.tb;
                  const tinTb = rec.subjects['tin']?.tb;
                  const tdeval = rec.subjects['td']?.evaluateResult ?? 'Đ';

                  return (
                    <tr 
                      key={rec.maHS} 
                      className="hover:bg-surface-2/50 transition-colors"
                    >
                      <td className="py-2.5 px-3 font-mono font-medium text-muted">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-main whitespace-nowrap">
                          {rec.hoTen}
                        </div>
                        <div className="text-[10px] text-muted font-mono">
                          {rec.maHS}
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-center font-semibold text-muted">
                        T{rec.to}
                      </td>

                      {/* Subject Averages */}
                      <td className="py-2.5 px-2 text-center font-mono font-medium">
                        {toanTb != null ? toanTb.toFixed(1) : '--'}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-medium">
                        {vanTb != null ? vanTb.toFixed(1) : '--'}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-medium">
                        {anhTb != null ? anhTb.toFixed(1) : '--'}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-medium">
                        {lyTb != null ? lyTb.toFixed(1) : '--'}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-medium">
                        {hoaTb != null ? hoaTb.toFixed(1) : '--'}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-medium">
                        {sinhTb != null ? sinhTb.toFixed(1) : '--'}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-medium">
                        {suTb != null ? suTb.toFixed(1) : '--'}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-medium">
                        {diaTb != null ? diaTb.toFixed(1) : '--'}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-medium">
                        {gdcdTb != null ? gdcdTb.toFixed(1) : '--'}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-medium">
                        {tinTb != null ? tinTb.toFixed(1) : '--'}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-xs text-emerald-600 dark:text-emerald-400">
                        {tdeval}
                      </td>

                      {/* Overall GPA */}
                      <td className="py-2.5 px-2 text-center">
                        <span className="font-mono font-black text-xs px-1.5 py-0.5 rounded bg-surface-2 text-main">
                          {rec.diemTBChung !== null ? rec.diemTBChung.toFixed(1) : '--'}
                        </span>
                      </td>

                      {/* Standing Badge */}
                      <td className="py-2.5 px-2 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black ${
                          rec.hocLuc === 'Xuất sắc'
                            ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                            : rec.hocLuc === 'Giỏi'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : rec.hocLuc === 'Khá'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                        }`}>
                          {rec.hocLuc || '--'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedStudentForDetail(rec)}
                          className="px-2 py-1 rounded bg-surface-2 hover:bg-surface-3 text-accent font-bold text-xs cursor-pointer transition-colors inline-flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Chi tiết</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Import Excel */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-surface rounded-2xl border border-token p-5 sm:p-6 shadow-xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-token/60 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-accent" />
                <h3 className="text-base font-black text-main">
                  Nhập bảng điểm từ file Excel
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setUploadError(null);
                  setUploadSuccessMsg(null);
                }}
                className="w-7 h-7 rounded-lg text-muted hover:text-main hover:bg-surface-2 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              Hệ thống tự động nhận diện các cột điểm theo tên môn (Toán, Văn, Anh, Lí, Hóa, Sinh, Sử, Địa, GDKT&amp;PL, Tin, Thể dục...) và tính điểm trung bình chuẩn theo Thông tư 22/2021/TT-BGDĐT.
            </p>

            {/* Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-token hover:border-accent rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-surface-2/40 hover:bg-accent/5 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-main mb-1">
                Kéo thả file Excel vào đây hoặc bấm để chọn file
              </span>
              <span className="text-[11px] text-muted">
                Hỗ trợ định dạng .xlsx, .xls hoặc .csv xuất từ vnEdu, SMAS
              </span>
            </div>

            {isUploading && (
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-xs flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Đang phân tích và xử lý bảng điểm Excel...</span>
              </div>
            )}

            {uploadError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2">
                <FileCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{uploadSuccessMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-token/60">
              <button
                type="button"
                onClick={() => exportGradeTemplate(students)}
                className="text-xs text-accent hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải file mẫu (Theo Sơ đồ lớp hiện tại)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setUploadError(null);
                  setUploadSuccessMsg(null);
                }}
                className="px-4 py-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-main font-bold text-xs cursor-pointer transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Single Student Detailed Component Scores (Edit & View) */}
      {selectedStudentForDetail && (
        <StudentDetailModal
          student={selectedStudentForDetail}
          onClose={() => setSelectedStudentForDetail(null)}
          onSave={handleSaveStudentDetail}
        />
      )}
    </div>
  );
};

interface StudentDetailModalProps {
  student: StudentAcademicRecord;
  onClose: () => void;
  onSave: (record: StudentAcademicRecord) => void;
}

const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<StudentAcademicRecord>(() => JSON.parse(JSON.stringify(student)));

  const handleScoreChange = (subjId: string, field: 'tx0' | 'tx1' | 'tx2' | 'gk' | 'ck', val: string) => {
    const num = val === '' ? null : parseFloat(val);
    if (num !== null && (isNaN(num) || num < 0 || num > 10)) return;

    setFormData(prev => {
      const currentSub = prev.subjects[subjId] || { subjectId: subjId, tx: [], gk: null, ck: null, tb: null };
      const currentTx = [...(currentSub.tx || [])];

      if (field === 'tx0') currentTx[0] = num;
      else if (field === 'tx1') currentTx[1] = num;
      else if (field === 'tx2') currentTx[2] = num;
      else if (field === 'gk') currentSub.gk = num;
      else if (field === 'ck') currentSub.ck = num;

      currentSub.tx = currentTx;
      currentSub.tb = calculateSubjectAverage(currentSub);

      const updatedSubjects = { ...prev.subjects, [subjId]: currentSub };
      const gpa = calculateOverallGPA(updatedSubjects);
      const { hocLuc, danhHieu } = evaluateAcademicStanding(updatedSubjects, gpa);

      return {
        ...prev,
        subjects: updatedSubjects,
        diemTBChung: gpa,
        hocLuc,
        danhHieu,
      };
    });
  };

  const handleTeacherNoteChange = (val: string) => {
    setFormData(prev => ({ ...prev, nhanXetGVCN: val }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-surface rounded-2xl border border-token p-4 sm:p-6 shadow-xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-token/60 pb-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-accent" />
            <div>
              <h3 className="text-base font-black text-main">
                Bảng điểm chi tiết: {formData.hoTen}
              </h3>
              <p className="text-xs text-muted">
                {formData.maHS} · Tổ {formData.to} · Học kỳ {formData.hocKi} (2026-2027)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-muted hover:text-main hover:bg-surface-2 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* GPA Summary row */}
        <div className="grid grid-cols-3 gap-2 bg-surface-2 p-3 rounded-xl text-center">
          <div>
            <span className="text-[10px] text-muted font-bold block">ĐTB CHUNG</span>
            <span className="text-lg font-black text-accent">
              {formData.diemTBChung !== null ? formData.diemTBChung.toFixed(1) : '--'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-muted font-bold block">HỌC LỰC</span>
            <span className="text-xs font-black text-main">
              {formData.hocLuc || 'Chưa xét'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-muted font-bold block">DANH HIỆU</span>
            <span className="text-xs font-black text-amber-600 dark:text-amber-400">
              {formData.danhHieu || 'Chưa xét'}
            </span>
          </div>
        </div>

        {/* Subject Score Editor Grid */}
        <div className="w-full flex flex-col gap-2">
          <span className="text-xs font-bold text-main uppercase tracking-wider">
            Điểm thành phần các môn
          </span>

          <div className="w-full border border-token rounded-xl overflow-hidden text-xs">
            <div className="grid grid-cols-12 bg-surface-2 p-2 font-bold text-muted text-[11px] border-b border-token">
              <div className="col-span-4">Môn học</div>
              <div className="col-span-2 text-center">TX 1</div>
              <div className="col-span-2 text-center">TX 2</div>
              <div className="col-span-2 text-center">GK (x2)</div>
              <div className="col-span-2 text-center">CK (x3)</div>
            </div>

            <div className="divide-y divide-token/60 max-h-72 overflow-y-auto no-scrollbar">
              {DEFAULT_SUBJECTS.filter(s => s.type === 'score').map(s => {
                const sc = formData.subjects[s.id] || { subjectId: s.id, tx: [], gk: null, ck: null, tb: null };
                const tx0 = sc.tx?.[0] !== null && sc.tx?.[0] !== undefined ? String(sc.tx[0]) : '';
                const tx1 = sc.tx?.[1] !== null && sc.tx?.[1] !== undefined ? String(sc.tx[1]) : '';
                const gk = sc.gk !== null && sc.gk !== undefined ? String(sc.gk) : '';
                const ck = sc.ck !== null && sc.ck !== undefined ? String(sc.ck) : '';

                return (
                  <div key={s.id} className="grid grid-cols-12 p-2 items-center hover:bg-surface-2/40">
                    <div className="col-span-4 flex items-center gap-1.5 font-bold text-main">
                      <span>{s.icon}</span>
                      <span>{s.name}</span>
                      {sc.tb !== null && sc.tb !== undefined && (
                        <span className="text-[10px] font-mono text-accent">({sc.tb.toFixed(1)})</span>
                      )}
                    </div>

                    <div className="col-span-2 px-1">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={tx0}
                        onChange={e => handleScoreChange(s.id, 'tx0', e.target.value)}
                        className="w-full text-center py-1 rounded bg-surface-2 border border-token text-xs font-mono font-bold text-main focus:outline-hidden focus:ring-1 focus:ring-accent"
                      />
                    </div>

                    <div className="col-span-2 px-1">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={tx1}
                        onChange={e => handleScoreChange(s.id, 'tx1', e.target.value)}
                        className="w-full text-center py-1 rounded bg-surface-2 border border-token text-xs font-mono font-bold text-main focus:outline-hidden focus:ring-1 focus:ring-accent"
                      />
                    </div>

                    <div className="col-span-2 px-1">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={gk}
                        onChange={e => handleScoreChange(s.id, 'gk', e.target.value)}
                        className="w-full text-center py-1 rounded bg-surface-2 border border-token text-xs font-mono font-bold text-main focus:outline-hidden focus:ring-1 focus:ring-accent"
                      />
                    </div>

                    <div className="col-span-2 px-1">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={ck}
                        onChange={e => handleScoreChange(s.id, 'ck', e.target.value)}
                        className="w-full text-center py-1 rounded bg-surface-2 border border-token text-xs font-mono font-bold text-main focus:outline-hidden focus:ring-1 focus:ring-accent"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Teacher Note */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-main">
            Nhận xét của Giáo viên chủ nhiệm:
          </label>
          <textarea
            rows={2}
            value={formData.nhanXetGVCN || ''}
            onChange={e => handleTeacherNoteChange(e.target.value)}
            placeholder="Ghi nhận xét về sự tiến bộ, thái độ học tập..."
            className="w-full p-2.5 rounded-xl bg-surface-2 border border-token text-xs text-main placeholder:text-muted focus:outline-hidden focus:ring-1 focus:ring-accent resize-none"
          />
        </div>

        {/* Modal Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-token/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-main font-bold text-xs cursor-pointer transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => onSave(formData)}
            className="px-4 py-2 rounded-xl bg-accent text-on-accent font-bold text-xs cursor-pointer hover:brightness-110 shadow-xs transition-all flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Lưu thay đổi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
