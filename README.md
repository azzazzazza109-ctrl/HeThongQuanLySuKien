# 🎓 CMCU Event - Hệ Thống Quản Lý Sự Kiện Trường Đại Học CMC

> Nền tảng quản lý, đăng ký và điểm danh sự kiện tự động dành riêng cho sinh viên và cán bộ Trường Đại học CMC (CMC University). Ứng dụng giao diện phong cách **Glassmorphism** hiện đại kết hợp công nghệ **QR Code Check-in** thời gian thực.

---

## 📌 Mục Lục
- [Giới Thiệu](#-giới-thiệu)
- [Tính Năng Nổi Bật](#-tính-năng-nổi-bật)
- [Công Nghệ Sử Dụng (Tech Stack)](#-công-nghệ-sử-dụng-tech-stack)
- [Cấu Trúc Thư Mục](#-cấu-trúc-thư-mục)
- [Hướng Dẫn Cài Đặt & Khởi Chạy](#-hướng-dẫn-cài-đặt--khởi-chạy)
- [Tài Khoản Trải Nghiệm Demo](#-tài-khoản-trải-nghiệm-demo)
- [Thành Viên Thực Hiện](#-thành-viên-thực-hiện)

---

## 🌟 Giới Thiệu
**CMCU Event** giúp số hóa quy trình tổ chức sự kiện tại trường đại học:
- Loại bỏ khâu điểm danh thủ công bằng giấy tờ nhờ hệ thống vé điện tử tích hợp mã QR Code cá nhân.
- Tự động hóa kiểm soát số lượng chỗ ngồi, điều kiện sinh viên theo từng Khoa/Khóa (Cohort/Faculty).
- Giúp Ban tổ chức phân công nhiệm vụ và theo dõi tiến độ sự kiện trực quan.

---

## 🚀 Tính Năng Nổi Bật

### 1. Phân hệ Sinh viên (Student)
- 🔍 **Duyệt & Tìm kiếm sự kiện:** Lọc sự kiện theo khoa, thời gian, trạng thái (Đang mở, Đã đầy, Đã đóng).
- 🎫 **Đăng ký & Nhận vé tức thì:** Hệ thống kiểm tra điều kiện (khoa/khóa/sức chứa) và cấp vé điện tử kèm mã QR Code định danh.
- ⏰ **Hủy vé linh hoạt:** Tự hủy vé trước hạn định (`cancel_deadline_hours`) để nhường cơ hội cho sinh viên khác.
- 📱 **Ví vé của tôi (`My Tickets`):** Lưu trữ vé đã đăng ký, hiển thị mã QR sẵn sàng quét khi tham gia sự kiện.

### 2. Phân hệ Cán bộ / Ban tổ chức (Staff)
- 📷 **Quét mã QR Check-in:** Quét mã QR trực tiếp qua Camera điện thoại/laptop (tích hợp thư viện `html5-qrcode`).
- ⚡ **Xác thực tức thời:** Thông báo kết quả điểm danh ngay lập tức, ngăn ngừa vé trùng lặp hoặc vé không hợp lệ.
- 📋 **Quản lý nhiệm vụ (`Manage Tasks`):** Tiếp nhận và cập nhật trạng thái các đầu việc được giao trong từng sự kiện.

### 3. Phân hệ Quản trị viên (Admin)
- ➕ **Tạo & Cấu hình sự kiện:** Thiết lập số lượng chỗ ngồi, hạn hủy vé, điều kiện khoa/khóa tham gia, phân công nhân sự.
- 📊 **Thống kê & Báo cáo (Dashboard):** Biểu đồ tỷ lệ đăng ký, tỷ lệ tham gia thực tế (check-in rate).
- 📑 **Quản lý & Duyệt:** Điều chỉnh trạng thái sự kiện, xuất danh sách người tham dự.

---

## 🛠 Công Nghệ Sử Dụng (Tech Stack)

### **Frontend**
- **Framework:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Routing:** [React Router v7](https://reactrouter.com/)
- **HTTP Client:** [Axios](https://axios-http.com/)
- **QR Engine:** `html5-qrcode` (Quét QR qua Camera), `qrcode.react` (Tạo mã QR vé)
- **UI & Styling:** Custom Modern CSS (Phong cách Glassmorphism trong suốt, responsive)

### **Backend**
- **Runtime:** [Node.js](https://nodejs.org/) (Express.js)
- **Authentication:** JSON Web Token (JWT) & bcryptjs
- **Database Driver:** `mssql` & `tedious`

### **Cơ Sở Dữ Liệu (Database)**
- **RDBMS:** Microsoft SQL Server (MSSQL)
- **Thiết kế:** Chuẩn hóa quan hệ gồm các bảng `users`, `faculties`, `events`, `event_eligibility`, `tickets`, `staff_tasks`.

---

## 📂 Cấu Trúc Thư Mục

```text
HeThongQuanLySuKien/
├── backend/
│   ├── src/
│   │   ├── config/          # Cấu hình kết nối SQL Server (db.js)
│   │   ├── routes/          # API Routes (auth, events, tickets, admin)
│   │   └── services/        # Logic nghiệp vụ (qrService, capacityService,...)
│   ├── .env                 # Cấu hình biến môi trường
│   ├── server.js            # Điểm khởi động Server Express
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/             # Cấu hình gọi Axios API
│   │   ├── components/      # UI components tái sử dụng, ProtectedRoute, Layout
│   │   ├── context/         # AuthContext lưu trạng thái đăng nhập
│   │   ├── pages/           # Màn hình giao diện (Login, EventList, Checkin,...)
│   │   │   └── admin/       # Các trang quản trị (Dashboard, Approvals, Events)
│   │   ├── App.jsx          # Cấu hình Route
│   │   └── main.jsx
│   └── package.json
│
├── database/                # Scripts khởi tạo DB (schema.sql, seed_data.sql)
├── .gitignore
└── README.md
```

---

## 💻 Hướng Dẫn Cài Đặt & Khởi Chạy

### Yêu Cầu Tiên Quyết
- [Node.js](https://nodejs.org/) (phiên bản 18+ hoặc 20+)
- [Microsoft SQL Server](https://www.microsoft.com/sql-server) hoặc SQL Server Express / Docker SQL Server

---

### Bước 1: Thiết Lập Cơ Sở Dữ Liệu
1. Mở **SQL Server Management Studio (SSMS)** hoặc công cụ quản trị CSDL của bạn.
2. Tạo database mới:
   ```sql
   CREATE DATABASE cmcu_event_db;
   GO
   ```
3. Chạy lần lượt các file script trong thư mục `database/`:
   - `schema.sql`: Khởi tạo bảng và ràng buộc khóa ngoại.
   - `seed_data.sql`: Dữ liệu mẫu (khoa, tài khoản, sự kiện ban đầu).

---

### Bước 2: Cài Đặt & Chạy Backend
1. Di chuyển vào thư mục backend:
   ```bash
   cd backend
   ```
2. Cài đặt các thư viện:
   ```bash
   npm install
   ```
3. Tạo file `.env` tại thư mục `backend/` và cấu hình tài khoản kết nối SQL Server:
   ```env
   PORT=3000
   DB_SERVER=localhost
   DB_USER=sa
   DB_PASSWORD=your_password
   DB_NAME=cmcu_event_db
   JWT_SECRET=cmcu_secret_key
   ```
4. Khởi chạy server:
   ```bash
   npm start
   # Server sẽ chạy tại: http://localhost:3000
   ```

---

### Bước 3: Cài Đặt & Chạy Frontend
1. Mở terminal mới, di chuyển vào thư mục frontend:
   ```bash
   cd frontend
   ```
2. Cài đặt các thư viện:
   ```bash
   npm install
   ```
3. Chạy ứng dụng ở chế độ Development:
   ```bash
   npm run dev
   # Truy cập ứng dụng tại: http://localhost:5173
   ```

---

## 🔑 Tài Khoản Trải Nghiệm Demo

Bạn có thể dùng các tài khoản mẫu có sẵn trong `seed_data.sql` để kiểm thử các phân quyền:

| Phân Quyền | Mã Đăng Nhập / Email | Mật Khẩu | Họ Và Tên | Quyền Hạn |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `bao.pq@cmcu.edu.vn` *(hoặc ADMIN001)* | `123456` | Phạm Quốc Bảo | Quản trị toàn bộ hệ thống, Dashboard, tạo sự kiện |
| **Staff** | `huong.nt@cmcu.edu.vn` *(hoặc STAFF001)* | `123456` | Nguyễn Thị Hương | Quét mã QR check-in, quản lý công việc sự kiện |
| **Student** | `bit250001@st.cmcu.edu.vn` *(hoặc BIT250001)* | `123456` | Trần Long | Đăng ký sự kiện, xem vé cá nhân, hủy vé |
| **Student** | `bit250002@st.cmcu.edu.vn` *(hoặc BIT250002)* | `123456` | Bùi Anh Tú | Sinh viên tham gia đăng ký sự kiện |

---

## 👥 Thành Viên Thực Hiện

Dự án được xây dựng và phát triển bởi:
- **Trần Long** ([@azzazzazza109-ctrl](https://github.com/azzazzazza109-ctrl))
- **Bùi Anh Tú** ([@buitu2916-creator](https://github.com/buitu2916-creator))
- **Nguyễn Thị Yến Nhi** ([@Justnnhuy](https://github.com/Justnnhuy))
- **Trần Lâm** ([@LamTran0511](https://github.com/LamTran0511))
---
*Trường Đại học CMC (CMC University) - Khoa Công nghệ Thông tin & Truyền thông*
