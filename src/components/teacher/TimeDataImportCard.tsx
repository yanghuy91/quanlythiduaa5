import React, { useState, useRef } from 'react';
import { 
  Calendar, 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Check, 
  X,
  FileText
} from 'lucide-react';
import { Student, DisciplineRecord, RuleItem } from '../../types';
import { findStudentInSeatingMaster } from '../../utils/seatingMaster';
import { findMatchingRule, classifySeverityByPoints } from '../../utils/emulation';

interface TimeDataImportCardProps {
  students: Student[];
  rules?: RuleItem[];
  onImportRecords: (records: DisciplineRecord[]) => void;
}

interface ParsedRow {
  id: string;
  ngayHoc: string;
  buoi: 'Sang' | 'Chieu';
  tuanHoc: number;
  maHS: string;
  hoTen: string;
  to: number;
  tenHanhVi: string;
  loaiDiem: 'Tru' | 'Cong';
  diemSo: number;
  nhomHanhVi: string;
  ghiChu?: string;
  isValid: boolean;
  error?: string;
}

export const TimeDataImportCard: React.FC<TimeDataImportCardProps> = ({
  students,
  rules,
  onImportRecords,
}) => {
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Download standard CSV template for teachers (pre-filled with Sơ đồ lớp student names)
  const handleDownloadTemplate = () => {
    const headers = 'NgayHoc,Buoi,TuanHoc,MaHS_HoTen,TenHanhVi,LoaiDiem,DiemSo,GhiChu\n';
    const stu1 = students[0]?.hoTen || 'Nguyễn Khắc Huy';
    const stu2 = students[1]?.hoTen || 'Võ Minh Quân';
    const stu3 = students[2]?.hoTen || 'Đỗ Thị Thu Trang';
    const sampleRows = [
      `2026-11-09,Sang,3,${stu1},Đi học muộn,Tru,2,Trễ 10 phút`,
      `2026-11-09,Chieu,3,${stu2},Sử dụng điện thoại trong giờ,Tru,5,Chơi game`,
      `2026-11-10,Sang,3,${stu3},Đạt điểm 10 kiểm tra miệng,Cong,2,Phát biểu xuất sắc`,
    ].join('\n');

    const blob = new Blob([headers + sampleRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Mau_Du_Lieu_Thoi_Gian_Thi_Dua_10A5.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse text / CSV content (Quy chiếu học sinh theo Sơ đồ lớp làm chuẩn)
  const parseCSVContent = (content: string, name: string) => {
    try {
      const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) {
        setErrorMsg('Tệp trống hoặc không đúng định dạng bảng dữ liệu.');
        return;
      }

      const rows: ParsedRow[] = [];
      const dataLines = lines.slice(1); // skip header line

      dataLines.forEach((line, index) => {
        const parts = line.split(/[,;\t]/).map(p => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length < 5) return;

        const [ngayHoc, buoiRaw, tuanRaw, studentIdentifier, tenHanhVi, loaiDiemRaw, diemSoRaw, ghiChu] = parts;

        const isDateValid = /^\d{4}-\d{2}-\d{2}$/.test(ngayHoc);
        const buoi: 'Sang' | 'Chieu' = buoiRaw?.toLowerCase().includes('chieu') ? 'Chieu' : 'Sang';
        const tuanHoc = parseInt(tuanRaw, 10) || 3;
        const loaiDiem: 'Tru' | 'Cong' = loaiDiemRaw?.toLowerCase().includes('cong') ? 'Cong' : 'Tru';
        const diemSo = Math.abs(parseInt(diemSoRaw, 10)) || 2;

        // Quy chiếu học sinh từ Sơ đồ lớp làm chuẩn
        const matchedStudent = findStudentInSeatingMaster(
          students,
          studentIdentifier,
          studentIdentifier
        );

        const isValid = isDateValid && !!matchedStudent && !!tenHanhVi;

        const todayStr = new Date().toISOString().split('T')[0];
        rows.push({
          id: `row-${index}`,
          ngayHoc: isDateValid ? ngayHoc : todayStr,
          buoi,
          tuanHoc,
          maHS: matchedStudent?.maHS || 'HS01',
          hoTen: matchedStudent?.hoTen || studentIdentifier || 'Chưa rõ',
          to: matchedStudent?.to || 1,
          tenHanhVi: tenHanhVi || 'Vi phạm nề nếp',
          loaiDiem,
          diemSo,
          nhomHanhVi: loaiDiem === 'Cong' ? 'Điểm cộng' : 'Nề nếp',
          ghiChu: ghiChu || '',
          isValid,
          error: !isDateValid
            ? 'Sai định dạng ngày (YYYY-MM-DD)'
            : !matchedStudent
            ? 'Không tìm thấy học sinh trên Sơ đồ lớp'
            : undefined,
        });
      });

      setFileName(name);
      setParsedRows(rows);
      setErrorMsg(null);
      setSuccessMsg(`Đã đọc & quy chiếu thành công ${rows.length} dòng dữ liệu theo Sơ đồ lớp từ ${name}!`);
    } catch {
      setErrorMsg('Lỗi đọc tệp. Vui lòng kiểm tra định dạng CSV UTF-8.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      parseCSVContent(content, file.name);
    };
    reader.readAsText(file);
  };

  // Confirm import into system
  const handleConfirmImport = () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      setErrorMsg('Không có dòng dữ liệu hợp lệ nào để nhập.');
      return;
    }

    const newRecords: DisciplineRecord[] = validRows.map(row => {
      const nowISO = new Date().toISOString();
      const matchedRule = findMatchingRule(rules, undefined, row.tenHanhVi, row.loaiDiem);
      const effectiveMucDo =
        matchedRule && Number(matchedRule.diemSo) === row.diemSo && matchedRule.mucDo
          ? matchedRule.mucDo
          : classifySeverityByPoints(row.diemSo, row.loaiDiem === 'Cong');
      return {
        maGhiNhan: `IMP-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        doiTuong: 'HocSinh',
        maHS: row.maHS,
        hoTen: row.hoTen,
        to: row.to,
        ngayHoc: row.ngayHoc,
        buoi: row.buoi,
        tuanHoc: row.tuanHoc,
        thang: parseInt(row.ngayHoc.split('-')[1], 10) || (new Date().getMonth() + 1),
        hocKi: (row.tuanHoc <= 19 ? 1 : 2) as 1 | 2,
        namHoc: '2026-2027',
        maNoiQuy: matchedRule?.maNoiQuy || (row.loaiDiem === 'Cong' ? 'NQ26' : 'NQ01'),
        nhomHanhVi: matchedRule?.nhomHanhVi || row.nhomHanhVi,
        tenHanhVi: row.tenHanhVi,
        mucDo: effectiveMucDo,
        diemSo: row.diemSo,
        loaiDiem: row.loaiDiem,
        ghiChu: row.ghiChu ? `[Nhập file ${fileName}] ${row.ghiChu}` : `[Nhập file ${fileName}]`,
        nguoiGhi: 'GVCN',
        vaiTroNguoiGhi: 'GV',
        nguonGhi: 'NhapTep',
        lanThuTrongBuoi: 1,
        daXacNhanTrung: false,
        trangThai: 'HieuLuc',
        thoiGianMayChu: nowISO,
        thoiGianMay: nowISO,
      };
    });

    onImportRecords(newRecords);
    setSuccessMsg(`✨ Đã nạp thành công ${newRecords.length} bản ghi theo mốc thời gian vào hệ thống thi đua!`);
    setParsedRows([]);
    setFileName(null);
  };

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-surface border border-token shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-token pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-main leading-tight flex items-center gap-2">
              <span>Nhập Dữ Liệu Thời Gian &amp; Lịch Thi Đua</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/15 text-accent">
                Dành cho GVCN
              </span>
            </h3>
            <p className="text-xs text-muted mt-0.5">
              Tải lên tệp CSV/Excel chứa dữ liệu nề nếp theo mốc Ngày, Buổi (Sáng/Chiều), Tuần học
            </p>
          </div>
        </div>

        {/* Download Template Button */}
        <button
          onClick={handleDownloadTemplate}
          className="px-3 py-1.5 rounded-xl border border-token bg-surface-2 hover:bg-surface text-xs font-semibold text-main flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-accent" />
          <span>Tải tệp mẫu (.CSV)</span>
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv, .txt, text/csv, application/vnd.ms-excel"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Dropzone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              parseCSVContent(event.target?.result as string, file.name);
            };
            reader.readAsText(file);
          }
        }}
        className="p-5 rounded-2xl border-2 border-dashed border-token/80 hover:border-accent bg-surface-2/40 hover:bg-accent/5 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer text-center"
      >
        <Upload className="w-6 h-6 text-accent animate-pulse" />
        <div>
          <span className="text-xs font-bold text-main block">
            {fileName ? `Tệp đã chọn: ${fileName}` : 'Chạm hoặc kéo thả tệp CSV / Excel vào đây'}
          </span>
          <span className="text-[11px] text-muted">
            Hỗ trợ cột: Ngày (YYYY-MM-DD), Buổi, Tuần, Mã/Tên HS, Hành vi, Điểm
          </span>
        </div>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-[var(--st-bad)]/10 text-[var(--st-bad)] text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Preview Table if rows parsed */}
      {parsedRows.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-main">
              Xem trước dữ liệu ({parsedRows.filter(r => r.isValid).length}/{parsedRows.length} dòng hợp lệ):
            </span>
            <button
              onClick={() => {
                setParsedRows([]);
                setFileName(null);
              }}
              className="text-muted hover:text-main text-[11px] underline"
            >
              Hủy xem trước
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto rounded-xl border border-token">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-2 text-muted border-b border-token sticky top-0">
                <tr>
                  <th className="p-2">Thời gian</th>
                  <th className="p-2">Học sinh</th>
                  <th className="p-2">Hành vi</th>
                  <th className="p-2">Điểm</th>
                  <th className="p-2">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-token">
                {parsedRows.map(row => (
                  <tr key={row.id} className={row.isValid ? 'bg-surface' : 'bg-red-500/5'}>
                    <td className="p-2 font-mono text-[11px]">
                      {row.ngayHoc} · {row.buoi === 'Sang' ? 'Sáng' : 'Chiều'} (T{row.tuanHoc})
                    </td>
                    <td className="p-2 font-semibold">
                      {row.hoTen}
                    </td>
                    <td className="p-2 truncate max-w-[140px]" title={row.tenHanhVi}>
                      {row.tenHanhVi}
                    </td>
                    <td className="p-2 font-bold">
                      <span className={row.loaiDiem === 'Cong' ? 'text-emerald-500' : 'text-red-500'}>
                        {row.loaiDiem === 'Cong' ? `+${row.diemSo}` : `-${row.diemSo}`}
                      </span>
                    </td>
                    <td className="p-2 text-[11px]">
                      {row.isValid ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Hợp lệ
                        </span>
                      ) : (
                        <span className="text-red-500 font-bold flex items-center gap-1" title={row.error}>
                          <X className="w-3.5 h-3.5" /> {row.error}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Confirm Button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleConfirmImport}
              className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:opacity-95 shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Xác nhận nạp {parsedRows.filter(r => r.isValid).length} bản ghi vào hệ thống</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
