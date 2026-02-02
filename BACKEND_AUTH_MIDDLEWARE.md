# Backend Authentication & Authorization System

## 📋 Tổng Quan Middleware & Phân Quyền

Hệ thống backend đã được hoàn thiện với:
- ✅ JWT Authentication
- ✅ Role-based Authorization (Admin, Customer)
- ✅ Custom Middleware xác thực
- ✅ Global Exception Handling
- ✅ Protected API Endpoints

---

## 🔐 User Model với Role

### UserRole Enum
```csharp
public enum UserRole
{
    Customer = 0,  // Khách hàng thông thường
    Admin = 1      // Quản trị viên
}
```

### User Model
```csharp
public class User
{
    public int Id { get; set; }
    public string FullName { get; set; }
    public string Email { get; set; }
    public string PasswordHash { get; set; }  // BCrypt hashed
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public UserRole Role { get; set; } = UserRole.Customer;  // Mặc định là Customer
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsActive { get; set; } = true;
}
```

---

## 🛡️ JWT Token Service

### TokenService - `Services/TokenService.cs`
Tạo JWT token với Claims:
- `NameIdentifier` - User ID
- `Email` - User Email
- `Role` - User Role (Admin/Customer)

```csharp
public string GenerateToken(int userId, string email, UserRole role)
{
    var claims = new[]
    {
        new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
        new Claim(ClaimTypes.Email, email),
        new Claim(ClaimTypes.Role, role.ToString()),
        new Claim("Role", role.ToString())
    };
    
    // Token expires in 24 hours
    // Secret key from appsettings
}
```

---

## 🔑 Middleware Components

### 1. **JwtMiddleware** - `Middleware/JwtMiddleware.cs`

**Mục đích:** Xác thực token và log thông tin user

```csharp
public class JwtMiddleware
{
    // Validates JWT token from Authorization header
    // Logs user ID, email, and role
    // Token validation handled by JWT Bearer middleware
}
```

**Sử dụng:**
```csharp
app.UseJwtMiddleware();  // Đã thêm trong Program.cs
```

### 2. **ExceptionHandlingMiddleware** - `Middleware/ExceptionHandlingMiddleware.cs`

**Mục đích:** Xử lý tập trung các exception

**Xử lý các loại lỗi:**
- `UnauthorizedAccessException` → 401 Unauthorized
- `InvalidOperationException` → 400 Bad Request  
- `ArgumentException` → 400 Bad Request
- `Exception` (general) → 500 Internal Server Error

**Sử dụng:**
```csharp
app.UseExceptionHandling();  // Đã thêm trong Program.cs
```

---

## 👮 Authorization Attributes

### 1. **RequireRoleAttribute** - `Middleware/RoleAuthorizationAttribute.cs`

Custom authorization filter kiểm tra role của user

```csharp
[RequireRole("Admin", "Customer")]
public async Task<ActionResult> MyAction()
{
    // Chỉ Admin và Customer mới access được
}
```

### 2. **RequireAdminAttribute**

Shortcut cho endpoints chỉ Admin được truy cập

```csharp
[RequireAdmin]  // Chỉ Admin
public async Task<ActionResult> AdminOnlyAction()
{
    // Code here
}
```

**Áp dụng cho:**
- `POST /api/products` - Tạo sản phẩm
- `PUT /api/products/{id}` - Cập nhật sản phẩm
- `DELETE /api/products/{id}` - Xóa sản phẩm

### 3. **RequireCustomerAttribute**

Cho phép cả Customer và Admin (inheritance)

```csharp
[RequireCustomer]  // Customer hoặc Admin
public async Task<ActionResult> CustomerAction()
{
    // Code here
}
```

---

## 🔄 Middleware Pipeline trong Program.cs

```csharp
// 1. CORS configuration
app.UseCors("AllowReactApp");

// 2. Global exception handling
app.UseExceptionHandling();

// 3. JWT middleware for logging
app.UseJwtMiddleware();

// 4. Authentication (verify token)
app.UseAuthentication();

// 5. Authorization (check permissions)
app.UseAuthorization();

// 6. Controller mapping
app.MapControllers();
```

**Thứ tự quan trọng:**
1. CORS trước hết
2. Exception handling sớm nhất
3. JWT middleware sau authentication
4. Authentication trước Authorization
5. Controllers cuối cùng

---

## 📡 Protected API Endpoints

### Public Endpoints (Không cần token)
```
GET  /api/products          - Xem danh sách sản phẩm
GET  /api/products/{id}     - Xem chi tiết sản phẩm
GET  /api/categories        - Xem danh mục
POST /api/auth/register     - Đăng ký
POST /api/auth/login        - Đăng nhập
```

### Customer Endpoints (Cần đăng nhập)
```
GET  /api/auth/profile      - Xem profile
PUT  /api/auth/profile      - Cập nhật profile
POST /api/orders            - Tạo đơn hàng (nếu có)
```

### Admin Only Endpoints
```
POST   /api/products        - Tạo sản phẩm mới
PUT    /api/products/{id}   - Cập nhật sản phẩm
DELETE /api/products/{id}   - Xóa sản phẩm
```

---

## 🧪 Test Authorization

### 1. Register một Admin User (thủ công qua DB)

```sql
-- Tạo admin user (Role = 1)
UPDATE Users 
SET Role = 1 
WHERE Email = 'admin@example.com';
```

### 2. Login và lấy token

```bash
POST http://localhost:5055/api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "yourpassword"
}
```

Response:
```json
{
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "role": "Admin"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Sử dụng token

```bash
POST http://localhost:5055/api/products
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "New Product",
  "price": 100000,
  ...
}
```

**Kết quả:**
- ✅ Admin: 200 OK, tạo sản phẩm thành công
- ❌ Customer: 403 Forbidden
- ❌ No token: 401 Unauthorized

---

## 🔍 Claims trong JWT Token

```csharp
// Trong Controller, lấy thông tin từ token:
var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
var userEmail = User.FindFirst(ClaimTypes.Email)?.Value;
var userRole = User.FindFirst("Role")?.Value;  // "Admin" hoặc "Customer"
```

**Example trong AuthController:**
```csharp
[HttpGet("profile")]
[Authorize]
public async Task<ActionResult<UserDto>> GetProfile()
{
    var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
    var user = await _authService.GetProfileAsync(userId);
    return Ok(user);
}
```

---

## 🚦 Response Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Thành công |
| 400 | Bad Request | Dữ liệu không hợp lệ |
| 401 | Unauthorized | Chưa đăng nhập hoặc token không hợp lệ |
| 403 | Forbidden | Không có quyền truy cập |
| 404 | Not Found | Không tìm thấy resource |
| 500 | Server Error | Lỗi server |

---

## 📝 Các File Đã Tạo/Cập Nhật

### Models
- ✅ `Models/User.cs` - Thêm Role field & UserRole enum

### Middleware
- ✅ `Middleware/JwtMiddleware.cs` - JWT validation & logging
- ✅ `Middleware/ExceptionHandlingMiddleware.cs` - Global exception handling
- ✅ `Middleware/RoleAuthorizationAttribute.cs` - Role-based authorization

### Services
- ✅ `Services/TokenService.cs` - Cập nhật để thêm Role vào token
- ✅ `Services/AuthService.cs` - Cập nhật MapToUserDto

### Controllers
- ✅ `Controllers/ProductsController.cs` - Thêm [RequireAdmin] cho POST/PUT/DELETE

### DTOs
- ✅ `DTOs/AuthDto.cs` - Thêm Role field vào UserDto

### Configuration
- ✅ `Program.cs` - Đăng ký middleware & authentication pipeline

### Database
- ✅ Migration `AddUserRole` - Thêm Role column vào Users table

---

## 🔧 Configuration

### appsettings.Development.json
```json
{
  "JwtSettings": {
    "SecretKey": "your-secret-key-min-32-chars-long-here!",
    "ExpirationHours": 24
  }
}
```

---

## 📊 Luồng Hoạt Động

### Request với Token
```
Client Request
    ↓
[CORS Middleware]
    ↓
[Exception Handling Middleware]
    ↓
[JWT Middleware] - Log user info
    ↓
[Authentication Middleware] - Verify token
    ↓
[Authorization Middleware] - Check role
    ↓
[Controller Action]
    ↓
Response
```

### Request không có Token
```
Client Request (no token)
    ↓
[Middleware pipeline]
    ↓
[Authentication] → ❌ Fail
    ↓
401 Unauthorized Response
```

### Request với sai Role
```
Customer tries Admin endpoint
    ↓
[Authentication] → ✅ Valid token
    ↓
[Authorization] → ❌ Wrong role
    ↓
403 Forbidden Response
```

---

## 🎯 Best Practices

1. **Luôn kiểm tra authentication trước**
   ```csharp
   [Authorize]  // Trước
   [RequireAdmin]  // Sau
   ```

2. **Sử dụng Claims để lấy user info**
   ```csharp
   var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
   ```

3. **Validate input trong Controller**
   ```csharp
   if (!ModelState.IsValid)
       return BadRequest(ModelState);
   ```

4. **Không bao giờ trả về password/hash**
   - UserDto không có PasswordHash field

5. **Log các hành động quan trọng**
   ```csharp
   _logger.LogInformation($"Admin {userId} created product {productId}");
   ```

---

## 🔜 Có Thể Mở Rộng

- [ ] Refresh token mechanism
- [ ] Token blacklist (logout)
- [ ] Rate limiting per user/role
- [ ] Audit log cho Admin actions
- [ ] Permission-based (không chỉ role)
- [ ] Multi-tenant support
- [ ] API versioning

---

**Backend với Middleware & Phân quyền đã hoàn thành! 🎉**
