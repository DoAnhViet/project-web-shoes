# Hệ Thống Xác Thực (Authentication System)

## 📋 Tổng Quan

Hệ thống xác thực đã được xây dựng hoàn chỉnh với:
- ✅ Trang đăng nhập/đăng ký
- ✅ JWT token authentication
- ✅ Bảo vệ route (Protected Routes)
- ✅ Trang thông tin cá nhân
- ✅ Context/Hook xử lý auth

## 🏗️ Kiến Trúc

### Frontend (React)

#### 1. **AuthContext** - `src/context/AuthContext.jsx`
Context quản lý toàn bộ trạng thái xác thực:
```javascript
const { 
  user,              // Thông tin user đang đăng nhập
  isLoading,         // Trạng thái đang tải
  error,             // Thông báo lỗi
  isAuthenticated,   // Boolean: đã đăng nhập?
  register,          // Hàm đăng ký
  login,             // Hàm đăng nhập
  logout,            // Hàm đăng xuất
  updateProfile      // Hàm cập nhật thông tin
} = useAuth();
```

#### 2. **useAuth Hook** - `src/context/AuthContext.jsx`
Custom hook để sử dụng AuthContext:
```javascript
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, login, logout } = useAuth();
  // ...
}
```

#### 3. **ProtectedRoute Component** - `src/components/ProtectedRoute.jsx`
Bảo vệ các route cần đăng nhập:
```javascript
<Route
  path="/profile"
  element={
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  }
/>
```

#### 4. **Pages**
- **Login** (`src/pages/Login.jsx`) - Trang đăng nhập
- **Register** (`src/pages/Register.jsx`) - Trang đăng ký
- **Profile** (`src/pages/Profile.jsx`) - Trang thông tin cá nhân

#### 5. **Navigation Component** - `src/components/Navigation.jsx`
Thanh điều hướng hiển thị nút login/logout

### Backend (.NET)

#### 1. **User Model** - `Models/User.cs`
```csharp
public class User
{
    public int Id { get; set; }
    public string FullName { get; set; }
    public string Email { get; set; }
    public string PasswordHash { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsActive { get; set; }
}
```

#### 2. **DTOs** - `DTOs/AuthDto.cs`
- `RegisterRequestDto` - Dữ liệu đăng ký
- `LoginRequestDto` - Dữ liệu đăng nhập
- `UpdateProfileDto` - Cập nhật thông tin
- `UserDto` - Thông tin user trả về
- `AuthResponseDto` - Kết quả đăng nhập/đăng ký

#### 3. **Services**

**TokenService** - `Services/TokenService.cs`
- Tạo JWT token
- Quản lý thời hạn token (24 giờ)

**AuthService** - `Services/AuthService.cs`
- `RegisterAsync()` - Đăng ký user mới
- `LoginAsync()` - Đăng nhập
- `GetProfileAsync()` - Lấy thông tin profile
- `UpdateProfileAsync()` - Cập nhật profile

#### 4. **Repository Pattern** - `Repositories/`
**IUserRepository** & **UserRepository**
- Quản lý truy cập dữ liệu User từ database

#### 5. **AuthController** - `Controllers/AuthController.cs`
Endpoints:
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/profile` - Lấy profile (cần token)
- `PUT /api/auth/profile` - Cập nhật profile (cần token)

#### 6. **JWT Authentication** - `Program.cs`
- Cấu hình JWT Bearer authentication
- Secret key: `your-secret-key-min-32-chars-long!`
- Expiration: 24 giờ

## 🔄 Luồng Hoạt Động

### Đăng Ký
```
Frontend (Register.jsx)
    ↓
Call AuthService.register()
    ↓
API POST /api/auth/register
    ↓
Backend AuthController
    ↓
Check email exists → Hash password → Create user → Generate token
    ↓
Return { user, token }
    ↓
Save to localStorage
    ↓
Auto-login & Redirect to Home
```

### Đăng Nhập
```
Frontend (Login.jsx)
    ↓
Call AuthService.login()
    ↓
API POST /api/auth/login
    ↓
Backend AuthController
    ↓
Verify credentials → Generate token
    ↓
Return { user, token }
    ↓
Save to localStorage
    ↓
Redirect to Home
```

### Truy Cập Protected Route
```
User tries to access /profile
    ↓
ProtectedRoute checks useAuth()
    ↓
If isAuthenticated === true → Render component
If isAuthenticated === false → Redirect to /login
```

## 🧪 Cách Sử Dụng

### Đăng Ký
1. Vào `http://localhost:5173/register`
2. Điền thông tin:
   - Họ và tên
   - Email
   - Mật khẩu (tối thiểu 6 ký tự)
   - Xác nhận mật khẩu
3. Click "Đăng Ký"
4. Tự động đăng nhập và về trang chủ

### Đăng Nhập
1. Vào `http://localhost:5173/login`
2. Điền email & mật khẩu
3. Click "Đăng Nhập"
4. Về trang chủ (đã đăng nhập)

### Xem Thông Tin Cá Nhân
1. Click nút "👤 [Tên User]" ở thanh Navigation
2. Hoặc vào `http://localhost:5173/profile`
3. Xem/chỉnh sửa thông tin

### Đăng Xuất
- Click "Đăng Xuất" ở thanh Navigation
- Token bị xóa khỏi localStorage
- Redirect về Login page

## 🔐 Bảo Mật

### Frontend
- Token lưu trong `localStorage`
- Tự động gửi token trong header `Authorization: Bearer <token>`
- ProtectedRoute kiểm tra trước khi render

### Backend
- Mật khẩu được hash bằng **BCrypt**
- JWT validation cho mọi protected endpoint
- Sử dụng `[Authorize]` attribute

## 📝 Tệp Tạo Mới

### Frontend
- `src/context/AuthContext.jsx` - Auth context & hook
- `src/pages/Login.jsx` - Trang đăng nhập
- `src/pages/Register.jsx` - Trang đăng ký
- `src/pages/Profile.jsx` - Trang hồ sơ
- `src/pages/Auth.css` - Style trang auth
- `src/pages/Profile.css` - Style trang profile
- `src/components/ProtectedRoute.jsx` - Component bảo vệ route
- `src/components/Navigation.jsx` - Thanh điều hướng
- `src/components/Navigation.css` - Style navigation

### Backend
- `Models/User.cs` - Model User
- `DTOs/AuthDto.cs` - DTO cho auth
- `Services/TokenService.cs` - Tạo JWT token
- `Services/AuthService.cs` - Business logic auth
- `Repositories/Interfaces/IUserRepository.cs` - Interface repository
- `Repositories/Implementations/UserRepository.cs` - Repository implementation
- `Controllers/AuthController.cs` - Auth controller
- `Migrations/[timestamp]_AddUserModel.cs` - Migration cho Users table

## 🔧 Cấu Hình

### appsettings.Development.json
```json
{
  "JwtSettings": {
    "SecretKey": "your-secret-key-min-32-chars-long-here!",
    "ExpirationHours": 24
  }
}
```

### CORS
Đã cấu hình cho `http://localhost:5173`

## ⚙️ Các Routes Được Bảo Vệ
- `/profile` - Xem/chỉnh sửa thông tin cá nhân
- `/orders` - Xem đơn hàng (cần đăng nhập)

## 🚀 Tiếp Theo Có Thể Thêm
- [ ] Forgot password / Reset password
- [ ] Email verification
- [ ] 2FA (Two-Factor Authentication)
- [ ] OAuth (Google, Facebook)
- [ ] Role-based access control (Admin, User)
- [ ] User avatar/profile picture
- [ ] Change password feature
- [ ] Account deletion

---

**Hệ thống xác thực đã sẵn sàng sử dụng! 🎉**
