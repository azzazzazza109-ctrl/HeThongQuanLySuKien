# Hệ Thống Quản Lý Sự Kiện (Event Management System)

Chào mừng bạn đến với kho lưu trữ mã nguồn của dự án **Hệ Thống Quản Lý Sự Kiện**. Dự án được thiết kế nhằm mục đích tin học hóa quy trình tổ chức, quản lý và theo dõi các sự kiện, hội thảo, hoặc hoạt động nội bộ một cách chuyên nghiệp và hiệu quả.

Dự án được phát triển theo kiến trúc tách biệt giữa **Frontend** (Giao diện người dùng) và **Backend** (Máy chủ xử lý logic) để dễ dàng bảo trì và mở rộng.

## 🌟 Tính năng dự kiến

*(Lưu ý: Bạn hãy kiểm tra và cập nhật lại các tính năng cho khớp với code thực tế của mình)*

Hệ thống bao gồm các phân hệ chức năng chính sau:

- **Quản lý Sự kiện:** Tạo mới, cập nhật thông tin, và quản lý trạng thái các sự kiện.
- **Quản lý Người tham gia:** Đăng ký tham gia sự kiện, phê duyệt danh sách người tham dự.
- **Điểm danh:** Hỗ trợ điểm danh người tham gia (có thể tích hợp mã QR).
- **Báo cáo & Thống kê:** Thống kê số lượng người tham gia, xuất danh sách báo cáo.
- **Phân quyền Hệ thống:** Phân chia vai trò (Quản trị viên, Ban tổ chức, Người tham dự).

## 🛠 Công nghệ sử dụng

*(Vui lòng cập nhật chính xác các công nghệ bạn đã sử dụng)*

- **Backend:** `[Ví dụ: Java Spring Boot / Node.js / C# .NET / PHP]`
- **Frontend:** `[Ví dụ: ReactJS / VueJS / Angular / HTML-CSS-JS thuần]`
- **Cơ sở dữ liệu:** `[Ví dụ: MySQL / SQL Server / PostgreSQL / MongoDB]`
- **Công cụ khác:** Git, Postman, v.v.

## 📂 Cấu trúc thư mục

Dự án được tổ chức theo cấu trúc sau:

- `backend/`: Mã nguồn xử lý logic, API, kết nối Database.
- `frontend/`: Mã nguồn giao diện người dùng.
- `.gitignore`: Cấu hình bỏ qua các file không cần thiết khi commit.

## 🚀 Hướng dẫn cài đặt và chạy dự án

### 1. Yêu cầu hệ thống (Prerequisites)
Đảm bảo máy tính của bạn đã cài đặt các môi trường cần thiết (tùy thuộc vào công nghệ bạn chọn):
- Đã cài đặt `[Node.js / JDK / PHP]`
- Đã cài đặt hệ quản trị cơ sở dữ liệu `[MySQL / SQL Server...]`

### 2. Cài đặt Backend
```bash
# Di chuyển vào thư mục backend
cd backend

# Cài đặt các thư viện phụ thuộc (tùy ngôn ngữ)
# Ví dụ với Node.js: npm install
# Ví dụ với Java: mvn clean install

# Cấu hình file kết nối Database (nếu có)
# ...

# Chạy server backend
# Ví dụ: npm start (hoặc lệnh tương ứng với framework của bạn)
