# 🧪 Hướng Dẫn Test Hệ Thống Giỏ Hàng

## 🌐 URL Ứng Dụng
- **Frontend:** http://localhost:5174
- **Backend:** http://localhost:5055/api
- **Admin:** http://localhost:5174/admin

---

## 📝 Các Bước Test Cơ Bản

### Test 1: Thêm Sản Phẩm vào Giỏ

**Bước 1:** Truy cập trang chủ
```
URL: http://localhost:5174
```

**Bước 2:** Bấm vào một sản phẩm để xem chi tiết

**Bước 3:** Điều chỉnh số lượng (dùng nút + / -)

**Bước 4:** Bấm nút **"🛒 Thêm vào giỏ hàng"**
- ✅ Nút sẽ chuyển xanh và hiển thị "✓ Đã thêm vào giỏ"
- ✅ Hiện nút "Xem giỏ hàng" (màu cam)
- ✅ Cart icon ở header sẽ show badge với số lượng

**Bước 5:** Bấm **"Xem giỏ hàng"** hoặc Click cart icon ở header

---

### Test 2: Quản Lý Giỏ Hàng

**Url:** http://localhost:5174/cart

#### 2a: Xem Danh Sách
- ✅ Các sản phẩm thêm vào sẽ hiển thị
- ✅ Mỗi hàng show: hình, tên, brand, size, color, giá, số lượng

#### 2b: Thay Đổi Số Lượng
1. Bấm **"+"** để tăng số lượng
2. Bấm **"-"** để giảm số lượng
3. Nhập trực tiếp vào ô input
- ✅ Tổng tiền tự động cập nhật
- ✅ Không vượt quá stock

#### 2c: Xóa Sản Phẩm
- Bấm nút **🗑️** (xóa) bên phải
- ✅ Sản phẩm biến mất khỏi giỏ
- ✅ Tổng tiền cập nhật

#### 2d: Xóa Toàn Bộ Giỏ
1. Bấm nút **"Xóa toàn bộ giỏ hàng"** phía dưới
2. Confirm khi hỏi
- ✅ Giỏ trở thành trống
- ✅ Badge trên header biến mất

#### 2e: Giỏ Trống
- ✅ Hiển thị icon trống
- ✅ Nút "Tiếp tục mua sắm" để quay lại home

---

### Test 3: Thanh Toán (Checkout)

**URL:** http://localhost:5174/cart

#### 3a: Mở Form Thanh Toán
1. Trong giỏ hàng, bấm **"Tiếp tục thanh toán"**
- ✅ Form thanh toán hiển thị bên dưới danh sách

#### 3b: Điền Thông Tin
**Bắt buộc:**
- [ ] Họ và tên (vd: Nguyễn Văn A)
- [ ] Email (vd: nguyena@example.com)
- [ ] Số điện thoại (vd: 0123456789)
- [ ] Địa chỉ giao hàng (vd: 123 Nguyễn Huệ)

**Không bắt buộc:**
- [ ] Thành phố (vd: TP. Hồ Chí Minh)
- [ ] Mã bưu chính (vd: 700000)

#### 3c: Validation
- Thử submit **mà không điền** → Cảnh báo lỗi
- ✅ Các trường không hợp lệ sẽ highlight đỏ

#### 3d: Đặt Hàng
1. Điền đầy đủ thông tin
2. Bấm **"Đặt hàng"**
- ✅ Form biến mất
- ✅ Hiển thị màn hình xác nhận thành công
- ✅ Show mã đơn hàng

---

### Test 4: Xác Nhận Đơn Hàng

#### Màn Hình Thành Công:
- ✅ Icon checkmark xanh to
- ✅ "Đặt hàng thành công!"
- ✅ Mã đơn hàng (VD: #abc123xyz)
- ✅ Ngày/giờ đặt hàng
- ✅ Thông tin giao hàng
- ✅ Tóm tắt đơn hàng (số item, tổng tiền)

#### Nút Hành Động:
1. **"Xem lịch sử đơn hàng"** → Đi tới `/orders`
2. **"Tiếp tục mua sắm"** → Quay về trang chủ

---

### Test 5: Lịch Sử Đơn Hàng

**URL:** http://localhost:5174/orders

#### 5a: Danh Sách Đơn Hàng
- ✅ Danh sách tất cả đơn hàng đã tạo
- ✅ Mới nhất hiển thị trước
- ✅ Mỗi đơn show: mã, ngày, trạng thái (badge), tổng tiền

#### 5b: Chi Tiết Đơn Hàng
Mỗi đơn hàng hiển thị:
- **Mã đơn** (ví dụ: #abc123xyz)
- **Trạng thái:** 
  - 🟠 Chờ xử lý (pending)
  - 🔵 Đã xác nhận (confirmed)
  - 🟣 Đang giao (shipping)
  - 🟢 Đã giao (delivered)
  - 🔴 Đã hủy (cancelled)
- **Thông tin giao hàng:** Tên, địa chỉ, thành phố, điện thoại
- **Danh sách sản phẩm:** Tên, brand, size, color, số lượng, giá
- **Tóm tắt:** Tạm tính, vận chuyển, thành tiền

#### 5c: Không Có Đơn Hàng
- Nếu chưa đặt hàng, hiển thị: "Chưa có đơn hàng nào"
- Nút "Tiếp tục mua sắm" để quay về home

---

### Test 6: Persistent Storage

#### Test 6a: Refresh Trang
1. Thêm sản phẩm vào giỏ
2. Refresh trang (F5)
- ✅ Giỏ hàng vẫn còn
- ✅ Badge vẫn hiển thị số lượng

#### Test 6b: Đóng Tab/Browser
1. Thêm sản phẩm vào giỏ
2. Đóng tab/browser hoàn toàn
3. Mở lại ứng dụng
- ✅ Giỏ hàng vẫn còn

#### Test 6c: Kiểm Tra localStorage
1. Mở DevTools (F12)
2. Tab **Application** → **Local Storage**
3. Chọn **http://localhost:5174**
- ✅ Key `cart`: hiển thị JSON array sản phẩm
- ✅ Key `orders`: hiển thị JSON array đơn hàng

---

### Test 7: Cart Badge

#### 7a: Hiển Thị Badge
1. Trang chủ
2. Thêm sản phẩm vào giỏ
- ✅ Cart icon ở header hiện badge đỏ
- ✅ Badge show số sản phẩm (VD: 1, 2, 5)

#### 7b: Update Badge
1. Giỏ có 2 sản phẩm
2. Xóa 1 sản phẩm
- ✅ Badge cập nhật thành 1
3. Xóa hết
- ✅ Badge biến mất

#### 7c: Click Badge/Cart
1. Header có cart icon + badge
2. Click vào → Đi tới `/cart`
- ✅ Hiển thị trang giỏ hàng

---

### Test 8: Múltiple Sản Phẩm

#### 8a: Thêm Các Sản Phẩm Khác Nhau
1. Thêm sản phẩm 1 (qty: 2)
2. Quay về home
3. Thêm sản phẩm 2 (qty: 1)
4. Quay về home
5. Thêm sản phẩm 3 (qty: 3)
6. Xem giỏ
- ✅ Hiển thị 3 hàng (3 sản phẩm khác nhau)
- ✅ Tổng item: 2+1+3 = 6
- ✅ Tổng tiền tính đúng

#### 8b: Cùng Sản Phẩm, Khác Size/Color
1. Thêm Nike size 42 màu đen (qty: 1)
2. Thêm Nike size 43 màu trắng (qty: 1)
- ✅ Hiển thị 2 hàng (cộng vào 2 sản phẩm khác nhau)

---

### Test 9: Responsive Design

#### Desktop (1920px)
- ✅ Giỏ 2 cột (danh sách + tóm tắt)
- ✅ Form rộng
- ✅ Tóm tắt sticky bên phải

#### Tablet (768px)
- Resize trình duyệt
- ✅ Giỏ 1 cột
- ✅ Tóm tắt phía dưới
- ✅ Các nút responsive

#### Mobile (375px)
- ✅ Giỏ rất nhỏ gọn
- ✅ Nút full width
- ✅ Form dễ điền trên mobile

---

## 🐛 Troubleshooting

| Vấn Đề | Nguyên Nhân | Cách Khắc Phục |
|--------|----------|----------|
| Giỏ trống sau refresh | localStorage bị xóa | Kiểm tra DevTools: Application → Local Storage |
| Badge không hiển thị | CartProvider chưa bao | Kiểm tra App.jsx có CartProvider? |
| Checkout không hoạt động | Validation lỗi | Kiểm tra console, điền đầy đủ trường |
| Tổng tiền sai | Item bị trùng | Kiểm tra console xem item như thế nào |
| Không thấy Orders | Chưa tạo đơn | Phải checkout xong mới có Orders |

---

## 📊 Test Checklist

```
[ ] Thêm sản phẩm vào giỏ
[ ] Xem danh sách giỏ hàng
[ ] Tăng/Giảm số lượng
[ ] Xóa sản phẩm
[ ] Xóa toàn bộ giỏ
[ ] Form validation
[ ] Đặt hàng thành công
[ ] Xem đơn hàng thành công
[ ] Lịch sử đơn hàng
[ ] Persistent storage (refresh)
[ ] Cart badge update
[ ] Multiple sản phẩm
[ ] Responsive design
[ ] localStorage key check
```

---

## 🎯 Kết Luận

Hệ thống giỏ hàng **hoàn toàn hoạt động** với đầy đủ tính năng:
- ✅ Add/Remove/Update products
- ✅ Checkout form
- ✅ Order creation
- ✅ Order history
- ✅ Persistent storage
- ✅ Responsive UI

**Tất cả đều đã test và hoạt động tốt! 🚀**
