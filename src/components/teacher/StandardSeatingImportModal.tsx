import React, { useState, useMemo } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Sparkles, 
  HelpCircle, 
  AlertTriangle, 
  Save, 
  RefreshCw, 
  FileText,
  DoorOpen,
  Presentation,
  CheckCircle2
} from 'lucide-react';
import { 
  AI_SEATING_PROMPT_GUIDE, 
  parseStandardSeatingInput, 
  convertParsedItemsToSeatingState 
} from '../../utils/aiSeatingPrompt';
import { Student, SeatLayoutNode } from '../../types';

interface StandardSeatingImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingStudents: Student[];
  onApplyStandardSeating: (newStudents: Student[], newLayout: SeatLayoutNode[]) => Promise<void> | void;
}

const SAMPLE_SEATING_TEXT = `| STT | Họ và tên | Vị trí |
| 1 | Phạm Xuân An | Tổ 2 - Bàn 1 - Phải |
| 2 | Nguyễn Hà Hoàng Anh | Tổ 3 - Bàn 1 - Phải |
| 3 | Quách Gia Bảo | Tổ 1 - Bàn 1 - Trái |
| 4 | Nguyễn Ngọc Minh Châu | Tổ 4 - Bàn 1 - Phải |
| 5 | Nguyễn Tấn Cường | Tổ 1 - Bàn 1 - Phải |
| 6 | Đỗ Thành Đạt | Tổ 4 - Bàn 6 - Trái |
| 7 | Lê Minh Đạt | Tổ 3 - Bàn 1 - Trái |
| 8 | Phan Tiến Đạt | Tổ 4 - Bàn 1 - Trái |
| 9 | Nguyễn Hoàng Gia Hân | Tổ 3 - Bàn 1 - Trái |
| 10 | Bùi Thị Diệu Hiền | Tổ 1 - Bàn 3 - Phải |
| 11 | Nguyễn Thị Kim Hoa | Tổ 4 - Bàn 2 - Trái |
| 12 | Nguyễn Đoàn Khánh Huyền | Tổ 1 - Bàn 3 - Trái |
| 13 | Trần Thị Diệu Huyền | Tổ 3 - Bàn 2 - Trái |
| 14 | Võ Nguyễn Quỳnh Hương | Tổ 4 - Bàn 4 - Trái |
| 15 | Huỳnh Nguyễn Duy Khang | Tổ 3 - Bàn 6 - Trái |
| 16 | Huỳnh Ngọc Đăng Khoa | Tổ 1 - Bàn 5 - Phải |
| 17 | Nguyễn Minh Khôi | Tổ 1 - Bàn 4 - Trái |
| 18 | Võ Đức Kiên | Tổ 3 - Bàn 4 - Trái |
| 19 | Trần Vĩnh Kỳ | Tổ 3 - Bàn 4 - Phải |
| 20 | Nguyễn Thị Diệu Linh | Tổ 1 - Bàn 5 - Trái |
| 21 | Nguyễn Thị Kiều Ly | Tổ 4 - Bàn 1 - Phải |
| 22 | Bùi Gia Mẫn | Tổ 3 - Bàn 2 - Phải |
| 23 | Bùi Thị Diệu My | Tổ 3 - Bàn 2 - Trái |
| 24 | Nguyễn Hải Nam | Tổ 4 - Bàn 2 - Phải |
| 25 | Nguyễn Huỳnh Ánh Nguyệt | Tổ 3 - Bàn 5 - Trái |
| 26 | Nguyễn Thị Tuyết Nhung | Tổ 3 - Bàn 5 - Phải |
| 27 | Lê Huỳnh Ý Như | Tổ 3 - Bàn 4 - Phải |
| 28 | Phạm Huỳnh Trà Oanh | Tổ 4 - Bàn 5 - Trái |
| 29 | Nguyễn Thị Ái Phương | Tổ 3 - Bàn 4 - Trái |
| 30 | Nguyễn Thị Diễm Quỳnh | Tổ 3 - Bàn 3 - Phải |
| 31 | Lê Thị Thu Tâm | Tổ 3 - Bàn 3 - Trái |
| 32 | Nguyễn Thanh Tân | Tổ 3 - Bàn 6 - Phải |
| 33 | Nguyễn Duy Thắng | Tổ 3 - Bàn 3 - Phải |
| 34 | Trịnh Quốc Thắng | Tổ 4 - Bàn 4 - Phải |
| 35 | Lê Hoài Thương | Tổ 1 - Bàn 4 - Phải |
| 36 | Lê Hữu Tiến | Tổ 4 - Bàn 5 - Phải |
| 37 | Nguyễn Hữu Tiến | Tổ 4 - Bàn 3 - Trái |
| 38 | Đỗ Ngọc Bảo Trâm | Tổ 3 - Bàn 3 - Trái |
| 39 | Lê Thị Huyền Trang | Tổ 2 - Bàn 5 - Phải |
| 40 | Bùi Thị Thanh Tuyền | Tổ 3 - Bàn 2 - Phải |
| 41 | Huỳnh Thị Thùy Vy | Tổ 4 - Bàn 3 - Phải |
| 42 | Nguyễn Thị Tường Vy | Tổ 1 - Bàn 2 - Phải |`;

export const StandardSeatingImportModal: React.FC<StandardSeatingImportModalProps> = ({
  isOpen,
  onClose,
  existingStudents,
  onApplyStandardSeating,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [showPromptGuide, setShowPromptGuide] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Phân tích kết quả thời gian thực
  const parsedResult = useMemo(() => {
    return parseStandardSeatingInput(inputText);
  }, [inputText]);

  // Tạo preview layout và danh sách học sinh
  const previewState = useMemo(() => {
    if (parsedResult.items.length === 0) return null;
    return convertParsedItemsToSeatingState(parsedResult.items, existingStudents);
  }, [parsedResult.items, existingStudents]);

  if (!isOpen) return null;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(AI_SEATING_PROMPT_GUIDE);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  const handleFillSample = () => {
    setInputText(SAMPLE_SEATING_TEXT);
  };

  const handleApply = async () => {
    if (!previewState || previewState.students.length === 0) return;
    try {
      setIsSaving(true);
      await onApplyStandardSeating(previewState.students, previewState.layout);
      onClose();
    } catch (err) {
      console.error('Lỗi khi áp dụng sơ đồ chuẩn:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
      <div 
        className="w-full max-w-5xl bg-surface border border-token rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between gap-3 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-xs shrink-0">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black leading-tight tracking-tight">
                  Nhập Dữ Liệu Chuẩn Từ Sơ Đồ Lớp
                </h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 uppercase tracking-wider">
                  Chuẩn Gốc 3 Cột
                </span>
              </div>
              <p className="text-xs text-white/85 mt-0.5">
                Chỉ cần 3 thông tin: <strong>STT · Họ và tên · Vị trí</strong> (Tổ - Bàn - Ghế). Hệ thống tự động quy chiếu và khóa lưu Cloud!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar / AI Prompt Trigger */}
        <div className="px-4 py-2.5 bg-surface-2 border-b border-token flex items-center justify-between gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyPrompt}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 ${
                copiedPrompt
                  ? 'bg-emerald-600 text-white'
                  : 'bg-primary text-on-primary hover:opacity-90'
              }`}
            >
              {copiedPrompt ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPrompt ? 'Đã sao chép Prompt AI!' : 'Sao chép Prompt AI (Chống ngược hướng)'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPromptGuide(!showPromptGuide)}
              className="px-2.5 py-1.5 rounded-xl border border-token hover:bg-surface text-muted hover:text-main flex items-center gap-1 cursor-pointer transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-accent" />
              <span>{showPromptGuide ? 'Ẩn hướng dẫn' : 'Xem hướng dẫn mốc phòng học'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFillSample}
              className="px-2.5 py-1.5 rounded-xl border border-token hover:bg-surface text-muted hover:text-main text-[11px] font-semibold cursor-pointer"
            >
              Dán dữ liệu mẫu
            </button>
            {inputText && (
              <button
                type="button"
                onClick={() => setInputText('')}
                className="px-2 py-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-[11px] font-bold cursor-pointer"
              >
                Xóa hết
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Prompt Guide Box */}
        {showPromptGuide && (
          <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-900/50 text-xs text-blue-950 dark:text-blue-100 animate-slide-down space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
              <DoorOpen className="w-4 h-4" />
              <span>Quy ước mốc phòng học 10A5 để AI không bao giờ bị ngược:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-blue-200/60 dark:border-blue-800/60">
                <div className="font-black text-rose-600 dark:text-rose-400">🚪 Dãy 1 (Tổ 1) - Bên Phải</div>
                <div className="text-muted mt-0.5">Sát <strong>CỬA CHÍNH</strong> ra vào lớp học</div>
              </div>
              <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-blue-200/60 dark:border-blue-800/60">
                <div className="font-black text-emerald-600 dark:text-emerald-400">📋 Dãy 2 (Tổ 2)</div>
                <div className="text-muted mt-0.5">Dãy giữa phía bên phải</div>
              </div>
              <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-blue-200/60 dark:border-blue-800/60">
                <div className="font-black text-purple-600 dark:text-purple-400">📋 Dãy 3 (Tổ 3)</div>
                <div className="text-muted mt-0.5">Dãy giữa phía bên trái</div>
              </div>
              <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-blue-200/60 dark:border-blue-800/60">
                <div className="font-black text-amber-600 dark:text-amber-400">🧑‍🏫 Dãy 4 (Tổ 4) - Bên Trái</div>
                <div className="text-muted mt-0.5">Sát <strong>BÀN GIÁO VIÊN</strong></div>
              </div>
            </div>
            <p className="text-[11px] text-muted leading-relaxed">
              💡 <strong>Cách làm:</strong> Bấm nút <em>"Sao chép Prompt AI"</em> $\rightarrow$ Dán vào <strong>ChatGPT hoặc Gemini</strong> $\rightarrow$ Kèm ảnh chụp sơ đồ lớp. Khi AI xuất bảng 3 cột, Thầy chỉ cần copy và dán vào ô bên dưới!
            </p>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Cột trái: Textarea nhập liệu */}
            <div className="lg:col-span-5 flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-main flex items-center gap-1.5 uppercase tracking-wider">
                  <FileText className="w-3.5 h-3.5 text-accent" />
                  <span>Dán bảng kết quả 3 cột từ AI / Excel</span>
                </label>
                <span className="text-[11px] font-bold text-accent">
                  {parsedResult.totalValid} học sinh hợp lệ
                </span>
              </div>

              <textarea
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder={`Dán bảng kết quả 3 cột vào đây, ví dụ:\n\n| STT | Họ và tên | Vị trí |\n| 1 | Phạm Xuân An | Tổ 2 - Bàn 1 - Phải |\n| 2 | Nguyễn Hà Hoàng Anh | Tổ 3 - Bàn 1 - Phải |\n| 3 | Quách Gia Bảo | Tổ 1 - Bàn 1 - Trái |`}
                rows={16}
                className="w-full p-3 rounded-2xl bg-surface-2 border border-token text-xs font-mono leading-relaxed text-main placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none shadow-inner"
              />

              {/* Lỗi cảnh báo nếu có */}
              {parsedResult.duplicateSeats.length > 0 && (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Cảnh báo trùng vị trí ghế:</div>
                    <div className="text-[11px]">{parsedResult.duplicateSeats.join(', ')}</div>
                  </div>
                </div>
              )}

              {parsedResult.invalidLines.length > 0 && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Dòng chưa đúng định dạng ({parsedResult.invalidLines.length}):</span>
                  </div>
                  <div className="text-[11px] max-h-24 overflow-y-auto space-y-0.5">
                    {parsedResult.invalidLines.slice(0, 5).map((err, i) => (
                      <div key={i} className="truncate">• {err}</div>
                    ))}
                    {parsedResult.invalidLines.length > 5 && (
                      <div className="italic">...và {parsedResult.invalidLines.length - 5} dòng khác</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Cột phải: Xem trước trực quan Sơ đồ lớp */}
            <div className="lg:col-span-7 flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-main flex items-center gap-1.5 uppercase tracking-wider">
                  <Presentation className="w-3.5 h-3.5 text-accent" />
                  <span>Xem trước trực quan phòng học 10A5</span>
                </label>
                <div className="text-[11px] text-muted flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Có chỗ
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-surface-2 border border-token inline-block"></span> Trống
                  </span>
                </div>
              </div>

              {/* Lưới sơ đồ lớp 4 Tổ x 6 Bàn */}
              <div className="p-3 rounded-2xl bg-surface-2 border border-token space-y-2.5 shadow-inner">
                {/* Hàng 0: Bàn GV (Trái) & Cửa chính (Phải) */}
                <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-black pb-2 border-b border-token">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-700 dark:text-amber-300">
                    🧑‍🏫 Bàn GV
                  </div>
                  <div className="col-span-2 p-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300">
                    BẢNG LỚP 10A5
                  </div>
                  <div className="p-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-700 dark:text-rose-300">
                    🚪 Cửa chính
                  </div>
                </div>

                {/* Tiêu đề 4 Tổ */}
                <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-black">
                  <div className="text-amber-600 dark:text-amber-400">TỔ 4 (Dãy 4)</div>
                  <div className="text-purple-600 dark:text-purple-400">TỔ 3 (Dãy 3)</div>
                  <div className="text-emerald-600 dark:text-emerald-400">TỔ 2 (Dãy 2)</div>
                  <div className="text-rose-600 dark:text-rose-400">TỔ 1 (Dãy 1)</div>
                </div>

                {/* 6 Hàng bàn */}
                <div className="space-y-1.5">
                  {[1, 2, 3, 4, 5, 6].map(row => (
                    <div key={row} className="grid grid-cols-4 gap-2">
                      {[4, 3, 2, 1].map(group => {
                        // Tổ 4: Cột 0, 1; Tổ 3: Cột 3, 4; Tổ 2: Cột 6, 7; Tổ 1: Cột 9, 10
                        const cotTrai = group === 4 ? 0 : group === 3 ? 3 : group === 2 ? 6 : 9;
                        const cotPhai = group === 4 ? 1 : group === 3 ? 4 : group === 2 ? 7 : 10;

                        const studentTrai = previewState?.layout.find(n => n.hang === row && n.cot === cotTrai)?.maHS;
                        const studentPhai = previewState?.layout.find(n => n.hang === row && n.cot === cotPhai)?.maHS;

                        const nameTrai = previewState?.students.find(s => s.maHS === studentTrai)?.hoTen;
                        const namePhai = previewState?.students.find(s => s.maHS === studentPhai)?.hoTen;

                        return (
                          <div 
                            key={group} 
                            className="p-1.5 rounded-xl bg-surface border border-token grid grid-cols-2 gap-1 text-[10px] shadow-2xs hover:border-accent transition-colors"
                          >
                            {/* Ghế trái */}
                            <div 
                              className={`p-1 rounded-lg text-center truncate ${
                                nameTrai 
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-bold border border-emerald-200 dark:border-emerald-800/50' 
                                  : 'bg-surface-2 text-muted/60 border border-dashed border-token'
                              }`}
                              title={nameTrai ? `${nameTrai} (Tổ ${group} - Bàn ${row} - Trái)` : `Tổ ${group} - Bàn ${row} - Ghế Trái (Trống)`}
                            >
                              {nameTrai ? nameTrai.split(' ').slice(-2).join(' ') : '—'}
                            </div>

                            {/* Ghế phải */}
                            <div 
                              className={`p-1 rounded-lg text-center truncate ${
                                namePhai 
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-bold border border-emerald-200 dark:border-emerald-800/50' 
                                  : 'bg-surface-2 text-muted/60 border border-dashed border-token'
                              }`}
                              title={namePhai ? `${namePhai} (Tổ ${group} - Bàn ${row} - Phải)` : `Tổ ${group} - Bàn ${row} - Ghế Phải (Trống)`}
                            >
                              {namePhai ? namePhai.split(' ').slice(-2).join(' ') : '—'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                <div className="text-center text-[10px] text-muted pt-1 border-t border-token/50">
                  — CUỐI PHÒNG HỌC LỚP 10A5 —
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-surface-2 border-t border-token flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-muted">
            {parsedResult.totalValid > 0 ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                Sẵn sàng áp dụng {parsedResult.totalValid} học sinh vào sơ đồ chuẩn
              </span>
            ) : (
              <span>Vui lòng dán dữ liệu 3 cột để hệ thống tự động phân tích.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl border border-token text-xs font-bold text-muted hover:text-main hover:bg-surface transition-colors cursor-pointer"
            >
              Hủy
            </button>

            <button
              type="button"
              onClick={handleApply}
              disabled={isSaving || parsedResult.totalValid === 0}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-extrabold shadow-md flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang lưu lên Firebase...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Áp Dụng &amp; Khóa Lưu Đám Mây (Firebase)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
