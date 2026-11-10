import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Plus, 
  X, 
  Users, 
  Sparkles, 
  FileText, 
  Check, 
  ArrowRight,
  Info,
  RefreshCw,
  UserCheck,
  Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Student, SeatLayoutNode, RoleCode } from '../../types';
import { getDefaultStudentAvatar } from '../../data/mockData';
import { exportDataSpecsWordDocument } from '../../utils/exportDataSpecsDoc';
import {
  generateDefaultLayoutForStudents,
  isValidStudentName,
  isTemplateSampleStudent,
} from '../../utils/seatingMaster';

interface StudentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStudents: Student[];
  onImportSuccess: (newStudents: Student[], newLayout: SeatLayoutNode[], isReplace: boolean) => void;
}

interface ParsedStudentDraft {
  stt: number;
  hoTen: string;
  gioiTinh: 'Nam' | 'Nu';
  to: 1 | 2 | 3 | 4;
  ngaySinh?: string;
  chucVu?: string;
}

export const StudentImportModal: React.FC<StudentImportModalProps> = ({
  isOpen,
  onClose,
  currentStudents,
  onImportSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'paste' | 'file'>('paste');
  const [pastedText, setPastedText] = useState('');
  const [parsedStudents, setParsedStudents] = useState<ParsedStudentDraft[]>([]);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Guess gender by Vietnamese name convention
  const guessGender = (fullName: string): 'Nam' | 'Nu' => {
    const lower = fullName.toLowerCase().trim();
    if (lower.includes('thị') || lower.includes('thuý') || lower.includes('hương') || lower.includes('ngọc') || lower.includes('linh') || lower.includes('hoa') || lower.includes('thảo') || lower.includes('nhung') || lower.includes('mai')) {
      return 'Nu';
    }
    return 'Nam';
  };

  // Parse pasted raw text (from Excel, Word, or text notes)
  const handleParsePastedText = () => {
    setErrorMessage(null);
    if (!pastedText.trim()) {
      setErrorMessage('Vui lòng dán danh sách học sinh vào ô bên dưới.');
      return;
    }

    const lines = pastedText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      setErrorMessage('Không tìm thấy dữ liệu hợp lệ.');
      return;
    }

    const results: ParsedStudentDraft[] = [];

    lines.forEach((line, index) => {
      // Check for tab-separated (copy from Excel / Sheets)
      const tabCols = line.split('\t').map(c => c.trim()).filter(Boolean);

      let hoTen = '';
      let gioiTinh: 'Nam' | 'Nu' = 'Nam';
      let to: 1 | 2 | 3 | 4 = ((index % 4) + 1) as 1 | 2 | 3 | 4;
      let ngaySinh: string | undefined = undefined;

      if (tabCols.length >= 2) {
        // Likely Excel paste: [STT, HoTen, ...] or [HoTen, GioiTinh, ...]
        let nameCandidate = '';
        tabCols.forEach(col => {
          const lower = col.toLowerCase();
          if (lower === 'nam' || lower === 'm' || lower === 'trai') {
            gioiTinh = 'Nam';
          } else if (lower === 'nữ' || lower === 'nu' || lower === 'f' || lower === 'gái') {
            gioiTinh = 'Nu';
          } else if (lower.match(/^tổ\s*([1-4])$/) || lower.match(/^to\s*([1-4])$/)) {
            const m = lower.match(/[1-4]/);
            if (m) to = Number(m[0]) as 1 | 2 | 3 | 4;
          } else if (col.match(/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/)) {
            ngaySinh = col;
          } else if (col.length > 2 && !col.match(/^\d+$/) && !nameCandidate) {
            nameCandidate = col;
          }
        });

        hoTen = nameCandidate || tabCols[1] || tabCols[0];
      } else {
        // Plain text row: e.g. "1. Nguyễn Văn An (Nam)" or "Nguyễn Văn An"
        let clean = line
          .replace(/^\d+[\.\/\)\-\:]\s*/, '') // remove numbering like "1. ", "01/ "
          .replace(/^hs\d+\s*[\:\-]\s*/i, ''); // remove "HS01: "

        // Check for gender suffix in parentheses: (Nam), (Nữ)
        if (clean.match(/\(nữ\)|\(nu\)/i)) {
          gioiTinh = 'Nu';
          clean = clean.replace(/\(nữ\)|\(nu\)/gi, '').trim();
        } else if (clean.match(/\(nam\)/i)) {
          gioiTinh = 'Nam';
          clean = clean.replace(/\(nam\)/gi, '').trim();
        } else {
          gioiTinh = guessGender(clean);
        }

        // Check for group/tổ indicator
        const toMatch = clean.match(/tổ\s*([1-4])/i);
        if (toMatch) {
          to = Number(toMatch[1]) as 1 | 2 | 3 | 4;
          clean = clean.replace(/tổ\s*[1-4]/gi, '').trim();
        }

        hoTen = clean.trim();
      }

      // Ignore header rows
      const lowerName = hoTen.toLowerCase();
      if (lowerName === 'họ và tên' || lowerName === 'họ tên' || lowerName === 'học sinh' || lowerName === 'stt' || lowerName === 'tên') {
        return;
      }

      if (isValidStudentName(hoTen) && results.length < 48) {
        results.push({
          stt: results.length + 1,
          hoTen,
          gioiTinh,
          to,
          ngaySinh,
        });
      }
    });

    if (results.length === 0) {
      setErrorMessage('Không nhận diện được học sinh nào. Thầy vui lòng kiểm tra lại định dạng.');
      return;
    }

    setParsedStudents(results);
  };

  // Parse Excel / CSV File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonRows.length === 0) {
          setErrorMessage('File Excel trống hoặc không có nội dung.');
          setIsProcessing(false);
          return;
        }

        // Find header row or analyze columns
        let headerRowIndex = -1;
        let colNameIndex = -1;
        let colGenderIndex = -1;
        let colGroupIndex = -1;
        let colDobIndex = -1;

        for (let r = 0; r < Math.min(10, jsonRows.length); r++) {
          const row = jsonRows[r];
          if (!Array.isArray(row)) continue;
          row.forEach((cell, c) => {
            const str = String(cell || '').toLowerCase().trim();
            if (str.includes('họ và tên') || str.includes('họ tên') || str.includes('tên học sinh')) {
              headerRowIndex = r;
              colNameIndex = c;
            } else if (str.includes('giới tính') || str === 'phái' || str === 'nam/nữ') {
              colGenderIndex = c;
            } else if (str.includes('tổ') || str.includes('nhóm')) {
              colGroupIndex = c;
            } else if (str.includes('ngày sinh') || str.includes('năm sinh')) {
              colDobIndex = c;
            }
          });
          if (colNameIndex !== -1) break;
        }

        // If no explicit header, assume column 1 or 0 has names
        const startRow = headerRowIndex !== -1 ? headerRowIndex + 1 : 0;
        const results: ParsedStudentDraft[] = [];

        for (let r = startRow; r < jsonRows.length; r++) {
          const row = jsonRows[r];
          if (!Array.isArray(row) || row.length === 0) continue;

          let hoTen = '';
          if (colNameIndex !== -1) {
            hoTen = row[colNameIndex] !== undefined && row[colNameIndex] !== null
              ? String(row[colNameIndex]).trim()
              : '';
          } else {
            // Find first string cell with length > 2
            for (let c = 0; c < row.length; c++) {
              const val = String(row[c] || '').trim();
              if (val.length > 2 && !val.match(/^\d+$/) && !val.includes('/')) {
                hoTen = val;
                break;
              }
            }
          }

          if (!hoTen || !isValidStudentName(hoTen)) continue;

          // DOB
          let ngaySinh: string | undefined = undefined;
          if (colDobIndex !== -1 && row[colDobIndex]) {
            ngaySinh = String(row[colDobIndex]).trim();
          }

          if (jsonRows.length > 4 && isTemplateSampleStudent({ hoTen, ngaySinh })) {
            continue;
          }

          // Gender
          let gioiTinh: 'Nam' | 'Nu' = 'Nam';
          if (colGenderIndex !== -1 && row[colGenderIndex]) {
            const gStr = String(row[colGenderIndex]).toLowerCase().trim();
            if (gStr === 'nữ' || gStr === 'nu' || gStr === 'f' || gStr === 'x') {
              gioiTinh = 'Nu';
            } else {
              gioiTinh = 'Nam';
            }
          } else {
            gioiTinh = guessGender(hoTen);
          }

          // Tổ (Group)
          let to: 1 | 2 | 3 | 4 = ((results.length % 4) + 1) as 1 | 2 | 3 | 4;
          if (colGroupIndex !== -1 && row[colGroupIndex]) {
            const toStr = String(row[colGroupIndex]);
            const m = toStr.match(/[1-4]/);
            if (m) to = Number(m[0]) as 1 | 2 | 3 | 4;
          }

          if (results.length < 48) {
            results.push({
              stt: results.length + 1,
              hoTen,
              gioiTinh,
              to,
              ngaySinh,
            });
          }
        }

        if (results.length === 0) {
          setErrorMessage('Không đọc được danh sách học sinh từ file. Thầy vui lòng kiểm tra lại định dạng file.');
        } else {
          setParsedStudents(results);
        }
      } catch (err: any) {
        console.error('Excel parse error:', err);
        setErrorMessage('Lỗi khi đọc file Excel: ' + (err.message || 'File không đúng định dạng.'));
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Generate Seating Layout for imported students (strictly 4 Tổ x 6 Bàn = max 48 seats)
  const buildLayoutForStudents = (newStudentsList: Student[]): SeatLayoutNode[] => {
    return generateDefaultLayoutForStudents(newStudentsList);
  };

  // Confirm and Apply Import
  const handleConfirmImport = () => {
    if (parsedStudents.length === 0) return;

    let finalStudents: Student[] = [];

    const makeShortName = (fullName: string) => {
      const parts = fullName.trim().split(/\s+/);
      if (parts.length <= 1) return fullName.trim();
      return parts.map((w, i) => (i < parts.length - 1 ? `${w[0]?.toUpperCase() || ''}.` : w)).join('');
    };

    if (importMode === 'replace') {
      // Create fresh students list from draft
      finalStudents = parsedStudents.map((draft, idx) => {
        const studentNumber = idx + 1;
        const maHS = `HS${studentNumber < 10 ? '0' + studentNumber : studentNumber}`;

        return {
          maHS,
          hoTen: draft.hoTen,
          tenRutGon: makeShortName(draft.hoTen),
          gioiTinh: draft.gioiTinh,
          to: draft.to,
          dayBan: draft.to,
          soBan: Math.min(6, Math.floor(idx / 8) + 1),
          viTriGhe: studentNumber,
          vaiTro: (idx === 0 ? ['LT', 'HS'] : idx === 1 ? ['LP_HT', 'HS'] : ['HS']) as RoleCode[],
          avatarUrl: undefined,
          ngaySinh: draft.ngaySinh,
        };
      });
    } else {
      // Append to current students
      const startNum = currentStudents.length + 1;
      const appended: Student[] = parsedStudents.map((draft, idx) => {
        const studentNumber = startNum + idx;
        const maHS = `HS${studentNumber < 10 ? '0' + studentNumber : studentNumber}`;

        return {
          maHS,
          hoTen: draft.hoTen,
          tenRutGon: makeShortName(draft.hoTen),
          gioiTinh: draft.gioiTinh,
          to: draft.to,
          dayBan: draft.to,
          soBan: Math.min(6, Math.floor((studentNumber - 1) / 8) + 1),
          viTriGhe: studentNumber,
          vaiTro: ['HS'] as RoleCode[],
          avatarUrl: undefined,
          ngaySinh: draft.ngaySinh,
        };
      });
      finalStudents = [...currentStudents, ...appended];
    }

    // Build new synchronized seating layout
    const newLayout = buildLayoutForStudents(finalStudents);

    onImportSuccess(finalStudents, newLayout, importMode === 'replace');
    onClose();
  };

  // Remove a row from parsed draft
  const handleRemoveDraftRow = (index: number) => {
    setParsedStudents(prev => prev.filter((_, i) => i !== index));
  };

  // Toggle gender of draft row
  const handleToggleGender = (index: number) => {
    setParsedStudents(prev => prev.map((st, i) => {
      if (i === index) {
        return { ...st, gioiTinh: st.gioiTinh === 'Nam' ? 'Nu' : 'Nam' };
      }
      return st;
    }));
  };

  // Change Tổ of draft row
  const handleChangeGroup = (index: number, newTo: 1 | 2 | 3 | 4) => {
    setParsedStudents(prev => prev.map((st, i) => {
      if (i === index) {
        return { ...st, to: newTo };
      }
      return st;
    }));
  };

  // Statistics
  const totalCount = parsedStudents.length;
  const maleCount = parsedStudents.filter(s => s.gioiTinh === 'Nam').length;
  const femaleCount = parsedStudents.filter(s => s.gioiTinh === 'Nu').length;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div 
        className="w-full max-w-4xl bg-surface border border-token rounded-3xl shadow-2xl overflow-hidden flex flex-col my-4 max-h-[92vh] animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-accent text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/15 backdrop-blur-xs border border-white/20">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>Nhập Danh Sách Học Sinh Thật Vào Lớp</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-400 text-slate-950">
                  Chính thức
                </span>
              </h2>
              <p className="text-xs text-white/80 mt-0.5 font-medium">
                Dán bảng danh sách từ Excel/Word hoặc tải file .xlsx để tạo danh sách học sinh thật cho Thầy
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* AI Specification Helper Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="text-muted">
                Dữ liệu thô từ VnEdu/SMAS chưa đúng mẫu? Tải file quy tắc để AI (ChatGPT/Claude) chuẩn hóa tự động:
              </span>
            </div>
            <button
              type="button"
              onClick={exportDataSpecsWordDocument}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-xs active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất file Word cho AI (.doc)</span>
            </button>
          </div>

          {/* Method Tabs */}
          <div className="flex items-center gap-2 p-1 bg-surface-2 rounded-2xl border border-token text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'paste'
                  ? 'bg-surface text-accent shadow-xs'
                  : 'text-muted hover:text-main'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Cách 1: Dán danh sách tên (Copy từ Excel / Word / Zalo)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('file')}
              className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'file'
                  ? 'bg-surface text-accent shadow-xs'
                  : 'text-muted hover:text-main'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Cách 2: Tải file Excel (.xlsx / .csv)</span>
            </button>
          </div>

          {/* TAB 1: PASTE TEXT */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-main flex items-center gap-1.5">
                  <span>Dán danh sách học sinh vào đây:</span>
                </span>
                <span className="text-[11px] text-muted">
                  Hỗ trợ: Họ và tên, Giới tính (Nam/Nữ), Tổ (1-4)
                </span>
              </div>

              <textarea
                value={pastedText}
                onChange={e => setPastedText(e.target.value)}
                placeholder={`Ví dụ dán từ cột Excel hoặc danh sách dạng:\n1. Nguyễn Văn An (Nam)\n2. Trần Thị Bình (Nữ)\n3. Lê Hoàng Long (Nam)\n4. Phạm Thu Hà (Nữ)\n...\n(Hoặc bôi đen copy từ bảng Excel rồi bấm Ctrl + V vào đây)`}
                rows={6}
                className="w-full p-3.5 rounded-2xl bg-surface-2 border border-token focus:border-accent focus:ring-2 focus:ring-accent/20 text-xs sm:text-sm font-mono text-main outline-none transition-all placeholder:text-muted/60 leading-relaxed"
              />

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="text-[11px] text-muted flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>Hệ thống tự động nhận diện Nam/Nữ và tự chia đều vào 4 tổ nếu không ghi chú.</span>
                </div>

                <button
                  type="button"
                  onClick={handleParsePastedText}
                  className="px-4 py-2 rounded-xl bg-accent text-on-accent text-xs font-bold shadow-xs hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Trích xuất danh sách học sinh</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: EXCEL FILE */}
          {activeTab === 'file' && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="p-8 border-2 border-dashed border-token hover:border-accent/60 bg-surface-2 hover:bg-surface-2/70 rounded-3xl flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Upload className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-main">
                  {fileName ? `File đã chọn: ${fileName}` : 'Bấm vào đây để chọn file Excel danh sách học sinh'}
                </h4>
                <p className="text-xs text-muted mt-1 max-w-sm">
                  Chấp nhận định dạng file: <strong>.xlsx</strong>, <strong>.xls</strong> hoặc <strong>.csv</strong> từ vnEdu, SMAS hoặc file riêng của Thầy.
                </p>
                {isProcessing && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-accent font-semibold">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-accent border-t-transparent" />
                    <span>Đang đọc dữ liệu bảng tính Excel...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2.5 animate-scale-up">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong>Lỗi nhập liệu:</strong> {errorMessage}
              </div>
            </div>
          )}

          {/* PREVIEW TABLE OF PARSED STUDENTS */}
          {parsedStudents.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-token animate-scale-up">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-black text-main flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-accent" />
                    <span>Danh sách nhận diện được ({totalCount} học sinh)</span>
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold">
                    <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 border border-blue-500/20">
                      Nam: {maleCount}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-pink-500/10 text-pink-600 border border-pink-500/20">
                      Nữ: {femaleCount}
                    </span>
                  </div>
                </div>

                {/* Import Mode Options */}
                <div className="flex items-center gap-1 p-0.5 bg-surface-2 rounded-xl border border-token text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setImportMode('replace')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      importMode === 'replace'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-muted hover:text-main'
                    }`}
                    title="Xóa 42 học sinh mẫu ảo và khởi tạo danh sách mới này"
                  >
                    Thay thế toàn bộ lớp (Khuyên dùng)
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMode('append')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      importMode === 'append'
                        ? 'bg-accent text-on-accent shadow-xs'
                        : 'text-muted hover:text-main'
                    }`}
                    title="Thêm tiếp vào sau danh sách hiện có"
                  >
                    Thêm vào danh sách cũ
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="max-h-64 overflow-y-auto border border-token rounded-2xl bg-surface-2/40 shadow-inner">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-surface-2 border-b border-token text-muted font-bold text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center">STT</th>
                      <th className="py-2.5 px-3">Họ và tên</th>
                      <th className="py-2.5 px-3 w-24 text-center">Giới tính</th>
                      <th className="py-2.5 px-3 w-24 text-center">Tổ</th>
                      <th className="py-2.5 px-3 w-24">Ngày sinh</th>
                      <th className="py-2.5 px-3 w-12 text-center">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-token/60 font-medium">
                    {parsedStudents.map((st, idx) => (
                      <tr key={idx} className="hover:bg-surface transition-colors">
                        <td className="py-2 px-3 text-center text-muted font-bold text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 font-bold text-main">
                          {st.hoTen}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleGender(idx)}
                            className={`px-2 py-0.5 rounded-md font-bold text-[11px] cursor-pointer transition-colors ${
                              st.gioiTinh === 'Nam'
                                ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20 hover:bg-blue-500/20'
                                : 'bg-pink-500/10 text-pink-600 border border-pink-500/20 hover:bg-pink-500/20'
                            }`}
                            title="Bấm để đổi Nam <-> Nữ"
                          >
                            {st.gioiTinh === 'Nam' ? '👦 Nam' : '👧 Nữ'}
                          </button>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <select
                            value={st.to}
                            onChange={e => handleChangeGroup(idx, Number(e.target.value) as 1 | 2 | 3 | 4)}
                            className="px-2 py-1 rounded-lg bg-surface border border-token text-xs font-bold text-main cursor-pointer"
                          >
                            <option value={1}>Tổ 1</option>
                            <option value={2}>Tổ 2</option>
                            <option value={3}>Tổ 3</option>
                            <option value={4}>Tổ 4</option>
                          </select>
                        </td>
                        <td className="py-2 px-3 text-muted text-[11px]">
                          {st.ngaySinh || '-'}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveDraftRow(idx)}
                            className="p-1 rounded-lg text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Xóa học sinh này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    Khi bấm xác nhận, hệ thống sẽ <strong>tự động tạo mã học sinh (HS01..HS{totalCount})</strong>, <strong>hiển thị tên học sinh</strong> và <strong>tự động xếp vào 4 dãy bàn ghế lớp học</strong> chuẩn mực.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-surface-2/60 border-t border-token flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-token hover:bg-surface text-xs font-bold text-muted hover:text-main transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            disabled={parsedStudents.length === 0}
            onClick={handleConfirmImport}
            className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-98"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Xác nhận nạp {parsedStudents.length} học sinh thật vào Lớp 10A5</span>
          </button>
        </div>
      </div>
    </div>
  );
};
