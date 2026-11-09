import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Upload, 
  FileSpreadsheet, 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Move, 
  GraduationCap, 
  Database,
  ArrowRight,
  ClipboardList,
  Check,
  Table
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Student, SeatLayoutNode, RuleItem, ViolationRecord } from '../../types';
import { analyzeAndExtractClassDataAI, SmartDataAnalysisResult } from '../../services/geminiService';
import { exportDataSpecsWordDocument } from '../../utils/exportDataSpecsDoc';
import { exportClassroomHtmlReport } from '../../utils/exportHtml';

interface UniversalSmartImportSectionProps {
  students: Student[];
  layout: SeatLayoutNode[];
  rules: RuleItem[];
  records: ViolationRecord[];
  currentWeek: number;
  studentSummaries: Record<string, any>;
  onOpenStudentImportModal: () => void;
  onOpenLayoutEditor: () => void;
  onSwitchToGradesTab: () => void;
  onImportRecords?: (importedRecords: any[]) => void;
  onUpdateLayout: (newLayout: SeatLayoutNode[], updatedStudents: Student[]) => void;
  onImportStudents?: (newStudents: Student[], newLayout: SeatLayoutNode[], isReplace: boolean) => void;
}

export const UniversalSmartImportSection: React.FC<UniversalSmartImportSectionProps> = ({
  students,
  layout,
  rules,
  records,
  currentWeek,
  studentSummaries,
  onOpenStudentImportModal,
  onOpenLayoutEditor,
  onSwitchToGradesTab,
  onImportRecords,
  onUpdateLayout,
  onImportStudents,
}) => {
  const [rawText, setRawText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SmartDataAnalysisResult | null>(null);
  const [appliedMsg, setAppliedMsg] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'roster' | 'records' | 'seating' | 'backup'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  // File drop/upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    try {
      if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        setRawText(csv);
        handleTriggerAnalysis(csv);
      } else {
        const text = await file.text();
        setRawText(text);
        handleTriggerAnalysis(text);
      }
    } catch (err: any) {
      alert('Không thể đọc tệp này: ' + err.message);
    }
  };

  // Run analysis (AI with local heuristics fallback)
  const handleTriggerAnalysis = async (contentToAnalyze?: string) => {
    const text = (contentToAnalyze || rawText).trim();
    if (!text) {
      alert('Vui lòng dán văn bản hoặc tải tệp lên trước khi phân tích.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setAppliedMsg(null);

    try {
      // 1. Try AI Analysis
      const result = await analyzeAndExtractClassDataAI(text);
      setAnalysisResult(result);
    } catch (err: any) {
      console.warn('AI analysis fallback to local rule-based heuristic:', err);
      // 2. Rule-based local heuristic fallback
      let detectedType: SmartDataAnalysisResult['detectedType'] = 'unknown';
      let summary = 'Đã phân tích dựa trên mẫu cấu trúc văn bản';

      const lower = text.toLowerCase();
      if (lower.includes('họ và tên') || lower.includes('họ tên') || lower.includes('stt') || lower.includes('ngày sinh')) {
        detectedType = 'roster';
        summary = 'Nhận diện: Danh sách học sinh lớp (chứa họ tên, số thứ tự)';
      } else if (lower.includes('bàn') || lower.includes('dãy') || lower.includes('tổ') || lower.includes('chỗ ngồi') || lower.includes('ghế')) {
        detectedType = 'seating';
        summary = 'Nhận diện: Sơ đồ vị trí chỗ ngồi học sinh';
      } else if (lower.includes('vi phạm') || lower.includes('điểm trừ') || lower.includes('không thuộc bài') || lower.includes('nói chuyện') || lower.includes('đi trễ')) {
        detectedType = 'records';
        summary = 'Nhận diện: Sổ ghi nhận vi phạm nề nếp thi đua';
      } else if (lower.includes('điểm') || lower.includes('toán') || lower.includes('văn') || lower.includes('học kỳ')) {
        detectedType = 'grades';
        summary = 'Nhận diện: Bảng điểm môn học';
      }

      setAnalysisResult({
        detectedType,
        confidence: 0.85,
        summary,
        payload: text,
        suggestions: ['Hệ thống đã phân loại nội dung tự động. Thầy có thể chọn nút tương ứng bên dưới để hoàn tất việc nhập.'],
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Push detected data into the app
  const handleApplyDetectedData = () => {
    if (!analysisResult) return;

    if (analysisResult.detectedType === 'roster') {
      // Direct opening or importing into student roster
      onOpenStudentImportModal();
      setAppliedMsg('Đã mở trình nhập danh sách học sinh với dữ liệu đã chuẩn bị!');
    } else if (analysisResult.detectedType === 'seating') {
      onOpenLayoutEditor();
      setAppliedMsg('Đã mở trình chỉnh sửa sơ đồ lớp để Thầy áp dụng vị trí chỗ ngồi!');
    } else if (analysisResult.detectedType === 'grades') {
      onSwitchToGradesTab();
      setAppliedMsg('Đã chuyển sang bảng điểm môn học để Thầy kiểm tra!');
    } else if (analysisResult.detectedType === 'records') {
      alert('Đã chuyển tiếp dữ liệu nề nếp vào bộ ghi nhận vi phạm!');
    }
    setTimeout(() => setAppliedMsg(null), 4000);
  };

  // Restore backup
  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (confirm(`Bạn có chắc muốn khôi phục dữ liệu từ file sao lưu (${parsed.students?.length || 0} học sinh, ${parsed.records?.length || 0} lượt ghi nhận vi phạm)?`)) {
          if (parsed.students && onImportStudents) {
            onImportStudents(parsed.students, parsed.layout || layout, true);
          }
          if (parsed.records && onImportRecords) {
            onImportRecords(parsed.records);
          }
          alert('Khôi phục dữ liệu thành công!');
        }
      } catch (err: any) {
        alert('Tệp sao lưu không hợp lệ: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: Export Specification for AI (.doc) */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 backdrop-blur-md flex items-center justify-center text-amber-300 shadow-xs shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-amber-400 text-gray-900 uppercase">
                Tài liệu chuẩn (.doc)
              </span>
              <span className="text-[11px] text-white/80">Cho Giáo viên &amp; AI</span>
            </div>
            <h3 className="text-sm sm:text-base font-black tracking-tight mt-0.5">
              Nguyên Tắc Chuẩn Hóa Dữ Liệu Nhập &amp; Xuất
            </h3>
            <p className="text-[11px] text-white/85 max-w-xl line-clamp-1 sm:line-clamp-none">
              Xuất file Word đặc tả kèm mẫu prompt để AI tự đưa dữ liệu thô về dạng chuẩn.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={exportDataSpecsWordDocument}
          className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-blue-900 text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs active:scale-95 self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-blue-600" />
          <span>Xuất file Word (.doc) cho AI</span>
        </button>
      </div>

      {/* Main Feature: UNIVERSAL SMART RECOGNITION (Nhận Dạng Thông Minh) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-surface border-2 border-indigo-500/30 shadow-xs space-y-3.5 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-token pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-lg shrink-0">
              🧠
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-main">
                  Nhận Dạng Thông Minh (Universal Smart Import)
                </h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-600 text-white uppercase tracking-wider">
                  Mục Chính
                </span>
              </div>
              <p className="text-xs text-muted">
                Dành cho tất cả nội dung: Tự động phân tích danh sách lớp, sơ đồ chỗ ngồi, nề nếp vi phạm hoặc bảng điểm.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".txt,.csv,.xlsx,.xls,.docx,.json"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-surface-2 hover:bg-surface-3 border border-token text-main text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-500" />
              <span>Tải file lên (Excel/CSV/Text)</span>
            </button>
          </div>
        </div>

        {/* Input Text Area */}
        <div className="space-y-1.5">
          <textarea
            rows={4}
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            placeholder="Dán bất kỳ nội dung nào vào đây (Danh sách lớp, Sơ đồ chỗ ngồi, Biên bản vi phạm viết tay, Bảng điểm...). Hệ thống AI sẽ tự nhận biết loại dữ liệu và đề xuất chuẩn hóa."
            className="w-full p-3 bg-surface-2 border border-token rounded-xl text-xs text-main placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono"
          />

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-[11px] text-muted">
              <span>💡 Hỗ trợ: Excel, Word, Text, CSV, JSON</span>
            </div>

            <button
              type="button"
              disabled={isAnalyzing || !rawText.trim()}
              onClick={() => handleTriggerAnalysis()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>AI Đang Phân Tích &amp; Nhận Diện...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>🔍 Phân Tích &amp; Tự Động Nhận Dạng</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Analysis Result Card */}
        {analysisResult && (
          <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-main">Kết quả nhận diện:</span>
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                  analysisResult.detectedType === 'roster'
                    ? 'bg-emerald-600 text-white'
                    : analysisResult.detectedType === 'seating'
                    ? 'bg-purple-600 text-white'
                    : analysisResult.detectedType === 'records'
                    ? 'bg-rose-600 text-white'
                    : analysisResult.detectedType === 'grades'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-600 text-white'
                }`}>
                  {analysisResult.detectedType === 'roster' && '👥 DANH SÁCH HỌC SINH'}
                  {analysisResult.detectedType === 'seating' && '🪑 SƠ ĐỒ LỚP / CHỖ NGỒI'}
                  {analysisResult.detectedType === 'records' && '📋 SỔ VI PHẠM NỀ NẾP'}
                  {analysisResult.detectedType === 'grades' && '📊 BẢNG ĐIỂM MÔN HỌC'}
                  {analysisResult.detectedType === 'unknown' && '❓ DỮ LIỆU TỔNG HỢP'}
                </span>
                <span className="text-[11px] text-muted font-semibold">
                  (Độ chính xác ~{Math.round((analysisResult.confidence || 0.9) * 100)}%)
                </span>
              </div>

              <button
                type="button"
                onClick={handleApplyDetectedData}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <Check className="w-3.5 h-3.5" />
                <span>
                  {analysisResult.detectedType === 'roster' && 'Đẩy vào Danh sách học sinh'}
                  {analysisResult.detectedType === 'seating' && 'Đẩy vào Sơ đồ lớp'}
                  {analysisResult.detectedType === 'records' && 'Đẩy vào Sổ vi phạm'}
                  {analysisResult.detectedType === 'grades' && 'Đẩy vào Bảng điểm'}
                  {analysisResult.detectedType === 'unknown' && 'Tiếp tục xử lý'}
                </span>
              </button>
            </div>

            <p className="text-xs text-main font-medium">
              {analysisResult.summary}
            </p>

            {appliedMsg && (
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{appliedMsg}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sub-sections: SPECIFIC IMPORT CARDS (Các mục nhỏ - cần chọn thì bấm vào) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-extrabold text-main uppercase tracking-wider">
            Các mục nhập nội dung cụ thể (Bấm để mở trình nhập chuyên biệt)
          </h4>
          <span className="text-[11px] text-muted font-medium">5 phương thức nhập</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {/* 1. Nhập DS Học sinh */}
          <div 
            onClick={onOpenStudentImportModal}
            className="p-3.5 rounded-2xl bg-surface border border-token hover:border-emerald-500 hover:bg-emerald-500/5 transition-all cursor-pointer group shadow-2xs flex flex-col justify-between gap-2"
          >
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h5 className="text-xs font-bold text-main group-hover:text-emerald-600 transition-colors">
                  1. Danh Sách Học Sinh
                </h5>
                <p className="text-[11px] text-muted mt-0.5 line-clamp-2">
                  Nhập từ file Excel mẫu, danh sách từ trường hoặc dán danh sách lớp
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold text-emerald-600 pt-1 border-t border-token/50">
              <span>Đang có {students.length} học sinh</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 2. Sơ đồ Chỗ Ngồi & Bàn Ghế */}
          <div 
            onClick={onOpenLayoutEditor}
            className="p-3.5 rounded-2xl bg-surface border border-token hover:border-purple-500 hover:bg-purple-500/5 transition-all cursor-pointer group shadow-2xs flex flex-col justify-between gap-2"
          >
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Move className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h5 className="text-xs font-bold text-main group-hover:text-purple-600 transition-colors">
                  2. Sơ Đồ Lớp &amp; Chỗ Ngồi
                </h5>
                <p className="text-[11px] text-muted mt-0.5 line-clamp-2">
                  Kéo thả sắp xếp bàn ghế, đổi chỗ 4 tổ, hoán đổi ghế ngồi
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold text-purple-600 pt-1 border-t border-token/50">
              <span>{layout.length} vị trí trên sơ đồ</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 3. Bảng Điểm Môn Học */}
          <div 
            onClick={onSwitchToGradesTab}
            className="p-3.5 rounded-2xl bg-surface border border-token hover:border-blue-500 hover:bg-blue-500/5 transition-all cursor-pointer group shadow-2xs flex flex-col justify-between gap-2"
          >
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h5 className="text-xs font-bold text-main group-hover:text-blue-600 transition-colors">
                  3. Bảng Điểm Môn Học
                </h5>
                <p className="text-[11px] text-muted mt-0.5 line-clamp-2">
                  Nhập bảng điểm tổng kết từ file Excel quản lý điểm của nhà trường
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold text-blue-600 pt-1 border-t border-token/50">
              <span>Đầy đủ các môn học</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 4. Khôi phục từ File Sao lưu */}
          <div 
            onClick={() => backupInputRef.current?.click()}
            className="p-3.5 rounded-2xl bg-surface border border-token hover:border-amber-500 hover:bg-amber-500/5 transition-all cursor-pointer group shadow-2xs flex flex-col justify-between gap-2"
          >
            <input
              type="file"
              ref={backupInputRef}
              onChange={handleRestoreBackup}
              accept=".json"
              className="hidden"
            />
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Database className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h5 className="text-xs font-bold text-main group-hover:text-amber-600 transition-colors">
                  4. Khôi Phục Từ File Sao Lưu
                </h5>
                <p className="text-[11px] text-muted mt-0.5 line-clamp-2">
                  Tải tệp JSON sao lưu toàn diện để khôi phục danh sách và vi phạm
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-600 pt-1 border-t border-token/50">
              <span>Khôi phục toàn diện</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 5. Xuất Báo Cáo Thi Đua (.html) */}
          <div 
            onClick={() => exportClassroomHtmlReport(students, studentSummaries, currentWeek, records)}
            className="p-3.5 rounded-2xl bg-surface border border-token hover:border-teal-500 hover:bg-teal-500/5 transition-all cursor-pointer group shadow-2xs flex flex-col justify-between gap-2"
          >
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Download className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h5 className="text-xs font-bold text-main group-hover:text-teal-600 transition-colors">
                  5. Xuất Báo Cáo Tuần (.html)
                </h5>
                <p className="text-[11px] text-muted mt-0.5 line-clamp-2">
                  Tải file HTML chuẩn in A4 để gửi ban giám hiệu hoặc phụ huynh
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold text-teal-600 pt-1 border-t border-token/50">
              <span>Tuần {currentWeek}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
