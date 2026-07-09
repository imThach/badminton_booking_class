# 🏸 Project 8 — Badminton Class Booking System (Fullstack)

## 📝 Mô tả dự án
Ứng dụng quản lý và đăng ký lớp học cầu lông. Admin có thể tạo lớp học, quản lý học viên và giới hạn số lượng học viên trong mỗi lớp. Người dùng có thể xem lịch học, đăng ký tham gia và quản lý các lớp đã đăng ký. Đây là project đầu tiên intern tự kết nối Frontend với Backend do chính mình viết.

## 📊 Cơ sở dữ liệu & Các Thực thể (Entities)

### 1. User
- `role`: `admin` | `user`

### 2. Class
- `title`: String
- `description`: String
- `coachName`: String
- `level`: `beginner` | `intermediate` | `advanced`
- `startDate`: Date
- `schedule`: String
- `location`: String
- `maxStudents`: Number
- `createdBy`: ObjectId (ref → `User`)

### 3. Enrollment
- `class`: ObjectId (ref → `Class`)
- `user`: ObjectId (ref → `User`)
- `enrolledAt`: Date

## 🚀 Chức năng chính (Features)

### 🌐 Public
- [ ] Xem danh sách lớp học sắp khai giảng
- [ ] Tìm kiếm lớp học theo tên
- [ ] Lọc lớp học theo trình độ
- [ ] Xem chi tiết lớp học

### 👥 User
- [ ] Đăng ký tham gia lớp học (yêu cầu đăng nhập)
- [ ] Hủy đăng ký lớp học
- [ ] Xem danh sách các lớp đã đăng ký

### 👑 Admin
- [ ] Tạo lớp học mới
- [ ] Chỉnh sửa thông tin lớp học
- [ ] Xóa lớp học
- [ ] Xem danh sách học viên của từng lớp

## ⚠️ Quy tắc nghiệp vụ (Business Rules)
1. Không thể đăng ký trùng một lớp học.
2. Không thể đăng ký khi lớp học đã đủ số lượng học viên.
3. Chỉ Admin mới được tạo, chỉnh sửa và xóa lớp học.
4. Mỗi lớp học phải hiển thị số lượng học viên hiện tại và số lượng tối đa.

## 🧠 Kiến thức tích lũy (Topics Learned)
- **Axios:** Thực hiện các phương thức GET, POST, PATCH, DELETE từ React, attach JWT vào headers.
- **React Query (@tanstack/react-query):** Xử lý caching, refetching, mutations để đồng bộ dữ liệu UI/UX.
- **Authentication & Authorization:** Phân quyền dựa trên vai trò (Role-based Access Control - RBAC).
- **CORS configuration:** Cấu hình chia sẻ tài nguyên đa nguồn giữa các domain khác nhau.
- **Environment variables:** Quản lý biến môi trường an toàn trên cả Frontend và Backend.
- **Authentication flow end-to-end:** Luồng đăng nhập hoàn chỉnh từ client đến server: login → lưu token → gọi protected API.
- **Many-to-many relationship:** Thiết kế mối quan hệ nhiều-nhiều qua trung gian `Enrollment` model.
- **UI Optimization:** Xử lý Search, Filter, Pagination, Loading states, empty states và Error boundaries.
- **Protected Routes:** Bảo vệ các tuyến đường điều hướng trên Frontend.
- **Deployment:** Quy trình deploy hoàn chỉnh FE lên Vercel và BE lên Render trong môi trường chạy thực tế.

## Email OTP với Nodemailer

Ứng dụng sử dụng Nodemailer để gửi mã OTP khi đăng ký tài khoản.
Cấu hình SMTP trong `server/.env`:
- [ ] EMAIL_HOST=smtp.gmail.com
- [ ] EMAIL_PORT=465
- [ ] EMAIL_SECURE=true
- [ ] EMAIL_REQUIRE_TLS=false
- [ ] EMAIL_USER=your_email@gmail.com
- [ ] EMAIL_PASS=your_google_app_password
- [ ] EMAIL_FROM=Badminton Booking <your_email@gmail.com>

## 🎯 Tiêu chí hoàn thành (Done Criteria)
- [ ] Danh sách lớp học hiển thị đúng, có loading state
- [ ] Tìm kiếm và lọc lớp học hoạt động
- [ ] Đăng ký / hủy đăng ký lớp học hoạt động, cập nhật realtime qua React Query
- [ ] Không thể đăng ký trùng lớp học
- [ ] Không thể đăng ký khi lớp học đã đủ chỗ
- [ ] User xem được danh sách lớp đã đăng ký
- [ ] Chỉ Admin mới được tạo, chỉnh sửa và xóa lớp học
- [ ] Danh sách học viên hiển thị chính xác
- [ ] CORS được cấu hình đúng
- [ ] FE deployed Vercel, BE deployed Render, kết nối hoạt động
- [ ] Không có API key hay secret nào bị expose trong code
