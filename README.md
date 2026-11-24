# BÁO CÁO MÃ NGUỒN CÁ NHÂN - HỆ THỐNG QUẢN LÝ SỰ KIỆN (CMCU EVENT)

## 📌 1. Thông tin sinh viên
- **Họ và tên:** Bùi Anh Tú
- **Mã sinh viên:** BAI250067
- **Lớp:** 25AI
- **Nhánh phụ trách:** `Tú`
- **Vai trò trong nhóm:** Backend nghiệp vụ / Phụ trách Quản trị hệ thống (Admin)

---

## 📂 2. Cấu trúc mã nguồn cá nhân phụ trách

Nhánh này lưu trữ độc lập 5 tệp mã nguồn do sinh viên **Bùi Anh Tú** trực tiếp xây dựng và phụ trách theo đúng Bảng phân công công việc trong Báo cáo Đồ án:

```text
├── backend/
│   └── src/
│       ├── routes/
│       │   └── adminRoutes.js           # API Quản trị viên (Khởi tạo sự kiện, Tasks, Export CSV)
│       └── services/
│           ├── eligibilityService.js    # Logic kiểm tra điều kiện sinh viên theo Khóa / Khoa
│           └── qrService.js             # Logic sinh mã vé, nonce & mã băm SHA-256
└── frontend/
    └── src/
        └── pages/
            ├── CreateEvent.jsx          # Giao diện tạo sự kiện & cấu hình điều kiện Khóa tham dự
            └── admin/
                └── AdminEvents.jsx      # Giao diện danh sách sự kiện Quản trị viên
```

---

## 🛠️ 3. Chi tiết chức năng & Đối chiếu User Story (Theo Báo cáo)

### A. Phía Backend (Node.js / Express)

1. **`backend/src/services/qrService.js`**
   - **User Story liên quan:** `US-ST-02` *(Ràng buộc khung giờ & Chống quét trùng QR)*.
   - **Các hàm export chính:**
     - `generateTicketCode(eventId, studentCode)`: Tạo định dạng mã vé duy nhất dạng `TK-E{eventId}-{studentCode}`.
     - `generateQrToken(ticketCode)`: Kết hợp `ticketCode`, `QR_SECRET`, `timestamp` và `nonce` ngẫu nhiên (8 bytes hex), sau đó băm SHA-256 để **hạn chế đoán mò và chống trùng lặp mã QR**.
     - `isValidQrFormat(qrToken)`: Kiểm tra định dạng chuỗi hex SHA-256 đủ 64 ký tự hợp lệ.

2. **`backend/src/services/eligibilityService.js`**
   - **User Story liên quan:** `US-SV-01` *(Lọc sự kiện theo điều kiện Khóa/Khoa)*, `US-AD-02` *(Cấu hình bộ lọc đối tượng)*.
   - **Chức năng chính:**
     - Truy vấn danh sách điều kiện từ bảng `event_eligibility` theo `event_id`.
     - So khớp dữ liệu Khóa học (`cohort`) và Khoa (`faculty_id`) của sinh viên đăng ký với điều kiện sự kiện quy định.
     - Trả về `{ ok: true }` khi hợp lệ hoặc từ chối `{ ok: false, message: '...' }` giải thích rõ lý do sinh viên không đủ điều kiện.

3. **`backend/src/routes/adminRoutes.js`**
   - **User Story liên quan:** `US-AD-01` *(Khởi tạo sự kiện)*, `US-AD-03` *(Phân công hậu cần)*, `US-AD-04` *(Xuất danh sách điểm danh)*, `US-AD-06` *(Theo dõi tiến độ)*.
   - **Chức năng chính:**
     - Sử dụng middleware `requireAdminOrStaff` kiểm tra quyền hạn; riêng các endpoint `POST /tasks` và `DELETE /tasks/:id` có thêm tầng kiểm tra phân quyền chặt chẽ `if (actor.system_role !== 'ADMIN')`.
     - `POST /events`: Tạo sự kiện mới, hỗ trợ lưu trữ đồng thời sức chứa tối đa và cấu hình mảng điều kiện tham gia (`event_eligibility`).
     - `PUT /events/:id`: Cập nhật thông tin sự kiện hoặc cập nhật trạng thái đóng/mở sự kiện.
     - `GET /events/:id/export`: Trích xuất danh sách sinh viên đã điểm danh thực tế (`checkin_status === 'CHECKED_IN'`) ra tệp CSV.
     - `GET /tasks`, `POST /tasks`, `DELETE /tasks/:id`: Quản lý các đầu việc chuẩn bị sự kiện cho Ban tổ chức.

---

### B. Phía Frontend (React)

4. **`frontend/src/pages/CreateEvent.jsx`**
   - **Đường dẫn Route:** `/admin/create`
   - **User Story liên quan:** `US-AD-01`, `US-AD-02`.
   - **Chức năng chính:**
     - Form thiết lập thông tin sự kiện: Tên, địa điểm, thời gian, sức chứa tối đa quản lý qua state `seat_capacity` (mặc định 100).
     - Cấu hình điều kiện tham dự: Cho phép tích chọn các **Khóa học hợp lệ (`K1` đến `K4`)** để đóng gói mảng `eligibility` gửi xuống API `POST /api/admin/events`.
     - Lưu trữ bổ sung thông tin Khoa/Đơn vị phụ trách phục vụ hiển thị nhãn banner sự kiện.

5. **`frontend/src/pages/admin/AdminEvents.jsx`**
   - **Đường dẫn Route:** `/admin/events`
   - **User Story liên quan:** `US-AD-01`, `US-AD-03`.
   - **Chức năng chính:**
     - Bảng danh sách sự kiện quản trị với các nhãn trạng thái trực quan: **Đang mở (`OPEN`)**, **Hết chỗ (`FULL`)**, **Đã đóng (`CLOSED`)**, **Chờ duyệt (`PENDING`)**.
     - Thống kê nhanh KPI: Tổng số sự kiện, số sự kiện mở/đóng, tổng lượt đăng ký và tỷ lệ lấp đầy (`fillRate`).
     - Hàng nút thao tác nhanh trên mỗi sự kiện: **Chi tiết** (chuyển sang trang xem & xuất CSV), **Sửa** (cập nhật thông tin) và **Quét** (chuyển nhanh đến camera check-in QR).

---

## 🚀 4. Hướng dẫn cài đặt & Kịch bản kiểm thử chương trình

> ⚠️ **Lưu ý:** Nhánh `Tú` này chỉ lưu trữ các tệp mã nguồn độc lập do sinh viên Bùi Anh Tú phụ trách để phục vụ đối chiếu và chấm điểm báo cáo cá nhân. Để chạy toàn bộ hệ thống hoàn chỉnh (Backend + Frontend + Database), vui lòng sử dụng nhánh `main` của dự án.

### 4.1. Khởi chạy hệ thống trên môi trường Local
1. **Khởi chạy Backend (Node.js / Express):**
   ```bash
   cd backend
   npm install
   npm start      # Server chạy tại http://localhost:3000
   ```

2. **Khởi chạy Frontend (React / Vite):**
   ```bash
   cd frontend
   npm install
   npm run dev    # Client chạy tại http://localhost:3001
   ```

---

### 4.2. Kịch bản Demo kiểm thử 5 chức năng phụ trách (Phục vụ vấn đáp bảo vệ)

1. **Khởi tạo sự kiện & Cấu hình đối tượng (`CreateEvent.jsx` $\rightarrow$ `adminRoutes.js`):**
   - Đăng nhập với tài khoản có quyền Quản trị (Admin/Staff).
   - Truy cập `/admin/create`, điền thông tin sự kiện, cấu hình `seat_capacity` và tích chọn Khóa cho phép (ví dụ chỉ chọn `K2, K3`).
   - Nhấn **Tạo sự kiện** $\rightarrow$ API `POST /api/admin/events` khởi tạo bản ghi sự kiện và ghi danh sách Khóa vào `event_eligibility`.

2. **Kiểm tra logic phân quyền đối tượng (`eligibilityService.js`):**
   - **Trường hợp hợp lệ:** Tài khoản sinh viên thuộc Khóa `K2` đăng ký $\rightarrow$ Hàm trả về `{ ok: true }` và hệ thống hoàn tất đăng ký.
   - **Trường hợp ngoại lệ (Bị chặn):** Đăng nhập sinh viên Khóa `K1` đăng ký $\rightarrow$ `eligibilityService` so khớp trả về `{ ok: false, message: '...' }` $\rightarrow$ Giao diện thông báo từ chối `403 NOT_ELIGIBLE`.

3. **Sinh mã QR vé sự kiện (`qrService.js`):**
   - Khi sinh viên đăng ký thành công, hàm `generateTicketCode()` và `generateQrToken()` kích hoạt sinh mã vé kèm chuỗi băm hex SHA-256 (64 ký tự).
   - Mã băm được gắn vào mã QR của vé để ứng dụng quét camera đối chiếu và chống trùng lặp.

4. **Quản trị danh sách & Điều hướng thao tác (`AdminEvents.jsx`):**
   - Truy cập `/admin/events`, quan sát danh sách sự kiện hiển thị đúng các badge trạng thái `OPEN`, `FULL`, `CLOSED`, `PENDING`.
   - Sử dụng các nút thao tác nhanh: bấm **Chi tiết** để vào trang đóng sự kiện / tải file CSV báo cáo sinh viên đã điểm danh (`CHECKED_IN`), hoặc bấm **Quét** để mở giao diện quét QR.

