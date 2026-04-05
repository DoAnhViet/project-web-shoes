import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { logger, PaymentService, OrderService, PriceCalculatorService } from '../services';
import PriceBreakdown from '../components/PriceBreakdown';
import './Checkout.css';

function Checkout() {
  const navigate = useNavigate();
  const { cart, clearCart, getTotalPrice, getTotalItems } = useCart();
  const { user } = useAuth();
  
  const [isGuest, setIsGuest] = useState(!user);
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
  const [paymentResult, setPaymentResult] = useState(null); // eslint-disable-line no-unused-vars
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  
  // Loyalty points state
  const [pointsData, setPointsData] = useState(null);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [pointsDiscount, setPointsDiscount] = useState(0);
  const [pointsError, setPointsError] = useState('');

  // Load user points
  useEffect(() => {
    const loadPoints = async () => {
      if (!user?.id) return;
      
      try {
        const response = await fetch(`http://localhost:5240/api/points/${user.id}`);
        const data = await response.json();
        setPointsData(data);
      } catch (err) {
        console.error('Error loading points:', err);
      }
    };
    
    loadPoints();
  }, [user?.id]);

  // Get payment methods from Factory
  const paymentMethods = PaymentService.getPaymentMethods(); // eslint-disable-line no-unused-vars

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Apply coupon function
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Vui lòng nhập mã giảm giá');
      return;
    }

    setCouponLoading(true);
    setCouponError('');

    try {
      const response = await fetch('http://localhost:5240/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode,
          orderAmount: getTotalPrice()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setCouponError(data.message || 'Mã giảm giá không hợp lệ');
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon(data);
        setCouponError('');
        logger.info('Coupon applied', data);
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      setCouponError('Không thể xác thực mã giảm giá');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  // Handle points redemption
  const handleApplyPoints = () => {
    setPointsError('');
    
    if (!pointsData || pointsData.points < 100) {
      setPointsError('Cần tối thiểu 100 điểm để đổi');
      return;
    }
    
    if (pointsToRedeem % 100 !== 0) {
      setPointsError('Điểm phải là bội số của 100');
      return;
    }
    
    if (pointsToRedeem > pointsData.points) {
      setPointsError('Không đủ điểm');
      return;
    }
    
    // Calculate discount: 100 points = 10,000 VND
    const discount = (pointsToRedeem / 100) * 10000;
    setPointsDiscount(discount);
    logger.info('Points applied', { points: pointsToRedeem, discount });
  };

  const removePoints = () => {
    setPointsToRedeem(0);
    setPointsDiscount(0);
    setPointsError('');
  };

  const parseSizeInventory = (sizeString) => {
    if (!sizeString || typeof sizeString !== 'string') return {};
    return sizeString
      .split(',')
      .map(entry => entry.trim())
      .filter(Boolean)
      .reduce((acc, entry) => {
        const [sizePart, qtyPart] = entry.split(':').map(part => part.trim());
        const qty = parseInt(qtyPart, 10);
        if (sizePart) {
          acc[sizePart] = Number.isNaN(qty) ? 0 : qty;
        }
        return acc;
      }, {});
  };

  const updateProductInventory = (cartItems) => {
    try {
      const inventoryData = JSON.parse(localStorage.getItem('productInventory') || '{}');
      let hasChanges = false;

      cartItems.forEach(item => {
        const productId = item.id;
        const selectedSize = item.size;
        const itemInventory = item.sizeInventory || parseSizeInventory(item.sizeString || '');

        if (!selectedSize || !itemInventory || typeof itemInventory[selectedSize] !== 'number') {
          return;
        }

        const currentInventory = inventoryData[productId] || itemInventory;
        const currentSizeQty = Number.isFinite(currentInventory[selectedSize]) ? currentInventory[selectedSize] : 0;
        const newSizeQty = Math.max(0, currentSizeQty - item.quantity);
        currentInventory[selectedSize] = newSizeQty;
        inventoryData[productId] = currentInventory;
        hasChanges = true;
      });

      if (hasChanges) {
        localStorage.setItem('productInventory', JSON.stringify(inventoryData));
        localStorage.setItem('lastOrderSync', Date.now().toString());
      }
    } catch (err) {
      console.error('Error updating product inventory in localStorage:', err);
    }
  };

  // Calculate bulk discount for checkout
  const calculateBulkDiscountTotal = () => {
    let totalDiscount = 0;
    console.log('🔍 Calculating bulk discounts for cart:', cart);
    
    cart.forEach(item => {
      console.log('🔍 Item:', item.name, 'Quantity:', item.quantity, 'BulkRules:', item.bulkDiscountRules);
      
      if (!item.bulkDiscountRules) {
        console.log('🔍 No bulk discount rules for:', item.name);
        return;
      }
      
      try {
        const rules = JSON.parse(item.bulkDiscountRules);
        const applicableRule = rules
          .filter(rule => item.quantity >= rule.minQty)
          .sort((a, b) => b.discount - a.discount)[0];
        
        if (applicableRule) {
          const itemDiscount = (item.price * item.quantity * applicableRule.discount) / 100;
          totalDiscount += itemDiscount;
          console.log('🔍 Applied bulk discount:', applicableRule, 'Discount amount:', itemDiscount);
        } else {
          console.log('🔍 No applicable rule for quantity:', item.quantity);
        }
      } catch (e) {
        console.error('Error parsing bulk discount rules:', e);
      }
    });
    
    console.log('🔍 Total bulk discount:', totalDiscount);
    return totalDiscount;
  };

  // Use Decorator pattern for price calculation
  const baseCalculation = PriceCalculatorService.calculateOrderTotal(cart, {
    discountPercent: 0,
    shippingFee: 30000,
    freeShippingThreshold: 500000
  });
  
  // Apply all discounts
  const couponDiscount = appliedCoupon?.discountAmount || 0;
  const bulkDiscount = calculateBulkDiscountTotal();
  const priceCalculation = {
    ...baseCalculation,
    couponDiscount: couponDiscount,
    bulkDiscount: bulkDiscount,
    pointsDiscount: pointsDiscount,
    total: baseCalculation.total - couponDiscount - bulkDiscount - pointsDiscount
  };
  
  const shippingFee = priceCalculation.breakdown.find(s => s.step === 'Phí vận chuyển')?.added || 0;
  const totalAmount = priceCalculation.finalPrice;

  const validateStep1 = () => {
    const newErrors = {};
    const trimmedName = formData.fullName.trim();
    const trimmedPhone = formData.phone.trim();
    const trimmedAddress = formData.address.trim();
    const trimmedCity = formData.city.trim();

    if (!trimmedName) newErrors.fullName = 'Vui lòng nhập họ tên';
    if (trimmedName && trimmedName.length < 3) newErrors.fullName = 'Họ tên phải có ít nhất 3 ký tự';
    if (trimmedName && trimmedName.length > 100) newErrors.fullName = 'Họ tên không được vượt quá 100 ký tự';
    
    if (!trimmedPhone) newErrors.phone = 'Vui lòng nhập số điện thoại';
    if (trimmedPhone && !/^[0-9]{10,11}$/.test(trimmedPhone)) newErrors.phone = 'Số điện thoại phải gồm 10-11 chữ số';
    
    if (!trimmedAddress) newErrors.address = 'Vui lòng nhập địa chỉ';
    if (trimmedAddress && trimmedAddress.length < 5) newErrors.address = 'Địa chỉ phải có ít nhất 5 ký tự';
    
    if (!trimmedCity) newErrors.city = 'Vui lòng nhập tỉnh/thành phố';
    if (!formData.district && formData.district !== '') newErrors.district = 'Vui lòng nhập quận/huyện';
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    
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
    if (isProcessing) return;
    
    if (!validateStep1()) {
      alert('Vui lòng điền đầy đủ và chính xác thông tin giao hàng');
      setStep(1);
      return;
    }
    
    if (!validateStep2()) {
      alert('Vui lòng điền đầy đủ và chính xác thông tin thanh toán');
      setStep(2);
      return;
    }

    setIsProcessing(true);
    logger.info('Starting order placement', { paymentMethod, totalAmount });
    
    try {
      // Use Factory Pattern - Process payment
      const paymentProcessResult = await PaymentService.processPayment(paymentMethod, {
        id: 'ORD' + Date.now().toString(36).toUpperCase(),
        amount: totalAmount,
        customerInfo: formData
      });
      
      setPaymentResult(paymentProcessResult);
      logger.info('Payment processed', paymentProcessResult);

      const orderId = 'ORD' + Date.now().toString(36).toUpperCase();
      
      // Calculate bulk discount before sending
      const bulkDiscount = calculateBulkDiscountTotal();
      const finalTotal = getTotalPrice() - bulkDiscount - couponDiscount - pointsDiscount + shippingFee;
      
      // Format data for API (CreateOrderDto)
      const apiOrderData = {
        userId: user?.id,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        district: formData.district,
        ward: formData.ward,
        note: formData.note,
        paymentMethod: paymentMethod,
        discount: bulkDiscount + couponDiscount + pointsDiscount,
        items: cart.map(item => ({
          productId: item.id,
          productName: item.name,
          productImage: item.imageUrl || item.image || '',
          size: item.size || '',
          color: item.color || '',
          price: item.price,
          quantity: item.quantity
        }))
      };

      // DIRECT API CALL - bypass OrderService for reliability
      let createdOrder = null;
      let confirmedOrderId = orderId;
      
      try {
        console.log('📦 Sending order to API:', apiOrderData);
        const response = await fetch('http://localhost:5240/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(apiOrderData)
        });
        
        if (response.ok) {
          createdOrder = await response.json();
          confirmedOrderId = createdOrder.orderCode || orderId;
          console.log('✅ Order created in database:', createdOrder);
        } else {
          const errorText = await response.text();
          console.error('❌ API Error:', response.status, errorText);
          throw new Error(`API Error: ${response.status}`);
        }
      } catch (apiError) {
        console.error('❌ Failed to create order via API:', apiError);
        // Continue with local order only
      }

      // Save to localStorage for user's order history
      const localOrderData = {
        orderId: confirmedOrderId,
        id: createdOrder?.id || orderId,
        orderCode: confirmedOrderId,
        userId: user?.id || null,
        orderDate: new Date().toISOString(),
        shippingInfo: formData,
        items: cart.map(item => ({
          ...item,
          image: item.imageUrl || item.image
        })),
        subtotal: getTotalPrice(),
        bulkDiscount: bulkDiscount,
        couponDiscount: couponDiscount,
        pointsDiscount: pointsDiscount,
        shipping: shippingFee,
        total: finalTotal,
        status: 'pending',
        paymentMethod,
        paymentStatus: paymentProcessResult.status
      };
      
      // Save to localStorage for order tracking
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const orderKey = currentUser?.id ? `orders_user_${currentUser.id}` : 'orders_guest';
      const existingOrders = JSON.parse(localStorage.getItem(orderKey) || '[]');
      existingOrders.unshift(localOrderData);
      localStorage.setItem(orderKey, JSON.stringify(existingOrders));
      
      // Also save to generic orders for admin
      const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      allOrders.unshift(localOrderData);
      localStorage.setItem('orders', JSON.stringify(allOrders));
      localStorage.setItem('lastOrderSync', Date.now().toString());

      const adminNotifications = JSON.parse(localStorage.getItem('notifications_admin') || '[]');
      adminNotifications.unshift({
        id: `admin_${Date.now()}`,
        message: `Đơn hàng mới ${confirmedOrderId} vừa được đặt bởi ${formData.fullName}`,
        timestamp: new Date().toISOString(),
        orderId: confirmedOrderId
      });
      localStorage.setItem('notifications_admin', JSON.stringify(adminNotifications));
      
      updateProductInventory(cart);
      logger.info('Order created successfully', { orderId: confirmedOrderId });

      // Apply coupon usage if coupon was used
      if (appliedCoupon) {
        try {
          await fetch('http://localhost:5240/api/coupons/apply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: appliedCoupon.coupon.code })
          });
          logger.info('Coupon usage recorded', { code: appliedCoupon.coupon.code });
        } catch (err) {
          logger.error('Failed to record coupon usage', err);
        }
      }
      
      // Loyalty points handling (only for logged in users)
      if (user?.id) {
        // Redeem points if used
        if (pointsToRedeem > 0) {
          try {
            await fetch('http://localhost:5240/api/points/redeem', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                userId: user.id, 
                pointsToRedeem: pointsToRedeem 
              })
            });
            logger.info('Points redeemed', { points: pointsToRedeem });
          } catch (err) {
            logger.error('Failed to redeem points', err);
          }
        }
        
        // Earn points from purchase
        try {
          await fetch('http://localhost:5240/api/points/earn', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              orderAmount: getTotalPrice(),
              orderCode: confirmedOrderId
            })
          });
          logger.info('Points earned from purchase');
        } catch (err) {
          logger.error('Failed to earn points', err);
        }
      }

      clearCart();
      navigate(`/order-confirmation/${confirmedOrderId}`);
    } catch (error) {
      logger.error('Order placement failed', error);
      alert('Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
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
          {/* Guest vs Login choice */}
          {!user && step === 1 && (
            <div className="checkout-section guest-choice">
              <div className="guest-options">
                <button 
                  className={`guest-option ${isGuest ? 'active' : ''}`}
                  onClick={() => setIsGuest(true)}
                >
                  <span>🛒</span>
                  <strong>Tiếp tục với khách</strong>
                  <small>Đặt hàng nhanh không cần tài khoản</small>
                </button>
                <button 
                  className="guest-option"
                  onClick={() => navigate('/login', { state: { from: '/checkout' } })}
                >
                  <span>👤</span>
                  <strong>Đăng nhập</strong>
                  <small>Lưu lại đơn hàng và theo dõi</small>
                </button>
              </div>
            </div>
          )}

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
                <button type="button" className="btn-back" onClick={() => setStep(1)}>← Quay lại</button>
                <button type="button" className="btn-next" onClick={handleNextStep}>Xác nhận đơn hàng →</button>
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
                <button type="button" className="btn-back" onClick={() => setStep(2)}>← Quay lại</button>
                <button 
                  type="button"
                  className="btn-place-order" 
                  onClick={handlePlaceOrder}
                  disabled={isProcessing || cart.length === 0}
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
            
            {/* Coupon Input */}
            <div className="coupon-section">
              <h4>🎟️ Mã giảm giá</h4>
              {!appliedCoupon ? (
                <div className="coupon-input-group">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Nhập mã giảm giá"
                    disabled={couponLoading}
                  />
                  <button 
                    onClick={handleApplyCoupon}
                    disabled={couponLoading}
                    className="btn-apply-coupon"
                  >
                    {couponLoading ? 'Đang xử lý...' : 'Áp dụng'}
                  </button>
                </div>
              ) : (
                <div className="coupon-applied">
                  <div className="coupon-info">
                    <span className="coupon-code">✓ {appliedCoupon.coupon.code}</span>
                    <span className="coupon-desc">{appliedCoupon.coupon.description}</span>
                  </div>
                  <button onClick={removeCoupon} className="btn-remove-coupon">✕</button>
                </div>
              )}
              {couponError && <p className="coupon-error">{couponError}</p>}
            </div>
            
            {/* Loyalty Points Section - Only for logged in users */}
            {user && pointsData && pointsData.points >= 100 && (
              <div className="points-section">
                <h4>🎁 Điểm Thưởng</h4>
                <div className="points-balance-info">
                  <span>Bạn có: <strong>{pointsData.points} điểm</strong></span>
                </div>
                {pointsDiscount === 0 ? (
                  <div className="points-input-group">
                    <input
                      type="number"
                      value={pointsToRedeem}
                      onChange={(e) => setPointsToRedeem(parseInt(e.target.value) || 0)}
                      placeholder="Nhập số điểm (bội số của 100)"
                      min="100"
                      step="100"
                      max={pointsData.points}
                    />
                    <button 
                      onClick={handleApplyPoints}
                      className="btn-apply-points"
                    >
                      Đổi điểm
                    </button>
                  </div>
                ) : (
                  <div className="points-applied">
                    <div className="points-info">
                      <span className="points-used">✓ Dùng {pointsToRedeem} điểm</span>
                      <span className="points-value">Giảm {formatPrice(pointsDiscount)}</span>
                    </div>
                    <button onClick={removePoints} className="btn-remove-points">✕</button>
                  </div>
                )}
                {pointsError && <p className="points-error">{pointsError}</p>}
                <small className="points-hint">💡 100 điểm = 10.000đ giảm giá</small>
              </div>
            )}
            
            {/* DECORATOR PATTERN - Price Breakdown Component */}
            <PriceBreakdown items={cart} discountPercent={0} showDetails={true} />
            
            {/* Show coupon discount separately */}
            {appliedCoupon && (
              <div className="price-row coupon-discount-row">
                <span>Giảm giá coupon:</span>
                <span className="discount-value">-{formatPrice(couponDiscount)}</span>
              </div>
            )}
            
            {/* Show bulk discount */}
            {bulkDiscount > 0 && (
              <div className="price-row bulk-discount-row">
                <span>🎁 Giảm giá số lượng:</span>
                <span className="discount-value">-{formatPrice(bulkDiscount)}</span>
              </div>
            )}
            
            {/* Show points discount */}
            {pointsDiscount > 0 && (
              <div className="price-row points-discount-row">
                <span>Giảm giá điểm thưởng:</span>
                <span className="discount-value">-{formatPrice(pointsDiscount)}</span>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Checkout;
