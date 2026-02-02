import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './Checkout.css';

function Checkout() {
  const navigate = useNavigate();
  const { cart, clearCart, getTotalPrice, getTotalItems } = useCart();
  const { user } = useAuth();
  
  const [step, setStep] = useState(1); // 1: Shipping, 2: Payment, 3: Review
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    district: '',
    ward: '',
    note: ''
  });
  
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState({});

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const shippingFee = getTotalPrice() >= 500000 ? 0 : 30000;
  const totalAmount = getTotalPrice() + shippingFee;

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Vui lòng nhập họ tên';
    if (!formData.phone.trim()) newErrors.phone = 'Vui lòng nhập số điện thoại';
    if (!formData.address.trim()) newErrors.address = 'Vui lòng nhập địa chỉ';
    if (!formData.city.trim()) newErrors.city = 'Vui lòng nhập tỉnh/thành phố';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    if (paymentMethod === 'card') {
      const newErrors = {};
      if (!cardDetails.cardNumber.replace(/\s/g, '').match(/^\d{16}$/)) {
        newErrors.cardNumber = 'Số thẻ phải có 16 chữ số';
      }
      if (!cardDetails.cardName.trim()) newErrors.cardName = 'Vui lòng nhập tên chủ thẻ';
      if (!cardDetails.expiryDate.match(/^\d{2}\/\d{2}$/)) {
        newErrors.expiryDate = 'Định dạng MM/YY';
      }
      if (!cardDetails.cvv.match(/^\d{3}$/)) newErrors.cvv = 'CVV 3 số';
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }
    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const orderId = 'ORD' + Date.now().toString(36).toUpperCase();
    
    const order = {
      // Standard fields
      orderId: orderId,
      id: orderId,
      orderDate: new Date().toISOString(),
      date: new Date().toISOString(),
      
      // Shipping info (both formats for compatibility)
      shippingInfo: formData,
      customerInfo: formData,
      
      // Items with normalized image field
      items: cart.map(item => ({
        ...item,
        image: item.imageUrl || item.image
      })),
      
      // Pricing
      subtotal: getTotalPrice(),
      totalPrice: getTotalPrice(),
      shipping: shippingFee,
      shippingFee: shippingFee,
      total: totalAmount,
      totalAmount: totalAmount,
      discount: 0,
      
      totalItems: getTotalItems(),
      status: 'pending',
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'completed'
    };

    // Save order
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));

    clearCart();
    navigate(`/order-confirmation/${orderId}`);
  };

  if (cart.length === 0) {
    return (
      <div className="checkout-container">
        <div className="checkout-empty">
          <h2>Giỏ hàng trống</h2>
          <p>Vui lòng thêm sản phẩm trước khi thanh toán</p>
          <Link to="/" className="btn-primary">Tiếp tục mua sắm</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      {/* Header */}
      <header className="checkout-header">
        <Link to="/cart" className="back-btn">← Quay lại giỏ hàng</Link>
        <h1>Thanh toán</h1>
      </header>

      {/* Progress Steps */}
      <div className="checkout-steps">
        <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
          <span className="step-number">1</span>
          <span className="step-label">Giao hàng</span>
        </div>
        <div className="step-line"></div>
        <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
          <span className="step-number">2</span>
          <span className="step-label">Thanh toán</span>
        </div>
        <div className="step-line"></div>
        <div className={`step ${step >= 3 ? 'active' : ''}`}>
          <span className="step-number">3</span>
          <span className="step-label">Xác nhận</span>
        </div>
      </div>

      <div className="checkout-content">
        {/* Main Form */}
        <div className="checkout-main">
          {/* Step 1: Shipping */}
          {step === 1 && (
            <div className="checkout-section">
              <h2>📍 Thông tin giao hàng</h2>
              <div className="form-grid">
                <div className="form-group full">
                  <label>Họ và tên *</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    placeholder="Nguyễn Văn A"
                    className={errors.fullName ? 'error' : ''}
                  />
                  {errors.fullName && <span className="error-text">{errors.fullName}</span>}
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="form-group">
                  <label>Số điện thoại *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="0912 345 678"
                    className={errors.phone ? 'error' : ''}
                  />
                  {errors.phone && <span className="error-text">{errors.phone}</span>}
                </div>
                <div className="form-group full">
                  <label>Địa chỉ *</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Số nhà, tên đường..."
                    className={errors.address ? 'error' : ''}
                  />
                  {errors.address && <span className="error-text">{errors.address}</span>}
                </div>
                <div className="form-group">
                  <label>Tỉnh/Thành phố *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    placeholder="Hà Nội"
                    className={errors.city ? 'error' : ''}
                  />
                  {errors.city && <span className="error-text">{errors.city}</span>}
                </div>
                <div className="form-group">
                  <label>Quận/Huyện</label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({...formData, district: e.target.value})}
                    placeholder="Quận 1"
                  />
                </div>
                <div className="form-group full">
                  <label>Ghi chú</label>
                  <textarea
                    value={formData.note}
                    onChange={(e) => setFormData({...formData, note: e.target.value})}
                    placeholder="Ghi chú cho đơn hàng (không bắt buộc)"
                    rows="3"
                  />
                </div>
              </div>
              <button className="btn-next" onClick={handleNextStep}>
                Tiếp tục đến thanh toán →
              </button>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <div className="checkout-section">
              <h2>💳 Phương thức thanh toán</h2>
              <div className="payment-methods">
                <label className={`payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="payment-info">
                    <span className="payment-icon">💵</span>
                    <div>
                      <strong>Thanh toán khi nhận hàng (COD)</strong>
                      <p>Thanh toán bằng tiền mặt khi nhận hàng</p>
                    </div>
                  </div>
                </label>
                
                <label className={`payment-option ${paymentMethod === 'bank' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="bank"
                    checked={paymentMethod === 'bank'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="payment-info">
                    <span className="payment-icon">🏦</span>
                    <div>
                      <strong>Chuyển khoản ngân hàng</strong>
                      <p>Chuyển khoản đến tài khoản ngân hàng</p>
                    </div>
                  </div>
                </label>

                <label className={`payment-option ${paymentMethod === 'card' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="payment-info">
                    <span className="payment-icon">💳</span>
                    <div>
                      <strong>Thẻ tín dụng / Ghi nợ</strong>
                      <p>Visa, Mastercard, JCB</p>
                    </div>
                  </div>
                </label>

                <label className={`payment-option ${paymentMethod === 'momo' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="momo"
                    checked={paymentMethod === 'momo'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="payment-info">
                    <span className="payment-icon">📱</span>
                    <div>
                      <strong>Ví MoMo</strong>
                      <p>Thanh toán qua ví điện tử MoMo</p>
                    </div>
                  </div>
                </label>
              </div>

              {/* Card Details */}
              {paymentMethod === 'card' && (
                <div className="card-details">
                  <div className="form-group">
                    <label>Số thẻ</label>
                    <input
                      type="text"
                      value={cardDetails.cardNumber}
                      onChange={(e) => setCardDetails({...cardDetails, cardNumber: e.target.value})}
                      placeholder="1234 5678 9012 3456"
                      maxLength="19"
                      className={errors.cardNumber ? 'error' : ''}
                    />
                    {errors.cardNumber && <span className="error-text">{errors.cardNumber}</span>}
                  </div>
                  <div className="form-group">
                    <label>Tên chủ thẻ</label>
                    <input
                      type="text"
                      value={cardDetails.cardName}
                      onChange={(e) => setCardDetails({...cardDetails, cardName: e.target.value})}
                      placeholder="NGUYEN VAN A"
                      className={errors.cardName ? 'error' : ''}
                    />
                    {errors.cardName && <span className="error-text">{errors.cardName}</span>}
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Ngày hết hạn</label>
                      <input
                        type="text"
                        value={cardDetails.expiryDate}
                        onChange={(e) => setCardDetails({...cardDetails, expiryDate: e.target.value})}
                        placeholder="MM/YY"
                        maxLength="5"
                        className={errors.expiryDate ? 'error' : ''}
                      />
                      {errors.expiryDate && <span className="error-text">{errors.expiryDate}</span>}
                    </div>
                    <div className="form-group">
                      <label>CVV</label>
                      <input
                        type="password"
                        value={cardDetails.cvv}
                        onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                        placeholder="•••"
                        maxLength="3"
                        className={errors.cvv ? 'error' : ''}
                      />
                      {errors.cvv && <span className="error-text">{errors.cvv}</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* Bank Transfer Info */}
              {paymentMethod === 'bank' && (
                <div className="bank-info">
                  <h4>Thông tin chuyển khoản:</h4>
                  <p><strong>Ngân hàng:</strong> Vietcombank</p>
                  <p><strong>Số tài khoản:</strong> 1234567890</p>
                  <p><strong>Chủ tài khoản:</strong> KICKS SHOE STORE</p>
                  <p><strong>Nội dung:</strong> [Mã đơn hàng] - [SĐT]</p>
                </div>
              )}

              <div className="step-buttons">
                <button className="btn-back" onClick={() => setStep(1)}>← Quay lại</button>
                <button className="btn-next" onClick={handleNextStep}>Xác nhận đơn hàng →</button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Confirm */}
          {step === 3 && (
            <div className="checkout-section">
              <h2>✅ Xác nhận đơn hàng</h2>
              
              <div className="review-section">
                <h3>Thông tin giao hàng</h3>
                <div className="review-info">
                  <p><strong>{formData.fullName}</strong></p>
                  <p>{formData.phone}</p>
                  <p>{formData.address}</p>
                  <p>{formData.district}, {formData.city}</p>
                  {formData.note && <p><em>Ghi chú: {formData.note}</em></p>}
                </div>
                <button className="btn-edit" onClick={() => setStep(1)}>Sửa</button>
              </div>

              <div className="review-section">
                <h3>Phương thức thanh toán</h3>
                <div className="review-info">
                  <p>
                    {paymentMethod === 'cod' && '💵 Thanh toán khi nhận hàng'}
                    {paymentMethod === 'bank' && '🏦 Chuyển khoản ngân hàng'}
                    {paymentMethod === 'card' && '💳 Thẻ tín dụng/Ghi nợ'}
                    {paymentMethod === 'momo' && '📱 Ví MoMo'}
                  </p>
                </div>
                <button className="btn-edit" onClick={() => setStep(2)}>Sửa</button>
              </div>

              <div className="review-section">
                <h3>Sản phẩm ({getTotalItems()})</h3>
                <div className="review-items">
                  {cart.map((item, idx) => (
                    <div key={idx} className="review-item">
                      <img src={item.imageUrl} alt={item.name} />
                      <div className="item-details">
                        <p className="item-name">{item.name}</p>
                        <p className="item-variant">Size: {item.size} - {item.color}</p>
                        <p className="item-qty">SL: {item.quantity}</p>
                      </div>
                      <p className="item-price">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="step-buttons">
                <button className="btn-back" onClick={() => setStep(2)}>← Quay lại</button>
                <button 
                  className="btn-place-order" 
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Đang xử lý...' : `Đặt hàng - ${formatPrice(totalAmount)}`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <aside className="checkout-sidebar">
          <div className="order-summary">
            <h3>Đơn hàng của bạn</h3>
            <div className="summary-items">
              {cart.map((item, idx) => (
                <div key={idx} className="summary-item">
                  <div className="item-image">
                    <img src={item.imageUrl} alt={item.name} />
                    <span className="item-qty-badge">{item.quantity}</span>
                  </div>
                  <div className="item-info">
                    <p className="item-name">{item.name}</p>
                    <p className="item-variant">{item.size} / {item.color}</p>
                  </div>
                  <p className="item-price">{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="summary-totals">
              <div className="summary-row">
                <span>Tạm tính:</span>
                <span>{formatPrice(getTotalPrice())}</span>
              </div>
              <div className="summary-row">
                <span>Phí vận chuyển:</span>
                <span>{shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}</span>
              </div>
              {shippingFee > 0 && (
                <p className="free-shipping-note">
                  Miễn phí ship cho đơn hàng từ {formatPrice(500000)}
                </p>
              )}
              <div className="summary-divider"></div>
              <div className="summary-total">
                <span>Tổng cộng:</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Checkout;
