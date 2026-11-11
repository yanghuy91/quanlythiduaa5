/**
 * Utility to generate and download a standalone, printable HTML report of Class 10A5
 * Quản lý Nề nếp & Thi đua Lớp học 10A5 - THPT Số 2 Đức Phổ
 */
import { Student, StudentWeekSummary, DisciplineRecord } from '../types';
import { calculateDenseRankings } from './emulation';

export function exportClassroomHtmlReport(
  students: Student[],
  studentSummaries: Record<string, StudentWeekSummary>,
  currentWeek: number,
  records: DisciplineRecord[]
) {
  const rankedStudents = calculateDenseRankings(
    students.map(student => ({
      student,
      score: studentSummaries[student.maHS]?.diemHienTai ?? 100,
      deductions: studentSummaries[student.maHS]?.tongDiemTru ?? 0,
      bonuses: studentSummaries[student.maHS]?.tongDiemCong ?? 0,
    })),
    item => item.score,
    item => item.deductions,
    item => item.bonuses
  );
  const sortedStudents = rankedStudents.map(r => r.student);
  const rankMap = new Map<string, number>();
  rankedStudents.forEach(r => rankMap.set(r.student.maHS, r.officialRank));

  const weekRecords = records.filter(r => r.tuanHoc === currentWeek && r.trangThai !== 'DaHuy');

  const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Báo cáo Thi đua Lớp 10A5 - Tuần ${currentWeek}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 24px;
      color: #1e293b;
      background-color: #f8fafc;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      padding: 32px;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      text-transform: uppercase;
      color: #0f172a;
    }
    .header h2 {
      margin: 4px 0 0;
      font-size: 15px;
      font-weight: 600;
      color: #475569;
    }
    .header p {
      margin: 6px 0 0;
      font-size: 13px;
      color: #64748b;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: #f1f5f9;
      padding: 12px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-value {
      font-size: 20px;
      font-weight: bold;
      color: #0284c7;
    }
    .stat-label {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 12px;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 8px 10px;
      text-align: left;
    }
    th {
      background-color: #f8fafc;
      font-weight: bold;
      color: #334155;
    }
    tr:nth-child(even) {
      background-color: #f8fafc;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: bold;
    }
    .badge-tot { background: #dcfce7; color: #15803d; }
    .badge-kha { background: #e0f2fe; color: #0369a1; }
    .badge-dat { background: #fef9c3; color: #a16207; }
    .badge-chuadat { background: #fee2e2; color: #b91c1c; }
    .footer {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
      padding-top: 20px;
    }
    .signature {
      text-align: center;
      width: 200px;
    }
    .signature-title {
      font-weight: bold;
      font-size: 13px;
      margin-bottom: 60px;
    }
    .signature-name {
      font-weight: 600;
      font-size: 13px;
    }
    .print-btn {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #0284c7;
      color: white;
      border: none;
      padding: 10px 18px;
      border-radius: 8px;
      font-weight: bold;
      font-size: 13px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(2, 132, 199, 0.4);
    }
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; padding: 0; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>SỞ GD&ĐT QUẢNG NGÃI — THPT SỐ 2 ĐỨC PHỔ</h2>
      <h1>BÁO CÁO THI ĐUA LỚP 10A5</h1>
      <p>Năm học 2026 - 2027 · Tuần ${currentWeek} · Tổng số: 42 học sinh</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">42</div>
        <div class="stat-label">Sĩ số lớp</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${sortedStudents.filter(s => (studentSummaries[s.maHS]?.diemHienTai ?? 100) >= 90).length}</div>
        <div class="stat-label">Loại Tốt (≥ 90đ)</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${weekRecords.length}</div>
        <div class="stat-label">Lượt ghi nề nếp</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">100đ</div>
        <div class="stat-label">Điểm chuẩn ban đầu</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th class="text-center" style="width: 40px;">Hạng</th>
          <th style="width: 80px;">Mã HS</th>
          <th>Họ và tên</th>
          <th class="text-center" style="width: 50px;">Tổ</th>
          <th class="text-center" style="width: 50px;">Bàn</th>
          <th class="text-center" style="width: 60px;">Điểm trừ</th>
          <th class="text-center" style="width: 60px;">Điểm cộng</th>
          <th class="text-center" style="width: 70px;">Điểm tuần</th>
          <th class="text-center" style="width: 80px;">Xếp loại</th>
        </tr>
      </thead>
      <tbody>
        ${sortedStudents.map((s, idx) => {
          const sum = studentSummaries[s.maHS] || {
            diemHienTai: 100,
            tongDiemTru: 0,
            tongDiemCong: 0,
            xepLoai: 'Tot'
          };
          const badgeClass = sum.xepLoai === 'Tot' ? 'badge-tot' :
                             sum.xepLoai === 'Kha' ? 'badge-kha' :
                             sum.xepLoai === 'Dat' ? 'badge-dat' : 'badge-chuadat';
          return `
            <tr>
              <td class="text-center"><strong>${rankMap.get(s.maHS) ?? (idx + 1)}</strong></td>
              <td>${s.maHS}</td>
              <td><strong>${s.hoTen}</strong> ${s.vaiTro.includes('LT') ? '(Lớp trưởng)' : s.vaiTro.includes('BT') ? '(Bí thư)' : ''}</td>
              <td class="text-center">Tổ ${s.to}</td>
              <td class="text-center">D${s.dayBan}-B${s.soBan}</td>
              <td class="text-center" style="color: #dc2626;">${sum.tongDiemTru > 0 ? '-' + sum.tongDiemTru : '0'}</td>
              <td class="text-center" style="color: #16a34a;">${sum.tongDiemCong > 0 ? '+' + sum.tongDiemCong : '0'}</td>
              <td class="text-center"><strong>${sum.diemHienTai}</strong></td>
              <td class="text-center"><span class="badge ${badgeClass}">${sum.xepLoai}</span></td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    ${weekRecords.length > 0 ? `
    <h3 style="margin-top: 32px; margin-bottom: 12px; font-size: 14px; text-transform: uppercase; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
      BẢNG THỐNG KÊ CHI TIẾT CÁC LỖI VI PHẠM &amp; CÁN SỰ GHI NHẬN (TUẦN ${currentWeek})
    </h3>
    <table>
      <thead>
        <tr>
          <th class="text-center" style="width: 35px;">STT</th>
          <th style="width: 80px;">Thời gian</th>
          <th style="width: 140px;">Học sinh vi phạm</th>
          <th class="text-center" style="width: 45px;">Tổ</th>
          <th>Lỗi vi phạm nề nếp</th>
          <th class="text-center" style="width: 55px;">Điểm trừ</th>
          <th style="width: 160px;">Cán sự ghi nhận</th>
          <th class="text-center" style="width: 85px;">Trạng thái</th>
        </tr>
      </thead>
      <tbody>
        ${weekRecords.map((r, i) => `
          <tr>
            <td class="text-center">${i + 1}</td>
            <td>${r.ngayHoc || ''} (${r.buoi === 'Sang' ? 'Sáng' : 'Chiều'})</td>
            <td><strong>${r.hoTen}</strong> <span style="font-size: 11px; color: #64748b;">(${r.maHS})</span></td>
            <td class="text-center">Tổ ${r.to}</td>
            <td><strong>${r.tenHanhVi}</strong> ${r.ghiChu ? `<br/><span style="color: #64748b; font-size: 11px;">Ghi chú: ${r.ghiChu}</span>` : ''}</td>
            <td class="text-center" style="color: #dc2626; font-weight: bold;">-${r.diemSo}đ</td>
            <td><strong>${r.nguoiGhi}</strong> <span style="font-size: 11px; color: #475569;">(${
              r.vaiTroNguoiGhi === 'LT' ? 'Lớp trưởng' :
              r.vaiTroNguoiGhi === 'BT' ? 'Bí thư' :
              r.vaiTroNguoiGhi === 'PBT' ? 'Phó Bí thư' :
              r.vaiTroNguoiGhi === 'LP_HT' ? 'Lớp phó HT' :
              r.vaiTroNguoiGhi === 'LP_LD' ? 'Lớp phó LĐ' :
              r.vaiTroNguoiGhi === 'LP_VT' ? 'Lớp phó VT' :
              r.vaiTroNguoiGhi === 'CD' ? 'Cờ đỏ' :
              r.vaiTroNguoiGhi === 'TT' ? 'Tổ trưởng' :
              r.vaiTroNguoiGhi === 'GV' ? 'Giáo viên' : r.vaiTroNguoiGhi
            })</span></td>
            <td class="text-center">${r.trangThai === 'DaHuy' ? '<span style="color: #64748b;">Đã hủy</span>' : r.trangThai === 'ChoDuyet' ? '<span style="color: #d97706;">Chờ duyệt</span>' : '<span style="color: #dc2626; font-weight: bold;">Hiệu lực</span>'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ` : ''}

    <div class="footer">
      <div class="signature">
        <div class="signature-title">LỚP TRƯỞNG</div>
        <div class="signature-name">Nguyễn Kim Huy</div>
      </div>
      <div class="signature">
        <div class="signature-title">GIÁO VIÊN CHỦ NHIỆM</div>
        <div class="signature-name">Trần Văn Bình</div>
      </div>
    </div>
  </div>

  <button class="print-btn" onclick="window.print()">🖨️ In / Lưu PDF</button>
</body>
</html>`;

  // Create blob and download link
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BaoCao_ThiDua_10A5_Tuan_${currentWeek}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
