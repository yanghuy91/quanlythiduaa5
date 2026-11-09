import React, { useState } from 'react';
import { 
  Sparkles, 
  Move, 
  ArrowRightLeft, 
  CheckCircle2, 
  FileText, 
  Download, 
  RefreshCw, 
  AlertTriangle, 
  Upload, 
  Layers, 
  Check, 
  ShieldCheck, 
  Users 
} from 'lucide-react';
import { Student, SeatLayoutNode, ViolationRecord } from '../../types';
import { optimizeSeatingWithAI, SeatingOptimizationResult, analyzeAndExtractClassDataAI } from '../../services/geminiService';

interface AiDataBridgeSectionProps {
  students: Student[];
  layout: SeatLayoutNode[];
  records: ViolationRecord[];
  currentWeek: number;
  onUpdateLayout: (newLayout: SeatLayoutNode[], updatedStudents: Student[]) => void;
  onOpenLayoutTab: () => void;
}

export const AiDataBridgeSection: React.FC<AiDataBridgeSectionProps> = ({
  students,
  layout,
  records,
  currentWeek,
  onUpdateLayout,
  onOpenLayoutTab,
}) => {
  // Seating Optimization States
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<SeatingOptimizationResult | null>(null);
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);

  // Raw Seating File Bridge States
  const [rawSeatingText, setRawSeatingText] = useState('');
  const [isAnalyzingFile, setIsAnalyzingFile] = useState(false);
  const [fileAnalysisResult, setFileAnalysisResult] = useState<any | null>(null);
  const [pushedFileNotice, setPushedFileNotice] = useState<string | null>(null);

  // 1. Analyze and optimize seating with AI
  const handleAnalyzeSeating = async () => {
    setIsOptimizing(true);
    setOptimizationResult(null);
    setAppliedNotice(null);

    try {
      // Prepare current seats data
      const currentSeats = layout
        .filter(node => node.loaiO === 'ghe')
        .map(node => {
          const student = students.find(s => s.maHS === node.maHS);
          return {
            deskId: `b_${node.hang}_${node.cot}`,
            seatNumber: node.hang * 10 + node.cot,
            studentId: node.maHS,
            studentName: student?.hoTen,
            row: node.hang,
            col: node.cot,
          };
        });

      // Prepare recent violations
      const vMap: Record<string, { hoTen: string; count: number; loi: string }> = {};
      records.filter(r => r.trangThai !== 'DaHuy').forEach(r => {
        if (!vMap[r.maHS]) {
          vMap[r.maHS] = { hoTen: r.hoTen, count: 0, loi: r.tenHanhVi };
        }
        vMap[r.maHS].count += 1;
      });

      const recentViolations = Object.values(vMap).map(v => ({
        hoTen: v.hoTen,
        tenHanhVi: v.loi,
        soLan: v.count,
      }));

      const result = await optimizeSeatingWithAI({
        students: students.map(s => ({ maHS: s.maHS, hoTen: s.hoTen, to: s.to, gioiTinh: s.gioiTinh || 'Nam' })),
        currentSeats,
        recentViolations,
      });

      setOptimizationResult(result);
    } catch (err: any) {
      alert('Lỗi khi phân tích sơ đồ lớp bằng AI: ' + err.message);
    } finally {
      setIsOptimizing(false);
    }
  };

  // 2. Apply proposed swaps into current layout
  const handleApplySwaps = () => {
    if (!optimizationResult || !optimizationResult.swaps || optimizationResult.swaps.length === 0) {
      alert('Không có phương án hoán đổi nào để áp dụng.');
      return;
    }

    const newLayout = [...layout];
    const newStudents = [...students];
    let swapCount = 0;

    optimizationResult.swaps.forEach(swap => {
      const stA = newStudents.find(s => s.hoTen.toLowerCase().includes(swap.studentA.toLowerCase()) || swap.studentA.toLowerCase().includes(s.hoTen.toLowerCase()));
      const stB = newStudents.find(s => s.hoTen.toLowerCase().includes(swap.studentB.toLowerCase()) || swap.studentB.toLowerCase().includes(s.hoTen.toLowerCase()));

      if (stA && stB) {
        const nodeAIndex = newLayout.findIndex(n => n.maHS === stA.maHS);
        const nodeBIndex = newLayout.findIndex(n => n.maHS === stB.maHS);

        if (nodeAIndex !== -1 && nodeBIndex !== -1) {
          // Swap maHS in layout nodes
          const temp = newLayout[nodeAIndex].maHS;
          newLayout[nodeAIndex] = { ...newLayout[nodeAIndex], maHS: newLayout[nodeBIndex].maHS };
          newLayout[nodeBIndex] = { ...newLayout[nodeBIndex], maHS: temp };
          swapCount++;
        }
      }
    });

    if (swapCount > 0) {
      onUpdateLayout(newLayout, newStudents);
      setAppliedNotice(`Đã áp dụng thành công ${swapCount} cặp hoán đổi vào Sơ đồ lớp! Dữ liệu đã được lưu.`);
    } else {
      setAppliedNotice('AI đã đưa ra lời khuyên tối ưu, không có vị trí nào cần cưỡng chế đổi chỗ.');
    }
  };

  // 3. Export Seating Plan to Word (.doc)
  const handleExportSeatingPlanDoc = () => {
    const docContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>Kế Hoạch Sắp Xếp Chỗ Ngồi Lớp 10A5</title></head>
<body style="font-family: Arial, sans-serif; padding: 20px;">
  <h2 style="text-align: center; color: #1e3a8a;">KẾ HOẠCH SẮP XẾP CHỖ NGỒI VÀ TỐI ƯU NỀ NẾP LỚP 10A5</h2>
  <p style="text-align: center;"><strong>Trường THPT Số 2 Đức Phổ · Năm học 2026-2027</strong></p>
  <hr/>
  <h3>1. Đánh giá tổng quan từ Trợ lý AI:</h3>
  <p>${optimizationResult?.reasoning || 'Đã phân tích toàn diện ma trận chỗ ngồi và lịch sử nề nếp.'}</p>
  
  <h3>2. Phương án điều chỉnh chỗ ngồi đề xuất:</h3>
  <ul>
    ${(optimizationResult?.swaps || []).map(s => `<li><strong>${s.studentA}</strong> ⇆ <strong>${s.studentB}</strong>: ${s.reason}</li>`).join('')}
  </ul>

  <h3>3. Khuyến nghị sư phạm:</h3>
  <p>${optimizationResult?.newLayoutSuggestions || 'Duy trì trật tự và khuyến khích học sinh thi đua.'}</p>
</body>
</html>
    `;

    const blob = new Blob([docContent], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ke_Hoach_Cho_Ngoi_10A5_Tuan_${currentWeek}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 4. Raw text parsing for seating file bridge
  const handleAnalyzeSeatingFile = async () => {
    if (!rawSeatingText.trim()) {
      alert('Vui lòng dán nội dung file sơ đồ lớp vào ô.');
      return;
    }

    setIsAnalyzingFile(true);
    setFileAnalysisResult(null);
    setPushedFileNotice(null);

    try {
      const res = await analyzeAndExtractClassDataAI(rawSeatingText);
      setFileAnalysisResult(res);
    } catch (err: any) {
      alert('Lỗi phân tích file sơ đồ: ' + err.message);
    } finally {
      setIsAnalyzingFile(false);
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-surface border border-token shadow-xs space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-token pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center text-lg shrink-0">
            🪑
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-main flex items-center gap-2">
              <span>Liên Kết Dữ Liệu Sơ Đồ Lớp &amp; Nề Nếp Với AI</span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-600 text-white uppercase">
                2 Chiều
              </span>
            </h4>
            <p className="text-xs text-muted">
              Phân tích dữ liệu sơ đồ lớp bằng AI rồi đẩy thẳng vào hệ thống, hoặc tối ưu đổi chỗ ngồi tự động.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenLayoutTab}
          className="px-3 py-1.5 rounded-xl bg-surface-2 hover:bg-surface-3 border border-token text-main text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <Move className="w-3.5 h-3.5 text-accent" />
          <span>Xem Sơ đồ lớp hiện tại</span>
        </button>
      </div>

      {/* Feature 1: Intelligent Seating Optimizer based on live data */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/5 to-indigo-500/5 border border-purple-500/20 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h5 className="text-xs font-bold text-main flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>1. Tối Ưu Hóa Chỗ Ngồi Bằng AI (Dựa Trên Lịch Sử Vi Phạm &amp; Năng Lực)</span>
            </h5>
            <p className="text-[11px] text-muted mt-0.5">
              AI đọc sơ đồ 42 ghế và các lượt ghi nhận vi phạm để tìm ra vị trí gây mất trật tự và gợi ý hoán đổi.
            </p>
          </div>

          <button
            type="button"
            disabled={isOptimizing}
            onClick={handleAnalyzeSeating}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0"
          >
            {isOptimizing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>AI Đang Phân Tích Chỗ Ngồi...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Phân Tích Sơ Đồ &amp; Đề Xuất Đổi Chỗ</span>
              </>
            )}
          </button>
        </div>

        {/* Results of optimization */}
        {optimizationResult && (
          <div className="p-3.5 rounded-xl bg-surface border border-token space-y-3 animate-fade-in text-xs">
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-900 dark:text-purple-200 font-medium leading-relaxed">
              <strong>💡 Phân tích sư phạm:</strong> {optimizationResult.reasoning}
            </div>

            {optimizationResult.swaps && optimizationResult.swaps.length > 0 ? (
              <div className="space-y-2">
                <span className="font-bold text-main block">Phương án hoán đổi đề xuất ({optimizationResult.swaps.length} cặp):</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {optimizationResult.swaps.map((s, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-surface-2 border border-token flex items-start gap-2">
                      <ArrowRightLeft className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="font-bold text-main flex items-center gap-1.5">
                          <span className="text-accent">{s.studentA}</span>
                          <span>⇆</span>
                          <span className="text-purple-600">{s.studentB}</span>
                        </div>
                        <p className="text-[11px] text-muted mt-0.5">{s.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-muted italic">
                Sơ đồ chỗ ngồi hiện tại đã khá tối ưu, không phát hiện cụm mất trật tự nghiêm trọng.
              </div>
            )}

            {/* Action buttons: Push to seating & Export Doc */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-token flex-wrap">
              <button
                type="button"
                onClick={handleExportSeatingPlanDoc}
                className="px-3 py-1.5 rounded-xl bg-surface-2 hover:bg-surface-3 border border-token text-main text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Xuất kế hoạch (.doc)</span>
              </button>

              <button
                type="button"
                onClick={handleApplySwaps}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <Check className="w-3.5 h-3.5" />
                <span>⚡ Áp Dụng Hoán Đổi Vào Sơ Đồ Lớp Ngay</span>
              </button>
            </div>

            {appliedNotice && (
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{appliedNotice}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Feature 2: Bridge raw file/text into Seating Chart */}
      <div className="p-4 rounded-2xl bg-surface-2 border border-token space-y-3">
        <div>
          <h5 className="text-xs font-bold text-main flex items-center gap-1.5">
            <Upload className="w-4 h-4 text-accent" />
            <span>2. Đọc File / Văn Bản Sơ Đồ Lớp Bằng AI &amp; Đẩy Vào Sơ Đồ</span>
          </h5>
          <p className="text-[11px] text-muted mt-0.5">
            Dán sơ đồ lớp dạng bảng từ Word/Excel hoặc ghi chú bàn ghế. AI tự động tách tọa độ và học sinh.
          </p>
        </div>

        <textarea
          rows={3}
          value={rawSeatingText}
          onChange={e => setRawSeatingText(e.target.value)}
          placeholder="Ví dụ dán: Bàn 1: Huy, Nam. Bàn 2: Linh, Mai. Hoặc dán bảng danh sách chỗ ngồi từ văn bản..."
          className="w-full p-2.5 bg-surface border border-token rounded-xl text-xs text-main placeholder:text-muted font-mono"
        />

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[11px] text-muted">AI sẽ tự nhận diện và kết nối với Sơ đồ lớp</span>

          <button
            type="button"
            disabled={isAnalyzingFile || !rawSeatingText.trim()}
            onClick={handleAnalyzeSeatingFile}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95"
          >
            {isAnalyzingFile ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Đang phân tích cấu trúc...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Phân Tích &amp; Chuẩn Bị Đẩy Vào Sơ Đồ</span>
              </>
            )}
          </button>
        </div>

        {fileAnalysisResult && (
          <div className="p-3 rounded-xl bg-surface border border-token space-y-2 text-xs animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="font-bold text-main">Đã phân tích xong nội dung:</span>
              <button
                type="button"
                onClick={() => {
                  onOpenLayoutTab();
                  setPushedFileNotice('Đã chuyển tới Sơ đồ lớp để Thầy áp dụng!');
                }}
                className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold cursor-pointer hover:bg-emerald-700"
              >
                🚀 Đẩy Vào Sơ Đồ Lớp
              </button>
            </div>
            <p className="text-muted">{fileAnalysisResult.summary}</p>
            {pushedFileNotice && (
              <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-600 font-bold">
                {pushedFileNotice}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
