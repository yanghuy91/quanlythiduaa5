/**
 * Utility to generate and download a comprehensive Microsoft Word document (.doc)
 * containing standard data specifications and AI prompt guidelines for the 10A5 Emulation System.
 */

export function exportDataSpecsWordDocument(): void {
  const dateStr = new Date().toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const docHtml = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset="utf-8">
<title>Quy tắc Chuẩn hóa Dữ liệu Nhập/Xuất Lớp 10A5 - Hướng dẫn Dành cho AI</title>
<!--[if gte mso 9]>
<xml>
  <w:WordDocument>
    <w:View>Print</w:View>
    <w:Zoom>100</w:Zoom>
    <w:DoNotOptimizeForBrowser/>
  </w:WordDocument>
</xml>
<![endif]-->
<style>
  @page {
    size: 21.0cm 29.7cm; /* A4 */
    margin: 2.0cm 2.0cm 2.0cm 2.0cm;
    mso-page-orientation: portrait;
  }
  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 12.5pt;
    line-height: 1.45;
    color: #111827;
  }
  .header-org {
    text-align: center;
    font-size: 11pt;
    text-transform: uppercase;
    font-weight: bold;
    margin-bottom: 2pt;
  }
  .header-sub {
    text-align: center;
    font-size: 10.5pt;
    font-style: italic;
    color: #4b5563;
    margin-bottom: 12pt;
  }
  h1 {
    font-size: 17pt;
    font-weight: bold;
    color: #1e3a8a;
    text-align: center;
    margin-top: 10pt;
    margin-bottom: 4pt;
    text-transform: uppercase;
  }
  .subtitle {
    text-align: center;
    font-size: 11pt;
    font-style: italic;
    color: #4338ca;
    margin-bottom: 16pt;
  }
  h2 {
    font-size: 14pt;
    font-weight: bold;
    color: #1e40af;
    border-bottom: 1.5pt solid #3b82f6;
    padding-bottom: 3pt;
    margin-top: 18pt;
    margin-bottom: 6pt;
  }
  h3 {
    font-size: 12.5pt;
    font-weight: bold;
    color: #065f46;
    margin-top: 12pt;
    margin-bottom: 4pt;
  }
  p {
    margin-top: 4pt;
    margin-bottom: 6pt;
    text-align: justify;
  }
  ul, ol {
    margin-top: 4pt;
    margin-bottom: 6pt;
    padding-left: 20pt;
  }
  li {
    margin-bottom: 3pt;
  }
  table {
    border-collapse: collapse;
    width: 100%;
    margin-top: 6pt;
    margin-bottom: 10pt;
    font-size: 11pt;
  }
  th, td {
    border: 1pt solid #cbd5e1;
    padding: 5pt 7pt;
    vertical-align: top;
  }
  th {
    background-color: #f1f5f9;
    font-weight: bold;
    color: #0f172a;
    text-align: left;
  }
  .prompt-box {
    background-color: #f8fafc;
    border: 1.5pt dashed #6366f1;
    padding: 10pt 12pt;
    margin: 10pt 0;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 10.5pt;
    line-height: 1.4;
    color: #1e1b4b;
  }
  .highlight-box {
    background-color: #eff6ff;
    border-left: 3.5pt solid #3b82f6;
    padding: 8pt 12pt;
    margin: 8pt 0;
    font-size: 11.5pt;
  }
  .note-box {
    background-color: #fffbeb;
    border-left: 3.5pt solid #f59e0b;
    padding: 8pt 12pt;
    margin: 8pt 0;
    font-size: 11pt;
  }
  code {
    font-family: 'Consolas', monospace;
    font-size: 10pt;
    background-color: #f1f5f9;
    padding: 1pt 3pt;
    border-radius: 2pt;
  }
  .footer-sig {
    margin-top: 24pt;
    text-align: right;
    font-style: italic;
  }
</style>
</head>
<body>

  <div class="header-org">TRƯỜNG THPT SỐ 2 ĐỨC PHỔ — LỚP 10A5</div>
  <div class="header-sub">HỆ THỐNG QUẢN LÝ THI ĐUA, NỀ NẾP & ĐIỂM SỐ LỚP HỌC</div>

  <h1>QUY TẮC CHUẨN HÓA DỮ LIỆU ĐẦU VÀO & ĐẦU RA</h1>
  <div class="subtitle">(Tài liệu thông số kỹ thuật dùng cho Giáo viên & Huấn luyện Trí tuệ Nhân tạo AI)</div>

  <div class="highlight-box">
    <strong>MỤC ĐÍCH CỦA TÀI LIỆU NÀY:</strong><br>
    Tài liệu này định nghĩa chính xác và chi tiết cấu trúc các loại dữ liệu mà Hệ thống Quản lý Thi đua Lớp 10A5 tiếp nhận và xử lý. 
    Thầy/Cô có thể <strong>gửi tệp tài liệu này kèm theo dữ liệu thô</strong> (file Excel từ VnEdu, SMAS, biên bản họp lớp viết tay, tin nhắn Zalo, sổ theo dõi của Cờ đỏ) cho các công cụ AI (ChatGPT, Claude, Gemini, DeepSeek). 
    AI sẽ đọc hiểu nguyên tắc này và <strong>tự động chuyển đổi dữ liệu thô thành bảng chuẩn</strong> để nạp thẳng vào phần mềm với tỷ lệ chính xác 100%.
  </div>

  <h2>1. DANH MỤC CÁC LOẠI DỮ LIỆU TRONG HỆ THỐNG</h2>
  <p>Hệ thống Quản lý Thi đua 10A5 hoạt động xoay quanh 4 luồng dữ liệu chính:</p>
  <ol>
    <li><strong>Dữ liệu Danh sách học sinh & Sơ đồ lớp (Roster & Seating):</strong> Hồ sơ 42 học sinh, giới tính, phân chia 4 Tổ, vị trí 4 Dãy bàn x 6 Hàng bàn.</li>
    <li><strong>Dữ liệu Ghi nhận Nề nếp & Vi phạm thi đua (Discipline Records):</strong> Ngày học, buổi học, tuần học, hành vi cộng/trừ điểm, người lập biên bản, ghi chú minh chứng.</li>
    <li><strong>Dữ liệu Bảng điểm học tập môn học (Academic Gradebook):</strong> Điểm đánh giá thường xuyên (ĐĐGtx 1..4), giữa kì (ĐĐGgk), cuối kì (ĐĐGck), trung bình môn (ĐTBmhk) theo chuẩn Thông tư 22 - Bộ GD&ĐT.</li>
    <li><strong>Dữ liệu Toàn bộ trạng thái sao lưu (Full State JSON Backup):</strong> Đồng bộ thời gian thực qua Google Firebase Cloud Firestore và lưu trữ dự phòng ngoại tuyến.</li>
  </ol>

  <hr style="border: 0; border-top: 1pt solid #e2e8f0; margin: 16pt 0;">

  <h2>2. QUY TẮC CHUẨN HÓA DANH SÁCH HỌC SINH (IMPORT HỌC SINH)</h2>
  
  <h3>2.1. Cấu trúc các trường thông tin chuẩn</h3>
  <table>
    <thead>
      <tr>
        <th style="width: 8%;">STT</th>
        <th style="width: 15%;">Tên trường</th>
        <th style="width: 15%;">Định dạng</th>
        <th style="width: 12%;">Bắt buộc</th>
        <th>Mô tả & Quy tắc xử lý</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="text-align: center;">1</td>
        <td><code>STT</code></td>
        <td>Số nguyên (1 - 42)</td>
        <td>Có</td>
        <td>Số thứ tự theo sổ điểm danh hoặc xếp vần ABC.</td>
      </tr>
      <tr>
        <td style="text-align: center;">2</td>
        <td><code>Họ và tên</code></td>
        <td>Chuỗi tiếng Việt có dấu</td>
        <td>Có</td>
        <td>Họ tên đầy đủ học sinh (VD: <em>Nguyễn Khắc Huy</em>, <em>Đỗ Thị Thu Trang</em>).</td>
      </tr>
      <tr>
        <td style="text-align: center;">3</td>
        <td><code>Giới tính</code></td>
        <td><code>Nam</code> hoặc <code>Nu</code> (hoặc <code>Nữ</code>)</td>
        <td>Có</td>
        <td>Quyết định bộ Avatar 3D mặc định ban đầu của học sinh.</td>
      </tr>
      <tr>
        <td style="text-align: center;">4</td>
        <td><code>Tổ</code></td>
        <td>Số nguyên từ <code>1</code> đến <code>4</code></td>
        <td>Có</td>
        <td>Lớp 10A5 chia đều 4 tổ thi đua. Nếu để trống, hệ thống tự động gán tuần tự <code>(STT - 1) % 4 + 1</code>.</td>
      </tr>
      <tr>
        <td style="text-align: center;">5</td>
        <td><code>Ngày sinh</code></td>
        <td><code>DD/MM/YYYY</code></td>
        <td>Tùy chọn</td>
        <td>Ngày tháng năm sinh (VD: <em>15/08/2009</em>).</td>
      </tr>
      <tr>
        <td style="text-align: center;">6</td>
        <td><code>Chức vụ</code></td>
        <td>Chuỗi ký tự</td>
        <td>Tùy chọn</td>
        <td>Chức vụ: <em>Lớp trưởng, Lớp phó học tập, Lớp phó lao động, Bí thư, Tổ trưởng Tổ 1..4, Cờ đỏ, Thành viên</em>.</td>
      </tr>
    </tbody>
  </table>

  <h3>2.2. Quy tắc tự động xếp chỗ ngồi 4 Dãy bàn (Seating Layout Engine)</h3>
  <div class="note-box">
    <strong>Quy cách phòng học 10A5:</strong>
    <ul>
      <li>Gồm <strong>4 Dãy bàn</strong>: Dãy 1 (Tổ 1 - bên trái sát cửa sổ) → Dãy 2 (Tổ 2) → Dãy 3 (Tổ 3) → Dãy 4 (Tổ 4 - sát tường/cửa ra vào).</li>
      <li>Mỗi dãy có <strong>6 Hàng bàn</strong> (Bàn 1 gần bảng nhất → Bàn 6 cuối lớp).</li>
      <li>Mỗi bàn có <strong>2 Ghế ngồi</strong> (Ghế trái và Ghế phải).</li>
      <li>Tổng số chỗ ngồi chuẩn: 4 dãy x 6 hàng x 2 ghế = <strong>48 chỗ ngồi</strong> (Đủ sức chứa cho 42 học sinh và 6 chỗ trống dự phòng).</li>
    </ul>
  </div>

  <h3>2.3. Mẫu bảng dữ liệu chuẩn để copy/nhập vào hệ thống (Tab-Separated hoặc Excel)</h3>
  <table>
    <thead>
      <tr>
        <th>STT</th>
        <th>Họ và tên</th>
        <th>Giới tính</th>
        <th>Tổ</th>
        <th>Ngày sinh</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>1</td><td>Nguyễn Khắc Huy</td><td>Nam</td><td>Tổ 1</td><td>12/03/2009</td></tr>
      <tr><td>2</td><td>Võ Minh Quân</td><td>Nam</td><td>Tổ 1</td><td>25/07/2009</td></tr>
      <tr><td>3</td><td>Đỗ Thị Thu Trang</td><td>Nữ</td><td>Tổ 2</td><td>08/11/2009</td></tr>
      <tr><td>4</td><td>Trần Văn Nam</td><td>Nam</td><td>Tổ 2</td><td>19/01/2009</td></tr>
      <tr><td>5</td><td>Phạm Quỳnh Nga</td><td>Nữ</td><td>Tổ 3</td><td>03/05/2009</td></tr>
    </tbody>
  </table>

  <hr style="border: 0; border-top: 1pt solid #e2e8f0; margin: 16pt 0;">

  <h2>3. QUY TẮC CHUẨN HÓA DỮ LIỆU NỀ NẾP & VI PHẠM THI ĐUA (CSV / EXCEL IMPORT)</h2>
  
  <h3>3.1. Cấu trúc các cột của bảng ghi nề nếp theo thời gian</h3>
  <p>File nhập theo chuẩn định dạng CSV (dấu phẩy hoặc dấu chấm phẩy) hoặc copy từ Excel gồm đúng 8 cột:</p>
  <table>
    <thead>
      <tr>
        <th style="width: 18%;">Tên cột chuẩn</th>
        <th style="width: 15%;">Định dạng</th>
        <th style="width: 12%;">Bắt buộc</th>
        <th>Ý nghĩa & Quy tắc hợp lệ</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>NgayHoc</code></td>
        <td><code>YYYY-MM-DD</code></td>
        <td>Bắt buộc</td>
        <td>Ngày diễn ra sự việc (VD: <em>2026-11-09</em>). Hệ thống cũng tự động nhận diện dạng <em>DD/MM/YYYY</em>.</td>
      </tr>
      <tr>
        <td><code>Buoi</code></td>
        <td><code>Sang</code> hoặc <code>Chieu</code></td>
        <td>Bắt buộc</td>
        <td>Buổi học sáng hoặc chiều. Chấp nhận các biến thể không dấu: <em>Sang, Chieu, sáng, chiều</em>.</td>
      </tr>
      <tr>
        <td><code>TuanHoc</code></td>
        <td>Số nguyên (1 - 35)</td>
        <td>Bắt buộc</td>
        <td>Tuần học trong năm học (VD: <em>3</em> cho Tuần 3, <em>10</em> cho Tuần 10).</td>
      </tr>
      <tr>
        <td><code>MaHS_HoTen</code></td>
        <td>Chuỗi ký tự</td>
        <td>Bắt buộc</td>
        <td>Mã học sinh (VD: <code>HS01</code>, <code>HS25</code>) <strong>HOẶC</strong> Họ và tên học sinh (VD: <em>Nguyễn Khắc Huy</em>). Hệ thống có thuật toán tìm kiếm mờ để tự động ghép tên.</td>
      </tr>
      <tr>
        <td><code>TenHanhVi</code></td>
        <td>Chuỗi ký tự</td>
        <td>Bắt buộc</td>
        <td>Tên hành vi vi phạm hoặc khen thưởng (VD: <em>Đi học muộn</em>, <em>Sử dụng điện thoại trong giờ</em>, <em>Đạt điểm 10</em>).</td>
      </tr>
      <tr>
        <td><code>LoaiDiem</code></td>
        <td><code>Tru</code> hoặc <code>Cong</code></td>
        <td>Bắt buộc</td>
        <td><code>Tru</code>: Vi phạm nề nếp (bị trừ điểm thi đua); <code>Cong</code>: Khen thưởng, phát biểu, làm việc tốt (được cộng điểm).</td>
      </tr>
      <tr>
        <td><code>DiemSo</code></td>
        <td>Số nguyên dương (1 - 10)</td>
        <td>Bắt buộc</td>
        <td>Số điểm thay đổi (luôn là số dương, ví dụ: <code>2</code> nghĩa là trừ 2 điểm nếu LoaiDiem=Tru, cộng 2 điểm nếu LoaiDiem=Cong).</td>
      </tr>
      <tr>
        <td><code>GhiChu</code></td>
        <td>Chuỗi ký tự</td>
        <td>Tùy chọn</td>
        <td>Chi tiết sự việc (VD: <em>Trễ 10 phút tiết 1</em>, <em>Chơi game giờ Toán</em>, <em>Phát biểu xuất sắc</em>).</td>
      </tr>
    </tbody>
  </table>

  <h3>3.2. Mẫu bảng dữ liệu nề nếp chuẩn (Chuẩn CSV)</h3>
  <div class="prompt-box">
NgayHoc,Buoi,TuanHoc,MaHS_HoTen,TenHanhVi,LoaiDiem,DiemSo,GhiChu<br>
2026-11-09,Sang,3,Nguyễn Khắc Huy,Đi học muộn,Tru,2,Trễ 10 phút tiết 1 môn Sinh<br>
2026-11-09,Chieu,3,Võ Minh Quân,Sử dụng điện thoại trong giờ,Tru,5,Dùng điện thoại trong giờ Hóa<br>
2026-11-10,Sang,3,Đỗ Thị Thu Trang,Đạt điểm 10 kiểm tra miệng,Cong,2,Phát biểu bài học hay<br>
2026-11-11,Sang,3,HS01,Khăn quàng / bảng tên đầy đủ,Cong,1,Gương mẫu đầu tuần
  </div>

  <hr style="border: 0; border-top: 1pt solid #e2e8f0; margin: 16pt 0;">

  <h2>4. QUY TẮC CHUẨN HÓA BẢNG ĐIỂM HỌC TẬP MÔN HỌC (THÔNG TƯ 22)</h2>
  
  <h3>4.1. Cấu trúc cột điểm học tập môn học</h3>
  <table>
    <thead>
      <tr>
        <th>Ký hiệu cột</th>
        <th>Tên đầy đủ</th>
        <th>Thang điểm</th>
        <th>Hệ số / Ý nghĩa</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>DDGtx1</code></td>
        <td>Điểm đánh giá thường xuyên 1</td>
        <td>0.0 - 10.0</td>
        <td>Kiểm tra miệng, hỏi bài đầu giờ</td>
      </tr>
      <tr>
        <td><code>DDGtx2</code></td>
        <td>Điểm đánh giá thường xuyên 2</td>
        <td>0.0 - 10.0</td>
        <td>Kiểm tra 15 phút lần 1</td>
      </tr>
      <tr>
        <td><code>DDGtx3</code></td>
        <td>Điểm đánh giá thường xuyên 3</td>
        <td>0.0 - 10.0</td>
        <td>Kiểm tra 15 phút lần 2 / Bài tập nhóm</td>
      </tr>
      <tr>
        <td><code>DDGtx4</code></td>
        <td>Điểm đánh giá thường xuyên 4</td>
        <td>0.0 - 10.0</td>
        <td>Kiểm tra thường xuyên lần 4 (nếu có)</td>
      </tr>
      <tr>
        <td><code>DDGgk</code></td>
        <td>Điểm đánh giá giữa kì</td>
        <td>0.0 - 10.0</td>
        <td>Hệ số 2 (Kiểm tra giữa kì)</td>
      </tr>
      <tr>
        <td><code>DDGck</code></td>
        <td>Điểm đánh giá cuối kì</td>
        <td>0.0 - 10.0</td>
        <td>Hệ số 3 (Kiểm tra cuối học kì)</td>
      </tr>
      <tr>
        <td><code>DTBmhk</code></td>
        <td>Điểm trung bình môn học kì</td>
        <td>0.0 - 10.0</td>
        <td>Tính theo công thức: <code>(Ttx + 2*Đgk + 3*Đck) / (Số_cột_tx + 5)</code></td>
      </tr>
    </tbody>
  </table>

  <hr style="border: 0; border-top: 1pt solid #e2e8f0; margin: 16pt 0;">

  <h2>5. MẪU PROMPT CHUYÊN BIỆT DÀNH CHO TRÍ TUỆ NHÂN TẠO (AI)</h2>
  <p>
    Khi Thầy/Cô có dữ liệu thô (chưa đúng định dạng), hãy sao chép toàn bộ đoạn Prompt dưới đây và gửi kèm dữ liệu cho ChatGPT, Claude, Gemini hoặc DeepSeek:
  </p>

  <div class="prompt-box">
<strong>[LỆNH CHO AI: CHUYỂN ĐỔI DỮ LIỆU THÔ THÀNH DẠNG CHUẨN LỚP 10A5]</strong><br><br>
Bạn là Trợ lý Kỹ thuật Dữ liệu chuyên nghiệp cho Hệ thống Quản lý Thi đua Lớp 10A5 - THPT Số 2 Đức Phổ.<br>
Dưới đây là tài liệu đặc tả kỹ thuật và dữ liệu thô tôi cung cấp cho bạn.<br><br>
<strong>NHIỆM VỤ CỦA BẠN:</strong><br>
1. Đọc và phân tích dữ liệu thô (tên học sinh, lỗi vi phạm, điểm số, ngày giờ).<br>
2. Chuẩn hóa họ tên: Viết hoa chữ cái đầu đúng chuẩn chính tả tiếng Việt.<br>
3. Xác định giới tính chuẩn (Nam hoặc Nu). Nếu dữ liệu không ghi rõ giới tính, hãy suy luận dựa vào tên đệm (Thị, Ngọc, Quỳnh... là Nu; Văn, Hữu, Khắc, Minh... là Nam).<br>
4. Phân chia tổ: Gán vào 4 Tổ (Tổ 1, Tổ 2, Tổ 3, Tổ 4).<br>
5. Trả về kết quả dưới 2 định dạng thuận tiện nhất:<br>
   - <strong>Dạng 1 (Bảng Markdown):</strong> Dễ đọc và kiểm tra trực tiếp.<br>
   - <strong>Dạng 2 (Đoạn mã Tab-Separated hoặc CSV):</strong> Đặt trong khối code để tôi bấm nút Copy và dán thẳng vào phần mềm 10A5.<br><br>
<strong>DỮ LIỆU THÔ CẦN XỬ LÝ:</strong><br>
<em>[DÁN TOÀN BỘ DỮ LIỆU THÔ CỦA BẠN VÀO ĐÂY]</em>
  </div>

  <h2>6. CÁC LỖI THƯỜNG GẶP VÀ CÁCH KHẮC PHỤC</h2>
  <ul>
    <li><strong>Lỗi sai định dạng ngày:</strong> Hệ thống ưu tiên định dạng <code>YYYY-MM-DD</code> (ví dụ: <code>2026-11-09</code>) để tránh nhầm lẫn giữa ngày và tháng.</li>
    <li><strong>Lỗi tên học sinh bị lệch dấu:</strong> Hãy đảm bảo dữ liệu gõ bằng bảng mã Unicode chuẩn (Unicode dựng sẵn). Tránh dùng TCVN3 (VnTime) hoặc VNI.</li>
    <li><strong>Lỗi dấu phân cách số thập phân trong điểm:</strong> Hệ thống chấp nhận cả dấu chấm (<code>8.5</code>) lẫn dấu phẩy (<code>8,5</code>).</li>
    <li><strong>Lỗi thiếu buổi hoặc tuần học:</strong> Nếu để trống, hệ thống sẽ tự động gán buổi Sáng và tuần học hiện tại.</li>
  </ul>

  <div class="footer-sig">
    Đức Phổ, Ngày ${dateStr}<br>
    <strong>BAN QUẢN TRỊ KỸ THUẬT LỚP 10A5</strong>
  </div>

</body>
</html>
  `.trim();

  // Create Blob and trigger download
  const blob = new Blob(['\ufeff' + docHtml], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Quy_Tac_Chuan_Hoa_Du_Lieu_Lop_10A5_Cho_AI_${new Date().toISOString().slice(0, 10)}.doc`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
