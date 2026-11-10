# Tối ưu hóa Đồng bộ Đám mây & Khắc phục Lỗi Vượt Hạn mức Firestore

Giải pháp khắc phục triệt để lỗi `FirebaseError: [code=resource-exhausted]: Quota exceeded` của Cloud Firestore bằng cách chuyển hoàn toàn luồng lưu trữ đám mây sang Firebase Realtime Database kết hợp bộ nhớ máy chủ cục bộ, đồng thời áp dụng cơ chế chống ghi trùng lặp (deduplication) và giãn nhịp tự động lưu (debounce).

## Quyết định đã xác nhận từ Giáo viên

> [!IMPORTANT]
> Các lựa chọn kiến trúc dưới đây đã được xác nhận để đảm bảo hệ thống vận hành ổn định, tức thời trên mọi thiết bị mà không bao giờ gặp lỗi giới hạn hạn mức đọc/ghi trong ngày.

- **Quyết định 1 (Hạ tầng Đám mây)**: Ngừng hoàn toàn việc khởi tạo và gọi Cloud Firestore (`getFirestore`, `getDoc`, `setDoc`); sử dụng 100% **Firebase Realtime Database (RTDB)** kết hợp máy chủ nội bộ và `localStorage`.
- **Quyết định 2 (Tối ưu hóa Tần suất Lưu)**: Tăng chu kỳ chờ tự động lưu (debounce) và bổ sung bộ kiểm tra chữ ký dữ liệu (payload fingerprint) để chỉ thực hiện lệnh ghi lên đám mây khi nội dung dữ liệu lớp học thực sự có sự thay đổi.

---

## 1. Tổng quan & Mục tiêu Cốt lõi

- **Chức năng giải quyết**: Loại bỏ hoàn toàn thông báo lỗi `Quota exceeded` và hiện tượng treo/chậm kết nối do bộ SDK của Cloud Firestore liên tục thử kết nối lại (exponential backoff) khi hết hạn mức miễn phí trong ngày.
- **Đối tượng sử dụng**: Giáo viên chủ nhiệm, Ban cán sự lớp và 42 học sinh lớp 10A5 truy cập đồng thời trên điện thoại và máy tính.
- **Giá trị mang lại**:
  - Tốc độ đồng bộ thời gian thực mượt mà qua Realtime Database mà không bị giới hạn số lượt đọc/ghi tài liệu như Firestore.
  - Giảm hơn 70% số lệnh ghi dư thừa nhờ cơ chế so sánh chữ ký dữ liệu trước khi gửi và loại bỏ việc ghi kép vừa qua REST vừa qua SDK trong cùng một thao tác.

---

## 2. Trải nghiệm Người dùng & Giao diện

- **Luồng hoạt động liền mạch**:
  - Khi mở ứng dụng, dữ liệu lớp học (danh sách học sinh, sơ đồ chỗ ngồi, nội quy, bảng điểm, ghi nhận nề nếp) được tải tức thì từ bộ nhớ đệm và đồng bộ ngầm với Firebase Realtime Database mà không phát sinh bất kỳ lỗi ngầm nào trên bảng điều khiển.
  - Khi Giáo viên hoặc Ban cán sự chấm điểm nề nếp, đổi tuần học, cập nhật huy hiệu hay nhập điểm môn học, trạng thái được cập nhật ngay trên giao diện và gom nhóm thông minh để đồng bộ lên đám mây.
- **Bản sắc Giao diện & Hiển thị**:
  - Giữ nguyên toàn bộ thiết kế giao diện sáng (`Light Mode` chuẩn mực với nền `#F6F6F3`, bề mặt `#FFFFFF`, điểm nhấn `#2457D6` và phông chữ `Be Vietnam Pro`).
  - Đảm bảo trải nghiệm sạch sẽ, không hiển thị cảnh báo kỹ thuật gây nhiễu cho học sinh và giáo viên.

---

## 3. Các Quyết định Kỹ thuật & Đánh đổi

- **Quyết định 1: Loại bỏ hoàn toàn kết nối Cloud Firestore**
  - *Phương án lựa chọn*: Gỡ bỏ toàn bộ lệnh gọi và khởi tạo Firestore SDK; sử dụng Firebase Realtime Database làm nguồn đám mây duy nhất cho cả trạng thái lớp học (`classes/10a5`) và cấu hình khóa AI (`gemini_pool/10a5`).
  - *Lý do*: Cloud Firestore áp dụng giới hạn ngặt nghèo về số lượt đọc/ghi tài liệu miễn phí mỗi ngày, khi lưu toàn bộ trạng thái lớp học liên tục sẽ nhanh chóng chạm ngưỡng và kích hoạt vòng lặp `maximum backoff delay`. Ngược lại, Realtime Database hỗ trợ luồng WebSocket/REST tốc độ cao và ổn định cho dữ liệu JSON tập trung của một lớp học.
  - *Phương án đã cân nhắc*: Giữ Firestore làm dự phòng — bị loại bỏ vì chỉ cần SDK Firestore thực hiện một lệnh đọc/ghi khi đã cạn quota, trình duyệt sẽ lập tức báo lỗi `resource-exhausted`.

- **Quyết định 2: Khử trùng lặp dữ liệu (Fingerprint Deduplication) & Ghi đơn kênh**
  - *Phương án lựa chọn*:
    1. Tạo chữ ký nội dung (bỏ qua trường thời gian `updatedAt` và `version`) để kiểm tra xem dữ liệu mới có khác với lần lưu thành công gần nhất hay không. Nếu không có thay đổi thực sự, bỏ qua lệnh ghi đám mây.
    2. Trong mỗi lần lưu lên Realtime Database, ưu tiên ghi qua một kênh chính (SDK hoặc REST fallback khi cần) thay vì phát đồng thời cả hai lệnh ghi kép như trước.
    3. Giãn thời gian chờ tự động lưu (`debounce`) lên mức hợp lý (1500ms) và ngăn chặn hiện tượng tự kích hoạt lưu lại ngay khi vừa tải dữ liệu lần đầu từ máy chủ.
  - *Lý do*: Tránh hiện tượng "bão lệnh ghi" (write amplification) khi khởi động ứng dụng hoặc khi thực hiện nhiều thao tác liên tiếp.

---

## 4. Kiến trúc Kỹ thuật & Luồng Dữ liệu

### Sơ đồ Kiến trúc Đồng bộ Mới

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    GIAO DIỆN QUẢN LÝ LỚP 10A5 (React)                   │
│     (Giáo viên chủ nhiệm  •  Ban cán sự lớp  •  42 Học sinh 10A5)       │
└───────────────────┬─────────────────────────────────┬───────────────────┘
                    │ Thao tác cập nhật               │ Lắng nghe Realtime
                    ▼                                 │ (Không phản hồi lặp)
┌───────────────────────────────────────┐             │
│     BỘ ĐIỀU PHỐI ĐỒNG BỘ (Sync)       │             │
│  1. Lưu tức thì vào LocalStorage      │             │
│  2. Gom nhóm (Debounce 1500ms)        │             │
│  3. Kiểm tra chữ ký dữ liệu (Diff)    │             │
└─────────┬─────────────────────────────┴─────────────┼───────────────────┘
          │ Chỉ gửi khi dữ liệu thực sự thay đổi      │
          ▼                                           │
┌─────────────────────────────────────────────────────┴───────────────────┐
│               TẦNG LƯU TRỮ ĐÁM MÂY & MÁY CHỦ CỤC BỘ                     │
│                                                                         │
│  ┌───────────────────────────────────┐   ┌───────────────────────────┐  │
│  │  Firebase Realtime Database       │   │  Máy chủ Nội bộ (/api)    │  │
│  │  • classes/10a5 (Trạng thái lớp)  │   │  • classroom_state.json   │  │
│  │  • gemini_pool/10a5 (Cấu hình)    │   │  (Bản sao lưu cục bộ)     │  │
│  └───────────────────────────────────┘   └───────────────────────────┘  │
│                                                                         │
│  [Đã ngắt hoàn toàn Cloud Firestore SDK để triệt tiêu lỗi Quota]        │
└─────────────────────────────────────────────────────────────────────────┘
```

### Mô hình Trạng thái & Ánh xạ Xử lý
- **Khởi tạo phiên làm việc**:
  - Khi tải trang, hệ thống đọc dữ liệu từ Realtime Database (hoặc máy chủ nội bộ nếu ngoại tuyến), đánh dấu trạng thái đang đồng bộ từ máy chủ (`isApplyingRemoteUpdate`) để không kích hoạt ngược lại bộ tự động lưu.
  - Lưu chữ ký dữ liệu ban đầu làm mốc so sánh chuẩn.
- **Khi người dùng thao tác (Chấm điểm, sửa sơ đồ, nhập điểm, đổi cài đặt)**:
  - Cập nhật trạng thái giao diện và `localStorage` ngay lập tức (độ trễ 0ms).
  - Đưa yêu cầu đồng bộ vào hàng đợi `scheduleServerSync` (chờ 1500ms để gộp các thao tác liên tiếp).
  - So sánh chữ ký dữ liệu mới với chữ ký đã lưu gần nhất: chỉ khi phát hiện thay đổi thực sự mới gửi lệnh cập nhật lên Firebase Realtime Database và `/api/state`.
