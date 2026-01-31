# 🛒 Hệ Thống Giỏ Hàng Hoàn Chỉnh

## 📋 Tổng Quan

Đã xây dựng một hệ thống giỏ hàng **đầy đủ**, **có logic**, với tất cả các chức năng cần thiết cho một ứng dụng e-commerce hiện đại.

---

## ✨ Các Tính Năng Chính

### 1. **CartContext (Context API) - Quản Lý Trạng Thái Toàn Cục**
**File:** `client/src/context/CartContext.jsx`

- ✅ **Lưu trữ giỏ hàng** trong `localStorage` để dữ liệu persist qua session
- ✅ **Thêm sản phẩm** vào giỏ (tự động merge nếu sản phẩm đã tồn tại)
- ✅ **Xóa sản phẩm** khỏi giỏ
- ✅ **Cập nhật số lượng** sản phẩm
- ✅ **Xóa toàn bộ giỏ**
- ✅ **Tính toán tổng tiền** tự động
- ✅ **Đếm tổng sản phẩm** (bao gồm số lượng)

**Cách sử dụng:**
```jsx
import { useCart } from '../context/CartContext';

function MyComponent() {
  const { 
    cart,                    // Mảng sản phẩm trong giỏ
    addToCart,              // Hàm thêm sản phẩm
    removeFromCart,         // Hàm xóa sản phẩm
    updateQuantity,         // Hàm cập nhật số lượng
    clearCart,              // Hàm xóa toàn bộ
    getTotalPrice,          // Hàm tính tổng tiền
    getTotalItems           // Hàm đếm tổng sản phẩm
  } = useCart();
}
```

---

### 2. **Trang Giỏ Hàng (Cart Page)**
**File:** `client/src/pages/Cart.jsx`

#### Chức Năng:
- ✅ **Hiển thị danh sách sản phẩm** trong giỏ
- ✅ **Quản lý số lượng** (+ / - / nhập số)
- ✅ **Xóa từng sản phẩm** khỏi giỏ
- ✅ **Xóa toàn bộ giỏ** (có xác nhận)
- ✅ **Tính toán tổng tiền** tự động
- ✅ **Hiển thị trạng thái trống** nếu không có sản phẩm
- ✅ **Form thanh toán** với các trường:
  - Họ và tên
  - Email
  - Số điện thoại
  - Địa chỉ giao hàng
  - Thành phố
  - Mã bưu chính

#### Hành Động:
1. **Nhấn "Tiếp tục thanh toán"** → Hiển thị form checkout
2. **Nhập đầy đủ thông tin** → Validation tự động
3. **Nhấn "Đặt hàng"** → Tạo đơn hàng
4. **Hiển thị màn hình xác nhận** thành công
5. **Redirect tới Orders** hoặc **Quay về trang chủ**

---

### 3. **Trang Chi Tiết Sản Phẩm (ProductDetail)**
**Cập nhật:** `client/src/pages/ProductDetail.jsx`

#### Chức Năng Thêm:
- ✅ **Nút "Thêm vào giỏ hàng"**
- ✅ **Chọn số lượng** trước khi thêm
- ✅ **Hiệu ứng khi thêm thành công** (nút chuyển sang xanh với "✓ Đã thêm")
- ✅ **Nút "Xem giỏ hàng"** xuất hiện sau khi thêm (2 giây)
- ✅ **Kiểm tra stock** trước khi thêm

#### Luồng:
```
Chọn số lượng → Nhấn "Thêm vào giỏ hàng" → Nút chuyển xanh
→ Hiện nút "Xem giỏ hàng" → Click để đi tới Cart
```

---

### 4. **Trang Lịch Sử Đơn Hàng (Orders)**
**File:** `client/src/pages/Orders.jsx`

#### Chức Năng:
- ✅ **Danh sách tất cả đơn hàng** người dùng đã tạo
- ✅ **Hiển thị thông tin chi tiết**:
  - Mã đơn hàng (ID duy nhất)
  - Trạng thái đơn hàng (Pending, Confirmed, Shipping, Delivered, Cancelled)
  - Ngày đặt hàng
  - Tổng tiền
- ✅ **Hiển thị thông tin giao hàng**:
  - Tên người nhận
  - Địa chỉ
  - Thành phố
  - Số điện thoại
- ✅ **Danh sách sản phẩm** trong mỗi đơn hàng
  - Hình ảnh sản phẩm
  - Tên, thương hiệu, size, màu
  - Số lượng, giá, thành tiền

#### Trạng Thái Đơn Hàng:
- 🟠 **pending** - Chờ xử lý
- 🔵 **confirmed** - Đã xác nhận
- 🟣 **shipping** - Đang giao
- 🟢 **delivered** - Đã giao
- 🔴 **cancelled** - Đã hủy

---

### 5. **Header Navigation**
**Cập nhật:** `client/src/pages/Home.jsx`

#### Thêm Tính Năng:
- ✅ **Giỏ hàng icon** liên kết tới `/cart`
- ✅ **Badge hiển thị số lượng** sản phẩm trong giỏ (đỏ, hình tròn)
- ✅ **Update real-time** khi thêm/xóa sản phẩm

---

## 🔄 Luồng Đặt Hàng

```
┌─────────────────┐
│   Trang Chủ     │
│  (Xem Sản Phẩm) │
└────────┬────────┘
         │ Click sản phẩm
         ▼
┌─────────────────────────┐
│ Chi Tiết Sản Phẩm       │
│ - Xem thông tin đầy đủ  │
│ - Chọn số lượng         │
└────────┬────────────────┘
         │ Nhấn "Thêm vào giỏ hàng"
         ▼
┌──────────────────┐
│  Thêm Thành Công │
│  (Nút xanh + OK) │
└────────┬─────────┘
         │ Nhấn "Xem giỏ hàng" hoặc Click cart icon
         ▼
┌────────────────────────┐
│  Trang Giỏ Hàng        │
│ - Xem danh sách item   │
│ - Quản lý số lượng     │
│ - Xóa sản phẩm         │
└────────┬───────────────┘
         │ Nhấn "Tiếp tục thanh toán"
         ▼
┌────────────────────────┐
│  Form Checkout         │
│ - Nhập thông tin khách │
│ - Điền địa chỉ giao    │
└────────┬───────────────┘
         │ Nhấn "Đặt hàng"
         ▼
┌────────────────────────┐
│  Đơn Hàng Thành Công   │
│ - Hiển thị mã đơn      │
│ - Tóm tắt đơn hàng     │
└────────┬───────────────┘
         │
         ├─► "Xem lịch sử" ──► Orders Page
         │
         └─► "Tiếp tục" ────► Home Page
```

---

## 💾 Lưu Trữ Dữ Liệu

### localStorage Keys:
```javascript
// Giỏ hàng
localStorage.getItem('cart')           // [{ id, name, price, quantity, ... }]

// Lịch sử đơn hàng
localStorage.getItem('orders')         // [{ id, customerInfo, items, totalPrice, ... }]
```

### Cấu Trúc Item trong Giỏ:
```javascript
{
  id: 1,
  name: "Nike Air Max",
  price: 2500000,
  imageUrl: "url...",
  brand: "Nike",
  size: "42",
  color: "Đen",
  quantity: 2,
  stock: 10
}
```

### Cấu Trúc Đơn Hàng:
```javascript
{
  id: "abc123xyz",
  customerInfo: {
    fullName: "Nguyễn Văn A",
    email: "nguyena@example.com",
    phone: "0123456789",
    address: "Số 1 Nguyễn Huệ",
    city: "TP. Hồ Chí Minh",
    postalCode: "700000"
  },
  items: [ /* mảng sản phẩm */ ],
  totalPrice: 5000000,
  totalItems: 2,
  date: "31/01/2026 14:30:45",
  status: "pending"
}
```

---

## 🎨 Giao Diện & Responsive

### Desktop:
- ✅ Giỏ hàng 2 cột (danh sách + tóm tắt)
- ✅ Form thanh toán rộng
- ✅ Các nút hành động rõ ràng

### Tablet (768px):
- ✅ Giỏ hàng 1 cột
- ✅ Tóm tắt sticky phía dưới
- ✅ Form đơn giản hơn

### Mobile (480px):
- ✅ Giỏ hàng cộp nhất
- ✅ Nút full width
- ✅ Font nhỏ hợp lý

---

## 🚀 Sử Dụng

### 1. **Thêm sản phẩm vào giỏ:**
```jsx
const { addToCart } = useCart();

addToCart(product, quantity);
```

### 2. **Xóa sản phẩm:**
```jsx
removeFromCart(productId, size, color);
```

### 3. **Cập nhật số lượng:**
```jsx
updateQuantity(productId, size, color, newQuantity);
```

### 4. **Lấy tổng tiền:**
```jsx
const total = getTotalPrice();  // VND
```

### 5. **Lấy số sản phẩm:**
```jsx
const itemCount = getTotalItems();  // Tổng tất cả quantity
const cartItemsCount = cart.length;  // Số dòng hàng
```

---

## 📱 Các Trang & Routes

| Route | Trang | Mô Tả |
|-------|-------|-------|
| `/` | Home | Trang chủ, danh sách sản phẩm |
| `/product/:id` | ProductDetail | Chi tiết sản phẩm + Thêm giỏ |
| `/cart` | Cart | Giỏ hàng + Checkout |
| `/orders` | Orders | Lịch sử đơn hàng |
| `/admin` | Admin | Quản lý sản phẩm & danh mục |
| `/api-test` | ApiTest | Test API |

---

## ⚙️ Kỹ Thuật

### Công Nghệ Sử Dụng:
- **React Context API** - State management
- **localStorage** - Persistent storage
- **React Router v7** - Routing
- **Axios** - API calls
- **CSS3** - Styling & animations

### Tính Năng:
- ✅ Real-time cart updates
- ✅ Validation form
- ✅ Responsive design
- ✅ Smooth animations
- ✅ Data persistence
- ✅ Order confirmation
- ✅ Order history tracking

---

## 🎯 Các Tính Năng Có Thể Mở Rộng

1. **Payment Gateway Integration**
   - Stripe, PayPal, Momo, etc.

2. **Order Status Updates**
   - Admin có thể cập nhật trạng thái đơn hàng
   - Email notifications

3. **User Accounts**
   - Login/Register
   - Saved addresses
   - Order history per user

4. **Wishlist**
   - Save sản phẩm yêu thích
   - Share wishlist

5. **Coupon/Discount**
   - Apply coupon codes
   - Automatic discounts

6. **Inventory Management**
   - Real-time stock updates
   - Out of stock notifications

---

## ✅ Tóm Tắt

Hệ thống giỏ hàng **hoàn chỉnh** với:
- ✅ **CartContext** để quản lý state
- ✅ **Trang Cart** với checkout form
- ✅ **Trang Orders** với lịch sử
- ✅ **Persistent storage** trong localStorage
- ✅ **Real-time cart badge** trên header
- ✅ **Full responsive design**
- ✅ **Validation & error handling**
- ✅ **Order confirmation page**

**Tất cả đều có logic rõ ràng, dễ mở rộng và bảo trì! 🎉**
