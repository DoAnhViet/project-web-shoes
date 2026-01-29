# Web Bán Giày - Hướng dẫn cài đặt và chạy

## 🎯 Mô tả dự án
Hệ thống web bán giày với:
- **Backend**: ASP.NET Core Web API + MySQL
- **Frontend**: React (Vite)
- Trang chủ hiển thị sản phẩm với tìm kiếm và lọc
- Trang Admin quản lý sản phẩm (CRUD)

## 📋 Yêu cầu hệ thống
- .NET 6.0 SDK trở lên
- Node.js 16+ và npm
- MySQL Server (hoặc cloud MySQL từ DBeaver)

## 🚀 Hướng dẫn cài đặt

### 1. Cấu hình Database

#### Cập nhật connection string trong `WebBanGiay.API/appsettings.json`:
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=YOUR_HOST;Port=3306;Database=WebBanGiayDB;User=YOUR_USER;Password=YOUR_PASSWORD;"
}
```

Thay đổi:
- `YOUR_HOST`: địa chỉ MySQL server (localhost hoặc cloud host từ DBeaver)
- `YOUR_USER`: username MySQL
- `YOUR_PASSWORD`: password MySQL

#### Tạo database và migration:
```bash
cd WebBanGiay.API
dotnet ef migrations add InitialCreate
dotnet ef database update
```

### 2. Chạy Backend API

```bash
cd WebBanGiay.API
dotnet run
```

API sẽ chạy tại: `https://localhost:7000` (hoặc port khác - xem console)

⚠️ **Quan trọng**: Cập nhật port trong file `client/src/api/api.js` nếu khác:
```javascript
const API_BASE_URL = 'https://localhost:7000/api';
```

### 3. Chạy Frontend React

```bash
cd client
npm install
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

## 📂 Cấu trúc dự án

```
WebBanGiay/
├── WebBanGiay.API/              # Backend API
│   ├── Controllers/             # API Controllers
│   │   ├── ProductsController.cs
│   │   └── CategoriesController.cs
│   ├── Models/                  # Models
│   │   ├── Product.cs
│   │   └── Category.cs
│   ├── Data/                    # DbContext
│   │   └── ApplicationDbContext.cs
│   ├── appsettings.json        # Cấu hình (connection string)
│   └── Program.cs
│
└── client/                      # Frontend React
    ├── src/
    │   ├── api/                 # API calls
    │   │   └── api.js
    │   ├── pages/               # Pages
    │   │   ├── Home.jsx        # Trang chủ
    │   │   ├── Home.css
    │   │   ├── Admin.jsx       # Trang admin
    │   │   └── Admin.css
    │   ├── App.jsx             # Routing
    │   └── main.jsx
    └── package.json
```

## 🔥 Tính năng

### Trang chủ (/)
- Hiển thị danh sách sản phẩm giày
- Tìm kiếm theo tên
- Lọc theo danh mục
- Lọc theo thương hiệu
- Hiển thị thông tin: giá, kích cỡ, màu sắc, tồn kho

### Trang Admin (/admin)
- Xem danh sách tất cả sản phẩm dạng bảng
- Thêm sản phẩm mới
- Sửa thông tin sản phẩm
- Xóa sản phẩm

## 🗄️ Database Schema

### Table: Categories
- Id (int, PK)
- Name (string)
- Description (string)

### Table: Products
- Id (int, PK)
- Name (string)
- Description (string)
- Price (decimal)
- Stock (int)
- ImageUrl (string)
- CategoryId (int, FK)
- Brand (string)
- Size (string)
- Color (string)
- CreatedAt (DateTime)

## 📡 API Endpoints

### Products
- `GET /api/products` - Lấy danh sách sản phẩm (có filter)
- `GET /api/products/{id}` - Lấy chi tiết sản phẩm
- `POST /api/products` - Tạo sản phẩm mới
- `PUT /api/products/{id}` - Cập nhật sản phẩm
- `DELETE /api/products/{id}` - Xóa sản phẩm

### Categories
- `GET /api/categories` - Lấy danh sách danh mục
- `GET /api/categories/{id}` - Lấy chi tiết danh mục
- `POST /api/categories` - Tạo danh mục mới
- `PUT /api/categories/{id}` - Cập nhật danh mục
- `DELETE /api/categories/{id}` - Xóa danh mục

## 🛠️ Troubleshooting

### Lỗi kết nối MySQL
- Kiểm tra MySQL server đang chạy
- Kiểm tra connection string trong `appsettings.json`
- Kiểm tra firewall cho phép kết nối đến MySQL

### Lỗi CORS
- Đảm bảo backend đang chạy
- Kiểm tra CORS policy trong `Program.cs` cho phép origin của React app

### Port đã được sử dụng
- Đổi port trong `launchSettings.json` (backend)
- Đổi port trong `vite.config.js` (frontend)

## 📝 Dữ liệu mẫu

Database đã có sẵn seed data với:
- 3 danh mục: Giày thể thao, Giày công sở, Giày sneaker
- 3 sản phẩm mẫu: Nike Air Max 270, Adidas Ultraboost, Giày da Oxford

## 🎨 Tech Stack

**Backend:**
- ASP.NET Core 6.0
- Entity Framework Core
- Pomelo.EntityFrameworkCore.MySql
- MySQL

**Frontend:**
- React 18
- Vite
- React Router DOM
- Axios
- CSS3

---

**Tác giả**: GitHub Copilot
**Ngày tạo**: 2026-01-28
