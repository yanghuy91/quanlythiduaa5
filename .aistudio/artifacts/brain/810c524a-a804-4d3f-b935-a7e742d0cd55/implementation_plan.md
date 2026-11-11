# Kế Hoạch Nâng Cấp & Khắc Phục Lỗi Hệ Thống Thi Đua Lớp 10A5

Bản kế hoạch này tổng hợp phương án xử lý dứt điểm 8 vấn đề về hiển thị huy hiệu, logic tính điểm tuần học, quản trị huy hiệu của Giáo viên chủ nhiệm (GVCN), tương phản màu sắc giao diện sáng, bố cục sơ đồ ảnh trên thiết bị di động và tinh gọn trải nghiệm người dùng.

## User Review & Critical Decisions

> [!IMPORTANT]
> **1. Logic Tuần không có dữ liệu (Tuần nghỉ):** Hệ thống chỉ hiển thị trạng thái *"Tuần không có dữ liệu"* đối với các tuần được GVCN chủ động đánh dấu nghỉ. Tất cả các tuần học khác (bao gồm cả các tuần trước mốc bắt đầu xét thi đua) vẫn hiển thị điểm số và xếp loại bình thường, tuyệt đối không vừa hiện điểm vừa báo không có dữ liệu.
>
> **2. Phân quyền Huy hiệu dành riêng cho Ban cán sự:** Toàn bộ 10 huy hiệu thuộc nhóm *Tập thể & Cán sự* cùng các huy hiệu gắn liền với chức vụ (Lớp trưởng, Bí thư, Phó Bí thư, Lớp phó, Cờ đỏ, Tổ trưởng) được khóa cứng điều kiện chỉ dành cho thành viên Ban cán sự lớp (kể cả khi xét tự động hoặc trao thủ công). Đồng thời gỡ bỏ cơ chế tự mở khóa giả lập ở màn hình Học sinh để đảm bảo tính nhất quán tuyệt đối với danh sách huy hiệu GVCN đã trao.
>
> **3. Cơ chế Thu hồi & Tính lại huy hiệu của GVCN:** Bổ sung nút *"Thu hồi tất cả huy hiệu"* độc lập (kèm bước xác nhận an toàn ngay trên giao diện) và tùy chọn *"Tự động thu hồi toàn bộ huy hiệu cũ trước khi tính lại"* để GVCN làm sạch dữ liệu vinh danh trước mỗi đợt xét mới.

## 1. Overview & Core Concept

* **Mục tiêu trọng tâm:** Chuẩn hóa tính chính xác của dữ liệu thi đua — vinh danh và nâng cấp tính chuyên nghiệp, sắc nét của giao diện trên cả máy tính lẫn điện thoại di động.
* **Giá trị mang lại cho Giáo viên & Học sinh:**
  * **Minh bạch điểm số & danh hiệu:** Điểm tuần và huy hiệu phản ánh đúng 100% quyết định của GVCN và dữ liệu thực tế, không còn hiện tượng báo sai tuần không có dữ liệu hay tự hiển thị huy hiệu chưa được cấp.
  * **Đồng nhất giao diện Sáng (Light Mode):** Loại bỏ hoàn toàn xung đột chế độ tối của trình duyệt/hệ điều hành khiến một số bảng ghi nhận, hộp thoại chi tiết vi phạm và thanh công cụ bị nền tối đen trong khi chữ màu tối chìm vào nền.
  * **Trực quan trên di động:** Sơ đồ lớp dạng ảnh hiển thị rõ mặt học sinh, huy hiệu thu gọn tinh tế ở góc và tên học sinh vừa vặn bên dưới.

## 2. User Experience & Visual Design

* **Đội ngũ đầu tàu thi đua & Huy hiệu:**
  * Khắc phục lỗi vỡ ảnh biểu trưng tại cửa sổ *Đội ngũ đầu tàu thi đua* bằng tài nguyên ảnh đóng gói chuẩn kết hợp huy hiệu vector sắc nét.
  * Nhãn phân biệt rõ các huy hiệu *"Dành riêng cho Ban cán sự"* trong bảng quản lý để GVCN và học sinh dễ dàng nhận diện.
* **Khắc phục triệt để lỗi "Nền tối, chữ chìm":**
  * Khóa đồng bộ biến thể giao diện theo đúng chủ đề Sáng của ứng dụng, không để chế độ tối của thiết bị kích hoạt nhầm các lớp nền tối trên nền chữ đen.
  * Chuẩn hóa toàn bộ khu vực ghi nhận vi phạm, cửa sổ xem chi tiết lỗi của học sinh, bảng nhập dữ liệu thông minh và các hộp thoại quản lý về tông nền sáng trang nhã (`#FFFFFF` / `#F8FAFC`), viền mảnh rõ nét và chữ độ tương phản cao (`#0F172A`).
* **Sơ đồ lớp dạng ảnh trên điện thoại:**
  * Thu nhỏ kích thước huy hiệu góc trên ô ghế khi xem trên màn hình nhỏ và đặt gọn vào góc ảnh đại diện để không che khuất khuôn mặt học sinh.
  * Tinh chỉnh cỡ chữ và khoảng cách dòng của tên học sinh bên dưới ảnh để hiển thị gọn gàng, đầy đủ tên gọi mà không bị cắt cụt.
* **Tinh gọn giao diện chuyên nghiệp:**
  * Trong cửa sổ chọn ảnh đại diện: Lược bỏ hoàn toàn các dòng nhãn thừa (*"Kho Avatar (40 ảnh)"*, *"Cho phép trùng"*, *"Giới tính: Nam/Nữ"*, *"Tự động canh vuông chuẩn đẹp"*).
  * Trong trang cá nhân Học sinh: Bỏ nút *"Cài đặt tài khoản"* bên dưới thẻ thông tin cá nhân vì đã có nút *"Tài khoản"* (biểu tượng bánh răng) trực관 ngay trên ảnh bìa.

## 3. Key Product Decisions & Trade-Offs

* **Đồng bộ trạng thái huy hiệu thực tế thay vì tự suy diễn ở máy trạm:**
  * *Quyết định:* Trước đây giao diện học sinh có đoạn mã tự mở khóa sẵn một số huy hiệu nếu thấy học sinh chưa có lỗi, dẫn đến việc dù GVCN thu hồi sạch huy hiệu hoặc học sinh không phải Ban cán sự vẫn thấy huy hiệu sáng lên. Hệ thống sẽ bỏ cơ chế tự mở khóa ngầm này và chỉ hiển thị đúng những huy hiệu đã được hệ thống xét duyệt chính thức hoặc GVCN trao.
* **Tách biệt "Mốc tuần bắt đầu xét" và "Tuần nghỉ không có dữ liệu":**
  * *Quyết định:* Khi GVCN chọn mốc tuần bắt đầu tính điểm lớn hơn Tuần 1, các tuần trước mốc đó chỉ miễn trừ điểm phạt chứ không bị biến thành *"Tuần không có dữ liệu"*. Chỉ những tuần nằm trong danh sách tuần nghỉ do GVCN đánh dấu mới hiển thị nhãn *"Tuần không có dữ liệu"*.

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    HỆ THỐNG QUẢN TRỊ THI ĐUA LỚP 10A5                   │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
│  1. ĐỘNG CƠ TÍNH ĐIỂM │ │  2. QUẢN TRỊ HUY HIỆU │ │  3. GIAO DIỆN & SƠ ĐỒ │
├───────────────────────┤ ├───────────────────────┤ ├───────────────────────┤
│ • Kiểm tra tuần nghỉ  │ │ • Ràng buộc nhóm Cán  │ │ • Khóa biến thể sáng  │
│   chỉ theo danh sách  │ │   sự & chức vụ        │ │   toàn cục, xóa nền   │
│   GVCN đánh dấu       │ │ • Nút Thu hồi tất cả  │ │   tối chữ chìm        │
│ • Hiển thị điểm bình  │ │   & Tự thu hồi trước  │ │ • Sơ đồ ảnh: thu nhỏ  │
│   thường cho các tuần │ │   khi bấm Tính lại    │ │   huy hiệu góc & tên  │
│   không đánh dấu nghỉ │ │ • Đồng bộ 1 nguồn dữ  │ │ • Tinh gọn hộp thoại  │
│                       │ │   liệu huy hiệu chuẩn │ │   Avatar & Hồ sơ HS   │
└───────────────────────┘ └───────────────────────┘ └───────────────────────┘
```

* **Đồng bộ hóa dữ liệu Huy hiệu:** Khi GVCN thực hiện *"Thu hồi tất cả huy hiệu"* hoặc *"Tính lại từ đầu"*, hệ thống xóa sạch cả danh sách huy hiệu đang sở hữu lẫn huy hiệu đang ghim đại diện của toàn bộ học sinh, đồng thời phát tín hiệu cập nhật tức thời lên sơ đồ lớp và bảng xếp hạng.
* **Kiểm soát điều kiện Ban cán sự:** Mọi huy hiệu thuộc danh mục *Tập thể & Cán sự* hoặc có quy tắc gắn chức vụ đều đi qua bộ lọc kiểm tra vai trò cán sự (`LT`, `BT`, `PBT`, `LP_HT`, `LP_LD`, `LP_VT`, `CD`, `TT`) trước khi xét cấp tự động và hiển thị cảnh báo/chặn trao nhầm cho học sinh thường trong chế độ trao tay.
