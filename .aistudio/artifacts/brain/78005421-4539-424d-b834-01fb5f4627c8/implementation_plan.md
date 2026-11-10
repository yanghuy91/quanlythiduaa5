# Cơ chế Bảo vệ Dữ liệu Đám mây (Chống Ghi đè Khi Cập nhật Ứng dụng)

Giải pháp bảo vệ tuyệt đối dữ liệu thật của Lớp 10A5 đã nạp trên Firebase để mỗi khi Giáo viên chỉnh sửa tính năng, cập nhật giao diện hoặc triển khai phiên bản mới từ đây, hệ thống luôn tải dữ liệu từ Firebase về trước và tuyệt đối không bao giờ lấy dữ liệu mẫu (mock data) hoặc tệp cục bộ trong dự án đè lên Firebase.

## Quyết định đã xác nhận từ Giáo viên

> [!IMPORTANT]
> Hai nguyên tắc bảo vệ dữ liệu dưới đây được áp dụng xuyên suốt vòng đời ứng dụng:

- **Quyết định 1 (Khóa Ghi Đè Khi Khởi Động)**: Luôn ưu tiên tải dữ liệu từ Firebase Realtime Database trước tiên và **khóa toàn bộ lệnh tự động ghi lên đám mây** cho đến khi quá trình tải dữ liệu từ Firebase hoàn tất thành công.
- **Quyết định 2 (Cô lập Tệp Dữ liệu Dự án)**: Chỉ lưu và đồng bộ dữ liệu thật trên **Firebase Realtime Database** và **trình duyệt cá nhân (`localStorage`)**; ngắt bỏ hoàn toàn việc đọc/ghi tệp dữ liệu tĩnh trong mã nguồn dự án để dữ liệu mẫu trong kho mã nguồn không bao giờ lọt vào phiên làm việc hay ghi đè lên đám mây.

---

## 1. Nguyên nhân Gốc rễ & Giải pháp Cốt lõi

- **Nguyên nhân gây nguy cơ mất dữ liệu trước đây**:
  1. Khi ứng dụng vừa mở trên môi trường mới (hoặc sau khi cập nhật mã nguồn), trình duyệt chưa có `localStorage` nên khởi tạo tạm bằng danh sách 42 học sinh mẫu.
  2. Nếu kết nối mạng tới Firebase chậm vài giây hoặc chập chờn lúc khởi động, hệ thống trước đây tự động chuyển sang đọc tệp dữ liệu tĩnh kèm theo mã nguồn hoặc kích hoạt nhánh *"tự động lưu trạng thái ban đầu lên máy chủ"*, dẫn đến việc đẩy ngược dữ liệu mẫu đè lên dữ liệu thật trên Firebase.
- **Giải pháp cốt lõi**:
  - Thiết lập **Chốt khóa Đồng bộ Đám mây (`Cloud Hydration Gate`)**: Mọi luồng tự động lưu (`auto-save`) bị vô hiệu hóa hoàn toàn ở thời điểm khởi động cho đến khi ứng dụng nhận được dữ liệu thật từ Firebase Realtime Database.
  - Xóa bỏ nhánh tự động đẩy dữ liệu mặc định lên Firebase khi khởi chạy ứng dụng lần đầu.

---

## 2. Trải nghiệm Người dùng & Vận hành

- **Khi cập nhật mã nguồn hoặc mở trên thiết bị mới**:
  - Ngay khi mở trang, hệ thống kết nối thẳng tới Firebase Realtime Database để lấy danh sách học sinh, sơ đồ chỗ ngồi, bảng điểm và lịch sử nề nếp thật đã lưu.
  - Trong thời gian đang tải từ Firebase, mọi thay đổi khởi tạo nội bộ không được phép phát lệnh ghi lên đám mây.
  - Ngay khi dữ liệu từ Firebase tải về thành công, giao diện và bộ nhớ trình duyệt (`localStorage`) được cập nhật đồng bộ theo đúng dữ liệu trên Firebase, sau đó chốt khóa ghi mới được mở để phục vụ các thao tác chấm điểm hoặc chỉnh sửa tiếp theo của Giáo viên.
- **Khi mất mạng tạm thời lúc mở ứng dụng**:
  - Nếu không kết nối được Firebase lúc vừa mở trang, ứng dụng chỉ hiển thị dữ liệu lưu trong trình duyệt cá nhân và giữ nguyên trạng thái **khóa tự động ghi đè đám mây**, đảm bảo khi có mạng trở lại dữ liệu trên Firebase vẫn nguyên vẹn 100%.

---

## 3. Các Quyết định Kỹ thuật & Đánh đổi

- **Quyết định 1: Thiết lập Cờ Trạng thái Đã Tải Đám mây (`cloudHydrated`)**
  - *Phương án lựa chọn*: Chỉ mở quyền tự động lưu (`scheduleServerSync`) sau khi hàm tải dữ liệu đám mây (`fetchCloudClassState`) hoặc kênh lắng nghe trực tuyến (`subscribeToCloudClassState`) trả về dữ liệu hợp lệ từ Firebase.
  - *Lý do*: Ngăn chặn triệt để hiện tượng trạng thái khởi tạo tạm thời (dữ liệu mẫu) bị đẩy lên Firebase trước khi dữ liệu thật kịp tải về.

- **Quyết định 2: Ngắt kết nối với Tệp Dữ liệu Tĩnh trong Dự án**
  - *Phương án lựa chọn*: Bỏ cơ chế đọc/ghi dự phòng vào điểm cuối máy chủ nội bộ chứa dữ liệu mẫu của dự án; chỉ sử dụng 2 tầng lưu trữ là **Firebase Realtime Database** (nguồn chuẩn toàn cục) và **LocalStorage trên trình duyệt** (bộ đệm ngoại tuyến cá nhân).
  - *Lý do*: Đảm bảo đúng yêu cầu của Giáo viên là chỉ giữ dữ liệu thật trên Firebase và trình duyệt cá nhân, không để tệp dữ liệu mẫu trong mã nguồn làm sai lệch dữ liệu lớp học khi cập nhật phiên bản.

---

## 4. Kiến trúc Kỹ thuật & Luồng Bảo vệ Dữ liệu

### Sơ đồ Luồng Bảo vệ Dữ liệu Khi Cập nhật / Khởi động

```
┌─────────────────────────────────────────────────────────────────────────┐
│                KHỞI ĐỘNG ỨNG DỤNG / CẬP NHẬT PHIÊN BẢN MỚI              │
│         [Trạng thái ban đầu: KHÓA GHI ĐÁM MÂY (cloudHydrated = false)]  │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│             BƯỚC 1: TẢI DỮ LIỆU CHUẨN TỪ FIREBASE RTDB                  │
│   • Đọc dữ liệu thật từ nút đám mây (classes/10a5)                      │
│   • KHÔNG đọc tệp mẫu trong dự án, KHÔNG tự đẩy dữ liệu mẫu lên mây     │
└─────────────────┬───────────────────────────────────┬───────────────────┘
                  │                                   │
     [Tải thành công từ Firebase]         [Mạng lỗi / Chưa tải xong]
                  │                                   │
                  ▼                                   ▼
┌───────────────────────────────────┐ ┌───────────────────────────────────┐
│  BƯỚC 2A: CẬP NHẬT & MỞ KHÓA      │ │  BƯỚC 2B: GIỮ KHÓA BẢO VỆ         │
│  • Nạp dữ liệu thật vào Giao diện │ │  • Dùng bộ đệm trình duyệt        │
│    và LocalStorage trình duyệt    │ │  • Giữ cloudHydrated = false      │
│  • Lưu chữ ký dữ liệu chuẩn       │ │  • Chặn mọi lệnh auto-save đè     │
│  • Mở khóa: cloudHydrated = true  │ │    lên Firebase cho tới khi       │
│  • Cho phép lưu các thao tác mới  │ │    nhận được dữ liệu từ Firebase  │
└───────────────────────────────────┘ └───────────────────────────────────┘
```

### Mô hình Kiểm soát Trạng thái
- **Khi khởi chạy (`Mount`)**:
  - `cloudHydrated` = `false`.
  - Mọi lệnh gọi `scheduleServerSync` sẽ kiểm tra `isCloudHydrated()`. Nếu `false`, hủy lệnh ngay lập tức mà không gửi bất kỳ gói tin nào lên Firebase.
- **Khi nhận dữ liệu từ Firebase (`fetchServerState` hoặc `subscribeToCloudClassState`)**:
  - Ghi nhận chữ ký dữ liệu chuẩn (`markRemoteStateApplied`), đánh dấu `cloudHydrated = true`, đồng thời cập nhật toàn bộ dữ liệu vào `localStorage` của trình duyệt.
- **Khi Giáo viên chủ động nạp danh sách mới hoặc bấm Lưu thủ công**:
  - Các thao tác chủ động của Giáo viên (nhập danh sách học sinh mới, khôi phục từ tệp sao lưu JSON, bấm nút đồng bộ thủ công) được cấp quyền ghi trực tiếp (`force = true`) và đồng thời mở khóa `cloudHydrated = true`.
